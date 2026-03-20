"""Achilles Vault CLI.

Follows cli-building skill patterns:
- Async-first design (typer with async support)
- Composable commands (modular subcommands)
- Output formatting with unicode symbols and rich
- Proper error handling with exit codes
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

import httpx
import typer
from rich.console import Console
from rich.table import Table

app = typer.Typer(
    name="achilles",
    help="Achilles Vault - Secret management for AI workflows",
    no_args_is_help=True,
)

console = Console()

# Default config
DEFAULT_URL = "http://127.0.0.1:8900"
CONFIG_KEYS = {}


def get_client() -> httpx.Client:
    """Create HTTP client with auth headers."""
    url = CONFIG_KEYS.get("url", DEFAULT_URL)
    headers = {}
    token = CONFIG_KEYS.get("token")
    api_key = CONFIG_KEYS.get("api_key")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    elif api_key:
        headers["X-API-Key"] = api_key
    return httpx.Client(base_url=url, headers=headers, timeout=30)


def handle_error(response: httpx.Response) -> None:
    if response.status_code >= 400:
        try:
            detail = response.json().get("detail", response.text)
        except Exception:
            detail = response.text
        console.print(f"[red]\u2717 Error ({response.status_code}): {detail}[/red]")
        raise typer.Exit(1)


# --- Auth commands ---

@app.command()
def login(
    url: str = typer.Option(DEFAULT_URL, "--url", "-u", help="Vault server URL"),
    username: str = typer.Option(..., "--username", "-U", prompt=True),
    password: str = typer.Option(..., "--password", "-P", prompt=True, hide_input=True),
):
    """Login to Achilles Vault and get an access token."""
    CONFIG_KEYS["url"] = url
    with httpx.Client(base_url=url, timeout=30) as client:
        resp = client.post("/api/v1/auth/login", json={"username": username, "password": password})
        handle_error(resp)
        data = resp.json()
        CONFIG_KEYS["token"] = data["access_token"]
        console.print(f"[green]\u2713 Logged in as {username}[/green]")
        console.print(f"  Token: {data['access_token'][:20]}...")
        console.print(f"  Expires in: {data['expires_in']}s")


@app.command()
def register(
    url: str = typer.Option(DEFAULT_URL, "--url", "-u"),
    username: str = typer.Option(..., "--username", "-U", prompt=True),
    password: str = typer.Option(..., "--password", "-P", prompt=True, hide_input=True),
):
    """Register a new user (first user becomes admin)."""
    with httpx.Client(base_url=url, timeout=30) as client:
        resp = client.post("/api/v1/auth/register", json={"username": username, "password": password})
        handle_error(resp)
        data = resp.json()
        console.print(f"[green]\u2713 Registered: {data['username']} (role: {data['role']})[/green]")


# --- Project commands ---

@app.command("projects")
def list_projects():
    """List all projects."""
    with get_client() as client:
        resp = client.get("/api/v1/projects")
        handle_error(resp)
        projects = resp.json()

    if not projects:
        console.print("[dim]No projects found. Create one with: achilles create-project <name>[/dim]")
        return

    table = Table(title="Projects")
    table.add_column("ID", style="dim")
    table.add_column("Name", style="bold")
    table.add_column("Description")

    for p in projects:
        table.add_row(p["id"][:8], p["name"], p.get("description", ""))

    console.print(table)


@app.command("create-project")
def create_project(
    name: str = typer.Argument(help="Project name"),
    description: str = typer.Option("", "--desc", "-d"),
):
    """Create a new project."""
    with get_client() as client:
        resp = client.post("/api/v1/projects", json={"name": name, "description": description})
        handle_error(resp)
        data = resp.json()
        console.print(f"[green]\u2713 Project '{name}' created (ID: {data['id'][:8]})[/green]")
        console.print("  Default environments: development, staging, production")


# --- Secret commands ---

@app.command("set")
def set_secret(
    project_id: str = typer.Argument(help="Project ID"),
    key: str = typer.Argument(help="Secret key"),
    value: str = typer.Argument(help="Secret value"),
    env: str = typer.Option("development", "--env", "-e", help="Environment name"),
    description: str = typer.Option("", "--desc", "-d"),
    tags: str = typer.Option("", "--tags", "-t", help="Comma-separated tags"),
):
    """Set a secret value."""
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    with get_client() as client:
        resp = client.put(
            f"/api/v1/projects/{project_id}/environments/{env}/secrets/{key}",
            json={"key": key, "value": value, "description": description, "tags": tag_list},
        )
        handle_error(resp)
        data = resp.json()
        console.print(f"[green]\u2713 Secret '{key}' saved (version {data['version']})[/green]")


@app.command("get")
def get_secret(
    project_id: str = typer.Argument(help="Project ID"),
    key: str = typer.Argument(help="Secret key"),
    env: str = typer.Option("development", "--env", "-e"),
    raw: bool = typer.Option(False, "--raw", "-r", help="Output raw value only"),
):
    """Get a secret value."""
    with get_client() as client:
        resp = client.get(f"/api/v1/projects/{project_id}/environments/{env}/secrets/{key}")
        handle_error(resp)
        data = resp.json()

    if raw:
        print(data["value"], end="")
    else:
        console.print(f"[bold]{data['key']}[/bold] = {data['value']}")
        console.print(f"  Version: {data['version']} | Tags: {data['tags']}")


@app.command("list")
def list_secrets(
    project_id: str = typer.Argument(help="Project ID"),
    env: str = typer.Option("development", "--env", "-e"),
    tag: str = typer.Option(None, "--tag", "-t"),
):
    """List all secrets in a project environment."""
    with get_client() as client:
        params = {}
        if tag:
            params["tag"] = tag
        resp = client.get(f"/api/v1/projects/{project_id}/environments/{env}/secrets", params=params)
        handle_error(resp)
        secrets = resp.json()

    if not secrets:
        console.print("[dim]No secrets found.[/dim]")
        return

    table = Table(title=f"Secrets ({env})")
    table.add_column("Key", style="bold")
    table.add_column("Version")
    table.add_column("Tags")
    table.add_column("Description")

    for s in secrets:
        tags_str = ", ".join(s.get("tags", []))
        table.add_row(s["key"], str(s["version"]), tags_str, s.get("description", ""))

    console.print(table)


@app.command("delete")
def delete_secret(
    project_id: str = typer.Argument(help="Project ID"),
    key: str = typer.Argument(help="Secret key"),
    env: str = typer.Option("development", "--env", "-e"),
    confirm: bool = typer.Option(False, "--yes", "-y", help="Skip confirmation"),
):
    """Delete a secret."""
    if not confirm:
        typer.confirm(f"Delete secret '{key}' from {env}?", abort=True)

    with get_client() as client:
        resp = client.delete(f"/api/v1/projects/{project_id}/environments/{env}/secrets/{key}")
        handle_error(resp)
        console.print(f"[green]\u2713 Secret '{key}' deleted[/green]")


# --- Export/Import ---

@app.command("export")
def export_secrets(
    project_id: str = typer.Argument(help="Project ID"),
    env: str = typer.Option("development", "--env", "-e"),
    format: str = typer.Option("env", "--format", "-f", help="Output format: env, json, dotenv"),
):
    """Export secrets as .env or JSON format."""
    with get_client() as client:
        resp = client.get(f"/api/v1/projects/{project_id}/environments/{env}/secrets")
        handle_error(resp)
        secret_list = resp.json()

    secrets = {}
    for s in secret_list:
        resp2 = client.get(f"/api/v1/projects/{project_id}/environments/{env}/secrets/{s['key']}")
        if resp2.status_code == 200:
            secrets[s["key"]] = resp2.json()["value"]

    if format == "json":
        print(json.dumps(secrets, indent=2))
    else:
        for k, v in secrets.items():
            print(f"{k}={v}")


@app.command("run")
def run_with_secrets(
    project_id: str = typer.Argument(help="Project ID"),
    command: list[str] = typer.Argument(help="Command to run"),
    env: str = typer.Option("development", "--env", "-e"),
):
    """Run a command with secrets injected as environment variables (like doppler run)."""
    import os
    import subprocess

    with get_client() as client:
        resp = client.get(f"/api/v1/projects/{project_id}/environments/{env}/secrets")
        handle_error(resp)
        secret_list = resp.json()

    env_vars = os.environ.copy()
    for s in secret_list:
        with get_client() as client:
            resp2 = client.get(f"/api/v1/projects/{project_id}/environments/{env}/secrets/{s['key']}")
            if resp2.status_code == 200:
                env_vars[s["key"]] = resp2.json()["value"]

    console.print(f"[dim]\u2192 Injecting {len(secret_list)} secrets into environment[/dim]")
    result = subprocess.run(command, env=env_vars)
    raise typer.Exit(result.returncode)


# --- Server command ---

@app.command("serve")
def serve(
    host: str = typer.Option("127.0.0.1", "--host", "-h"),
    port: int = typer.Option(8900, "--port", "-p"),
    debug: bool = typer.Option(False, "--debug"),
):
    """Start the Achilles Vault server."""
    import os
    os.environ.setdefault("ACHILLES_HOST", host)
    os.environ.setdefault("ACHILLES_PORT", str(port))

    import uvicorn
    console.print(f"[bold]Achilles Vault[/bold] starting on {host}:{port}")
    console.print(f"  Dashboard: http://{host}:{port}/")
    console.print(f"  API Docs:  http://{host}:{port}/docs")
    uvicorn.run("achilles.main:app", host=host, port=port, reload=debug)


# --- Direct-access commands (no server needed) ---

@app.command("context")
def context(
    project: str = typer.Argument(help="Project name or ID"),
    env: str = typer.Option("development", "--env", "-e", help="Environment name"),
    output_json: bool = typer.Option(False, "--json", "-j", help="Output as JSON"),
):
    """Show available secrets metadata for AI discovery (no values exposed).

    Works offline — reads directly from local vault, no server needed.
    AI agents use this to discover what secrets are available before fetching them.
    """
    from achilles.cli.direct import (
        list_secrets_merged,
        resolve_project_by_id_or_name,
    )

    proj = resolve_project_by_id_or_name(project)
    if not proj:
        console.print(f"[red]\u2717 Project '{project}' not found.[/red]")
        console.print("[dim]Run 'achilles context --help' or check available projects in the Vault app.[/dim]")
        raise typer.Exit(1)

    secrets = list_secrets_merged(proj["id"], env)

    if output_json:
        items = []
        for s in secrets:
            tags = json.loads(s["tags"]) if isinstance(s["tags"], str) else s.get("tags", [])
            items.append({
                "key": s["key"],
                "description": s.get("description", ""),
                "category": s.get("category", ""),
                "source": s.get("_source", "own"),
                "version": s["version"],
                "tags": tags,
            })
        result = {
            "project": proj["name"],
            "environment": env,
            "secrets": items,
            "hint": f"To retrieve a value: achilles vault-get {proj['name']} <KEY> --env {env}",
        }
        print(json.dumps(result, indent=2))
        return

    # Human/AI-readable output
    console.print(f"[bold]Achilles Vault[/bold] — {proj['name']} / {env}")
    console.print()

    if not secrets:
        console.print("[dim]No secrets found in this project/environment.[/dim]")
        return

    table = Table(show_header=True, header_style="bold")
    table.add_column("Key", style="bold cyan")
    table.add_column("Category")
    table.add_column("Source", style="dim")
    table.add_column("Description")

    for s in secrets:
        table.add_row(
            s["key"],
            s.get("category", ""),
            s.get("_source", "own"),
            s.get("description", ""),
        )

    console.print(table)
    console.print()
    console.print(f"[dim]To retrieve a value: achilles vault-get {proj['name']} <KEY> --env {env}[/dim]")


@app.command("vault-get")
def vault_get(
    project: str = typer.Argument(help="Project name or ID"),
    key: str = typer.Argument(help="Secret key"),
    env: str = typer.Option("development", "--env", "-e"),
    raw: bool = typer.Option(False, "--raw", "-r", help="Output raw value only"),
):
    """Get a secret directly from local vault (no server needed).

    This is the primary command for AI agents to retrieve secrets.
    """
    from achilles.cli.direct import (
        decrypt_secret,
        get_secret_merged,
        resolve_project_by_id_or_name,
    )

    proj = resolve_project_by_id_or_name(project)
    if not proj:
        console.print(f"[red]\u2717 Project '{project}' not found.[/red]")
        raise typer.Exit(1)

    secret = get_secret_merged(proj["id"], env, key)
    if not secret:
        console.print(f"[red]\u2717 Secret '{key}' not found in {proj['name']}/{env}.[/red]")
        console.print(f"[dim]Run 'achilles context {proj['name']} --env {env}' to see available keys.[/dim]")
        raise typer.Exit(1)

    value = decrypt_secret(secret["encrypted_value"])

    if raw:
        print(value, end="")
    else:
        console.print(f"[bold]{key}[/bold] = {value}")
        console.print(f"  Source: {secret.get('_source', 'own')} | Version: {secret['version']}")


@app.command("vault-export")
def vault_export(
    project: str = typer.Argument(help="Project name or ID"),
    env: str = typer.Option("development", "--env", "-e"),
    format: str = typer.Option("env", "--format", "-f", help="Output format: env, json, dotenv"),
):
    """Export all secrets from local vault as env vars or JSON (no server needed)."""
    from achilles.cli.direct import (
        decrypt_secret,
        get_secret_merged,
        list_secrets_merged,
        resolve_project_by_id_or_name,
    )

    proj = resolve_project_by_id_or_name(project)
    if not proj:
        console.print(f"[red]\u2717 Project '{project}' not found.[/red]", err=True)
        raise typer.Exit(1)

    secret_list = list_secrets_merged(proj["id"], env)
    secrets = {}
    for s in secret_list:
        row = get_secret_merged(proj["id"], env, s["key"])
        if row:
            secrets[s["key"]] = decrypt_secret(row["encrypted_value"])

    if format == "json":
        print(json.dumps(secrets, indent=2))
    else:
        for k, v in secrets.items():
            print(f"{k}={v}")


@app.command("vault-run")
def vault_run(
    project: str = typer.Argument(help="Project name or ID"),
    command: list[str] = typer.Argument(help="Command to run"),
    env: str = typer.Option("development", "--env", "-e"),
):
    """Run a command with secrets injected as env vars (no server needed).

    Example: achilles vault-run my-project -- python train.py
    """
    import subprocess

    from achilles.cli.direct import (
        decrypt_secret,
        get_secret_merged,
        list_secrets_merged,
        resolve_project_by_id_or_name,
    )

    proj = resolve_project_by_id_or_name(project)
    if not proj:
        console.print(f"[red]\u2717 Project '{project}' not found.[/red]", err=True)
        raise typer.Exit(1)

    secret_list = list_secrets_merged(proj["id"], env)
    env_vars = os.environ.copy()
    for s in secret_list:
        row = get_secret_merged(proj["id"], env, s["key"])
        if row:
            env_vars[s["key"]] = decrypt_secret(row["encrypted_value"])

    console.print(f"[dim]\u2192 Injecting {len(secret_list)} secrets from {proj['name']}/{env}[/dim]", err=True)
    result = subprocess.run(command, env=env_vars)
    raise typer.Exit(result.returncode)


# --- AI Tool Integration ---

# The instruction snippet injected into AI rule files
_CLAUDEMD_SNIPPET = """\
## Secrets Management — Achilles Vault

