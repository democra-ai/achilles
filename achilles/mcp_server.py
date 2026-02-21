"""Achilles Vault MCP Server — Real Model Context Protocol server.

Exposes vault tools (get/list/set/delete secrets) via MCP protocol.
Runs as a standalone process on port 8901, separate from the FastAPI backend.

Usage:
    python -m achilles.mcp_server
    python -m achilles.mcp_server --port 8901 --transport sse
"""

import argparse
import asyncio
import json
import logging

from mcp.server.fastmcp import FastMCP

from achilles.config import Settings, get_settings
from achilles.crypto import decrypt, encrypt
from achilles.database import Database

logger = logging.getLogger("achilles.mcp")

# Global references initialized before server starts
_db: Database | None = None
_settings: Settings | None = None


async def _resolve_project(name: str) -> dict:
    """Look up a project by name, raise ValueError if not found."""
    assert _db, "Server not initialized"
    projects = await _db.list_projects()
    proj = next((p for p in projects if p["name"] == name), None)
    if not proj:
        available = [p["name"] for p in projects]
        raise ValueError(
            f"Project '{name}' not found. Available projects: {available}"
        )
    return proj


async def _resolve_env(project_id: str, environment: str) -> dict:
    """Look up an environment within a project, raise ValueError if not found."""
    assert _db, "Server not initialized"
    env = await _db.get_environment(project_id, environment)
    if not env:
        envs = await _db.list_environments(project_id)
        available = [e["name"] for e in envs]
        raise ValueError(
            f"Environment '{environment}' not found. Available: {available}"
        )
    return env


def register_tools(mcp: FastMCP) -> None:
    """Register all vault tools on the given FastMCP instance."""

    @mcp.tool()
    async def list_projects() -> str:
        """List all projects in the vault.

        Returns:
            JSON array of project objects with name, description, and id.
        """
        assert _db, "Server not initialized"
        projects = await _db.list_projects()
        return json.dumps(
            [
                {"name": p["name"], "description": p.get("description", ""), "id": p["id"]}
                for p in projects
            ],
            indent=2,
        )

    @mcp.tool()
    async def get_secret(
        project: str, key: str, environment: str = "development"
    ) -> str:
        """Retrieve a decrypted secret value from the vault.

        Args:
            project: Project name (e.g. "my-app")
            key: Secret key name (e.g. "OPENAI_API_KEY")
            environment: Environment name — development, staging, or production (default: development)

        Returns:
            The decrypted secret value.
        """
        assert _db and _settings, "Server not initialized"

        proj = await _resolve_project(project)
        env = await _resolve_env(proj["id"], environment)

        secret = await _db.get_secret(proj["id"], env["id"], key)
        if not secret:
            secrets = await _db.list_secrets(proj["id"], env["id"])
            available = [s["key"] for s in secrets]
            raise ValueError(
                f"Secret '{key}' not found in {project}/{environment}. "
                f"Available keys: {available}"
            )

        value = decrypt(secret["encrypted_value"], _settings.master_key)

        await _db.log_audit(
            "mcp.get_secret",
            "secret",
            "mcp-client",
            secret["id"],
            details={"key": key, "project": project, "environment": environment},
        )
        return value

    @mcp.tool()
    async def list_secrets(project: str, environment: str = "development") -> str:
        """List all secret keys in a project environment.

        Args:
            project: Project name
            environment: Environment name — development, staging, or production (default: development)

        Returns:
            JSON array of secret key names with metadata.
        """
        assert _db, "Server not initialized"

        proj = await _resolve_project(project)
        env = await _resolve_env(proj["id"], environment)

        secrets = await _db.list_secrets(proj["id"], env["id"])
        return json.dumps(
            [
                {
                    "key": s["key"],
                    "version": s["version"],
                    "description": s.get("description", ""),
                }
                for s in secrets
            ],
            indent=2,
        )

    @mcp.tool()
    async def set_secret(
        project: str,
        key: str,
        value: str,
        environment: str = "development",
        description: str = "",
    ) -> str:
        """Create or update a secret in the vault.

        Args:
            project: Project name
            key: Secret key name (e.g. "DATABASE_URL")
            value: Secret value to store (will be encrypted with AES-256-GCM)
            environment: Environment name — development, staging, or production (default: development)
            description: Optional description for the secret

        Returns:
            Confirmation message with version number.
        """
        assert _db and _settings, "Server not initialized"

        proj = await _resolve_project(project)
        env = await _resolve_env(proj["id"], environment)

        encrypted = encrypt(value, _settings.master_key)
        result = await _db.set_secret(
            proj["id"],
            env["id"],
            key,
            encrypted,
            description=description,
            created_by="mcp-client",
        )

        await _db.log_audit(
            "mcp.set_secret",
            "secret",
            "mcp-client",
            result["id"],
            details={"key": key, "project": project, "environment": environment},
        )
        return f"Secret '{key}' saved in {project}/{environment} (version {result['version']})"

    @mcp.tool()
    async def delete_secret(
        project: str, key: str, environment: str = "development"
    ) -> str:
        """Delete a secret from the vault.

        Args:
            project: Project name
            key: Secret key name
            environment: Environment name — development, staging, or production (default: development)

        Returns:
            Confirmation message.
        """
        assert _db, "Server not initialized"

        proj = await _resolve_project(project)
        env = await _resolve_env(proj["id"], environment)

        success = await _db.delete_secret(proj["id"], env["id"], key)
        if not success:
            raise ValueError(f"Secret '{key}' not found in {project}/{environment}")

        await _db.log_audit(
            "mcp.delete_secret",
            "secret",
            "mcp-client",
            details={"key": key, "project": project, "environment": environment},
        )
        return f"Secret '{key}' deleted from {project}/{environment}"


async def _init_db():
    """Initialize database connection for the MCP server process."""
    global _db, _settings
    _settings = get_settings()
    _settings.ensure_dirs()
    _db = Database(_settings)
    await _db.connect()
    logger.info("MCP server connected to database at %s", _settings.db_path)


def main():
    parser = argparse.ArgumentParser(description="Achilles Vault MCP Server")
    parser.add_argument("--port", type=int, default=8901, help="Port to listen on")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to bind to")
    parser.add_argument(
        "--transport",
        type=str,
        default="sse",
        choices=["sse", "streamable-http"],
        help="MCP transport type",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    )

    # Initialize DB before running server
    asyncio.new_event_loop().run_until_complete(_init_db())

    # Create FastMCP with host/port config
    mcp = FastMCP(
        "Achilles Vault",
        instructions="Local-first secret management for AI workflows. "
        "Provides encrypted secret storage with project/environment hierarchy.",
        host=args.host,
        port=args.port,
    )

    # Register all tools
    register_tools(mcp)

    logger.info(
        "Starting Achilles Vault MCP server on %s:%d (%s)",
        args.host,
        args.port,
        args.transport,
    )

    mcp.run(transport=args.transport)


if __name__ == "__main__":
    main()
