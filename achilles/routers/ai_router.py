"""AI-friendly API endpoints for LLM tool calling.

Provides three interfaces:
1. Simple key-value API (for direct AI agent use)
2. MCP-compatible tool interface (Model Context Protocol)
3. OpenAI function calling schema (for tool definitions)

Inspired by:
- Akeyless SecretlessAI: AI agent identity + JIT secrets
- Infisical MCP Server: Function-callable secret ops
"""

import json

from fastapi import APIRouter, Depends, HTTPException, Request

from achilles.auth import get_current_user
from achilles.crypto import decrypt, encrypt
from achilles.models import AISecretRequest, AISecretResponse, MCPToolCall, MCPToolResult

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


# --- 1. Simple AI Secret API ---

@router.post("/secrets", response_model=AISecretResponse)
async def ai_get_secrets(
    request: Request,
    body: AISecretRequest,
    user: dict = Depends(get_current_user),
):
    """Simple AI-friendly endpoint: get secrets by project + environment + keys.

    Designed for AI agents that need to fetch credentials at runtime.
    If keys is empty, returns all secrets for the environment.
    """
    db = request.app.state.db
    settings = request.app.state.settings

    # Find project by name
    projects = await db.list_projects()
    project = next((p for p in projects if p["name"] == body.project), None)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{body.project}' not found")

    env = await db.get_environment(project["id"], body.environment)
    if not env:
        raise HTTPException(status_code=404, detail=f"Environment '{body.environment}' not found")

    result_secrets = {}

    if body.keys:
        for key in body.keys:
            secret = await db.get_secret(project["id"], env["id"], key)
            if secret:
                result_secrets[key] = decrypt(secret["encrypted_value"], settings.master_key)
    else:
        all_secrets = await db.list_secrets(project["id"], env["id"])
        for s in all_secrets:
            full = await db.get_secret(project["id"], env["id"], s["key"])
            if full:
                result_secrets[s["key"]] = decrypt(full["encrypted_value"], settings.master_key)

    await db.log_audit(
        "ai.secrets.read", "secret", user["username"],
        details={"project": body.project, "environment": body.environment, "keys": body.keys},
        ip_address=request.client.host if request.client else None,
    )

    return AISecretResponse(
        project=body.project,
        environment=body.environment,
        secrets=result_secrets,
    )


# --- 2. MCP-Compatible Tool Interface ---

MCP_TOOLS = [
    {
        "name": "get_secret",
        "description": "Retrieve a secret value from the vault",
        "inputSchema": {
            "type": "object",
            "properties": {
                "project": {"type": "string", "description": "Project name"},
                "environment": {"type": "string", "description": "Environment name (default: production)"},
                "key": {"type": "string", "description": "Secret key name"},
            },
            "required": ["project", "key"],
        },
    },
    {
        "name": "list_secrets",
        "description": "List all secret keys in a project environment",
        "inputSchema": {
            "type": "object",
            "properties": {
                "project": {"type": "string", "description": "Project name"},
                "environment": {"type": "string", "description": "Environment name (default: production)"},
            },
            "required": ["project"],
        },
    },
    {
        "name": "set_secret",
        "description": "Create or update a secret in the vault",
        "inputSchema": {
            "type": "object",
            "properties": {
                "project": {"type": "string", "description": "Project name"},
                "environment": {"type": "string", "description": "Environment name"},
                "key": {"type": "string", "description": "Secret key name"},
                "value": {"type": "string", "description": "Secret value"},
            },
            "required": ["project", "key", "value"],
        },
    },
    {
        "name": "delete_secret",
        "description": "Delete a secret from the vault",
        "inputSchema": {
            "type": "object",
            "properties": {
                "project": {"type": "string", "description": "Project name"},
                "environment": {"type": "string", "description": "Environment name"},
                "key": {"type": "string", "description": "Secret key name"},
            },
            "required": ["project", "key"],
        },
    },
]


@router.get("/mcp/tools")
async def mcp_list_tools():
    """List available MCP tools (Model Context Protocol)."""
    return {"tools": MCP_TOOLS}