This project uses [Achilles Vault](https://github.com/AchillesVault/achilles) for local secrets management.
Achilles Vault is installed on this machine and the `achilles` CLI is available.

**IMPORTANT: When you need any API key, token, password, or credential:**
1. DO NOT ask the user for secrets directly — they are stored in Achilles Vault.
2. First discover what's available (metadata only, no secret values exposed):
   ```
   achilles context <PROJECT> --env <ENV>
   ```
3. Retrieve the specific secret you need:
   ```
   achilles vault-get <PROJECT> <KEY> --env <ENV> --raw
   ```
4. To run a command with all secrets injected as environment variables:
   ```
   achilles vault-run <PROJECT> -- <COMMAND>
   ```

Available projects can be listed with: `achilles context --help`
"""

_CURSORRULES_SNIPPET = """\
# Secrets Management — Achilles Vault

This project uses Achilles Vault for local secrets management.
The `achilles` CLI is available on this machine.

When you need any API key, token, password, or credential:
1. DO NOT ask the user for secrets directly.
2. Discover available secrets: `achilles context <PROJECT> --env <ENV> --json`
3. Retrieve a secret: `achilles vault-get <PROJECT> <KEY> --env <ENV> --raw`
4. Run with secrets injected: `achilles vault-run <PROJECT> -- <COMMAND>`
"""

_COPILOT_SNIPPET = _CURSORRULES_SNIPPET  # Same format works for Copilot


def _inject_snippet(file_path: Path, snippet: str, marker: str = "Achilles Vault") -> bool:
    """Append snippet to a file if not already present. Returns True if modified."""
    if file_path.exists():
        content = file_path.read_text()
        if marker in content:
            return False  # Already configured
        # Append with separator
        if not content.endswith("\n"):
            content += "\n"
        content += "\n" + snippet
        file_path.write_text(content)
    else:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(snippet)
    return True


def _configure_claude_mcp(project_dir: Path | None) -> bool:
    """Add Achilles MCP server to Claude Code settings."""
    # Claude Code MCP config lives in ~/.claude/settings.json (global)
    # or .claude/settings.json (project-level)
    if project_dir:
        settings_path = project_dir / ".claude" / "settings.json"
    else:
        settings_path = Path.home() / ".claude" / "settings.json"

    settings_path.parent.mkdir(parents=True, exist_ok=True)

    if settings_path.exists():
        settings = json.loads(settings_path.read_text())
    else:
        settings = {}

    mcp_servers = settings.setdefault("mcpServers", {})
    if "achilles" in mcp_servers:
        return False  # Already configured

    mcp_servers["achilles"] = {
        "command": "achilles-mcp",
        "args": [],
    }
    settings_path.write_text(json.dumps(settings, indent=2) + "\n")
    return True


@app.command("init")
def init(
    tool: str = typer.Argument(
        help="AI tool to configure: claude-code, cursor, copilot, or all"
    ),
    project_dir: str = typer.Option(
        ".", "--dir", "-d", help="Project directory (default: current directory)"
    ),
    with_mcp: bool = typer.Option(
        True, "--mcp/--no-mcp", help="Also configure MCP server (for claude-code)"
    ),
):
    """Configure an AI tool to automatically use Achilles Vault for secrets.

    After running this, the AI will passively know to use `achilles` commands
    whenever it needs API keys, tokens, or credentials — no manual prompting needed.

    Supported tools:
      claude-code  — Writes CLAUDE.md + optional MCP config
      cursor       — Writes .cursorrules
      copilot      — Writes .github/copilot-instructions.md
      all          — Configures all of the above

    Example:
      achilles init claude-code
      achilles init all --dir /path/to/my-project
    """
    target = Path(project_dir).resolve()
    if not target.is_dir():
        console.print(f"[red]\u2717 Directory not found: {target}[/red]")
        raise typer.Exit(1)

    tools = ["claude-code", "cursor", "copilot"] if tool == "all" else [tool]
    changes = []

    for t in tools:
        if t == "claude-code":
            md_path = target / "CLAUDE.md"
            if _inject_snippet(md_path, _CLAUDEMD_SNIPPET):
                changes.append(f"  \u2713 CLAUDE.md updated — {md_path}")
            else:
                changes.append(f"  \u2022 CLAUDE.md already configured — {md_path}")

            if with_mcp:
                if _configure_claude_mcp(target):
                    changes.append(f"  \u2713 MCP server registered in .claude/settings.json")
                else:
                    changes.append(f"  \u2022 MCP server already configured")

        elif t == "cursor":
            rules_path = target / ".cursorrules"
            if _inject_snippet(rules_path, _CURSORRULES_SNIPPET):
                changes.append(f"  \u2713 .cursorrules updated — {rules_path}")
            else:
                changes.append(f"  \u2022 .cursorrules already configured — {rules_path}")

        elif t == "copilot":
            copilot_path = target / ".github" / "copilot-instructions.md"
            if _inject_snippet(copilot_path, _COPILOT_SNIPPET):
                changes.append(f"  \u2713 copilot-instructions.md updated — {copilot_path}")
            else:
                changes.append(f"  \u2022 copilot-instructions.md already configured — {copilot_path}")

        else:
            console.print(f"[red]\u2717 Unknown tool: {t}[/red]")
            console.print("[dim]Supported: claude-code, cursor, copilot, all[/dim]")
            raise typer.Exit(1)

    console.print("[bold green]Achilles Vault AI integration configured:[/bold green]")
    for line in changes:
        console.print(line)
    console.print()
    console.print("[dim]AI agents in this project will now automatically use Achilles Vault for secrets.[/dim]")


if __name__ == "__main__":
    app()