@router.post("/mcp/call", response_model=MCPToolResult)
async def mcp_call_tool(
    request: Request,
    body: MCPToolCall,
    user: dict = Depends(get_current_user),
):
    """Execute an MCP tool call."""
    db = request.app.state.db
    settings = request.app.state.settings
    args = body.arguments

    try:
        if body.name == "get_secret":
            project_name = args["project"]
            env_name = args.get("environment", "production")
            key = args["key"]

            projects = await db.list_projects()
            project = next((p for p in projects if p["name"] == project_name), None)
            if not project:
                return MCPToolResult(content=[{"type": "text", "text": f"Project '{project_name}' not found"}], is_error=True)

            env = await db.get_environment(project["id"], env_name)
            if not env:
                return MCPToolResult(content=[{"type": "text", "text": f"Environment '{env_name}' not found"}], is_error=True)

            secret = await db.get_secret(project["id"], env["id"], key)
            if not secret:
                return MCPToolResult(content=[{"type": "text", "text": f"Secret '{key}' not found"}], is_error=True)

            value = decrypt(secret["encrypted_value"], settings.master_key)
            await db.log_audit("mcp.get_secret", "secret", user["username"], secret["id"], details={"key": key})

            return MCPToolResult(content=[{"type": "text", "text": value}])

        elif body.name == "list_secrets":
            project_name = args["project"]
            env_name = args.get("environment", "production")

            projects = await db.list_projects()
            project = next((p for p in projects if p["name"] == project_name), None)
            if not project:
                return MCPToolResult(content=[{"type": "text", "text": f"Project '{project_name}' not found"}], is_error=True)

            env = await db.get_environment(project["id"], env_name)
            if not env:
                return MCPToolResult(content=[{"type": "text", "text": f"Environment '{env_name}' not found"}], is_error=True)

            secrets = await db.list_secrets(project["id"], env["id"])
            keys = [s["key"] for s in secrets]
            return MCPToolResult(content=[{"type": "text", "text": json.dumps(keys)}])

        elif body.name == "set_secret":
            project_name = args["project"]
            env_name = args.get("environment", "production")
            key = args["key"]
            value = args["value"]

            projects = await db.list_projects()
            project = next((p for p in projects if p["name"] == project_name), None)
            if not project:
                return MCPToolResult(content=[{"type": "text", "text": f"Project '{project_name}' not found"}], is_error=True)

            env = await db.get_environment(project["id"], env_name)
            if not env:
                return MCPToolResult(content=[{"type": "text", "text": f"Environment '{env_name}' not found"}], is_error=True)

            encrypted = encrypt(value, settings.master_key)
            result = await db.set_secret(project["id"], env["id"], key, encrypted, created_by=user["username"])
            await db.log_audit("mcp.set_secret", "secret", user["username"], result["id"], details={"key": key})

            return MCPToolResult(content=[{"type": "text", "text": f"Secret '{key}' saved (version {result['version']})"}])

        elif body.name == "delete_secret":
            project_name = args["project"]
            env_name = args.get("environment", "production")
            key = args["key"]

            projects = await db.list_projects()
            project = next((p for p in projects if p["name"] == project_name), None)
            if not project:
                return MCPToolResult(content=[{"type": "text", "text": f"Project '{project_name}' not found"}], is_error=True)

            env = await db.get_environment(project["id"], env_name)
            if not env:
                return MCPToolResult(content=[{"type": "text", "text": f"Environment '{env_name}' not found"}], is_error=True)

            success = await db.delete_secret(project["id"], env["id"], key)
            if not success:
                return MCPToolResult(content=[{"type": "text", "text": f"Secret '{key}' not found"}], is_error=True)

            await db.log_audit("mcp.delete_secret", "secret", user["username"], details={"key": key})
            return MCPToolResult(content=[{"type": "text", "text": f"Secret '{key}' deleted"}])

        else:
            return MCPToolResult(content=[{"type": "text", "text": f"Unknown tool: {body.name}"}], is_error=True)

    except Exception as e:
        return MCPToolResult(content=[{"type": "text", "text": str(e)}], is_error=True)


# --- 3. OpenAI Function Calling Schema ---

@router.get("/openai/functions")
async def openai_function_definitions():
    """Get OpenAI-compatible function definitions for tool calling.

    Use these definitions in your OpenAI/Anthropic API calls
    to let AI models interact with Achilles Vault.
    """
    functions = [
        {
            "name": "achilles_get_secret",
            "description": "Retrieve a secret from Achilles Vault. Returns the decrypted secret value.",
            "parameters": {
                "type": "object",
                "properties": {
                    "project": {"type": "string", "description": "The project name"},
                    "environment": {"type": "string", "description": "The environment (development, staging, production)", "default": "production"},
                    "key": {"type": "string", "description": "The secret key to retrieve"},
                },
                "required": ["project", "key"],
            },
        },
        {
            "name": "achilles_list_secrets",
            "description": "List all secret keys in a project environment. Returns keys only, not values.",
            "parameters": {
                "type": "object",
                "properties": {
                    "project": {"type": "string", "description": "The project name"},
                    "environment": {"type": "string", "description": "The environment", "default": "production"},
                },
                "required": ["project"],
            },
        },
        {
            "name": "achilles_set_secret",
            "description": "Store or update a secret in Achilles Vault with AES-256-GCM encryption.",
            "parameters": {
                "type": "object",
                "properties": {
                    "project": {"type": "string", "description": "The project name"},
                    "environment": {"type": "string", "description": "The environment", "default": "production"},
                    "key": {"type": "string", "description": "The secret key"},
                    "value": {"type": "string", "description": "The secret value to store"},
                },
                "required": ["project", "key", "value"],
            },
        },
    ]
    return {"functions": functions}
