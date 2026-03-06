"""AI-friendly API endpoints for LLM tool calling.

Provides five interfaces:
1. Simple key-value API (for direct AI agent use)
2. MCP-compatible tool interface (Model Context Protocol)
3. OpenAI function calling schema (for tool definitions)
4. Anthropic Tool Use schema (for Claude API tool_use blocks)
5. WebSocket real-time interface (for streaming / persistent agents)

Inspired by:
- Akeyless SecretlessAI: AI agent identity + JIT secrets
- Infisical MCP Server: Function-callable secret ops
"""

import json
import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect, Query

from achilles.auth import get_current_user, hash_api_key
from achilles.crypto import decrypt, encrypt
from achilles.models import AISecretRequest, AISecretResponse, MCPToolCall, MCPToolResult

logger = logging.getLogger("achilles.ai")

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


# --- 4. Anthropic Tool Use Schema ---

@router.get("/anthropic/tools")
async def anthropic_tool_definitions():
    """Get Anthropic-compatible tool definitions for Claude API tool_use blocks.

    Paste these into the `tools` parameter of your Anthropic API calls.
    The schema follows Anthropic's tool_use format (input_schema vs OpenAI's parameters).

    Example usage:
        import anthropic
        client = anthropic.Anthropic()
        tools = httpx.get("http://localhost:8900/api/v1/ai/anthropic/tools").json()["tools"]
        response = client.messages.create(model="claude-opus-4-6", tools=tools, messages=[...])
    """
    tools = [
        {
            "name": "achilles_get_secret",
            "description": (
                "Retrieve a decrypted secret from Achilles Vault. "
                "Use this whenever you need an API key, token, or credential to complete a task. "
                "Never ask the user to paste secrets — fetch them directly."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "project": {
                        "type": "string",
                        "description": "The project name in the vault (e.g. 'my-ai-project')",
                    },
                    "key": {
                        "type": "string",
                        "description": "The secret key name (e.g. 'OPENAI_API_KEY', 'GITHUB_TOKEN')",
                    },
                    "environment": {
                        "type": "string",
                        "enum": ["development", "staging", "production"],
                        "description": "The environment to read from. Defaults to 'production'.",
                    },
                },
                "required": ["project", "key"],
            },
        },
        {
            "name": "achilles_list_secrets",
            "description": (
                "List all secret key names in a project environment. "
                "Returns metadata only — no secret values. "
                "Use this to discover what credentials are available before fetching them."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "project": {
                        "type": "string",
                        "description": "The project name in the vault",
                    },
                    "environment": {
                        "type": "string",
                        "enum": ["development", "staging", "production"],
                        "description": "The environment to list. Defaults to 'production'.",
                    },
                },
                "required": ["project"],
            },
        },
        {
            "name": "achilles_list_projects",
            "description": "List all projects in the vault. Use this to discover available projects.",
            "input_schema": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
        {
            "name": "achilles_set_secret",
            "description": (
                "Store or update a secret in Achilles Vault with AES-256-GCM encryption. "
                "Use this when the user wants to save a new credential to the vault."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "project": {
                        "type": "string",
                        "description": "The project name",
                    },
                    "key": {
                        "type": "string",
                        "description": "The secret key name (e.g. 'STRIPE_SECRET_KEY')",
                    },
                    "value": {
                        "type": "string",
                        "description": "The secret value to encrypt and store",
                    },
                    "environment": {
                        "type": "string",
                        "enum": ["development", "staging", "production"],
                        "description": "The environment to store in. Defaults to 'production'.",
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional human-readable description of this secret",
                    },
                },
                "required": ["project", "key", "value"],
            },
        },
    ]
    return {"tools": tools}


# --- 5. WebSocket Real-Time Interface ---

@router.websocket("/ws")
async def ai_websocket(
    websocket: WebSocket,
    api_key: str = Query(..., alias="api_key"),
):
    """WebSocket endpoint for persistent AI agent connections.

    Authenticate once, then send JSON commands over a long-lived connection.
    Useful for streaming agents and multi-step workflows that need multiple secrets.

    Connection:
        ws://localhost:8900/api/v1/ai/ws?api_key=av_your_key

    Request format:
        {"action": "get_secret",     "project": "...", "key": "...", "environment": "production"}
        {"action": "list_secrets",   "project": "...", "environment": "production"}
        {"action": "list_projects"}
        {"action": "set_secret",     "project": "...", "key": "...", "value": "...", "environment": "production"}
        {"action": "ping"}

    Response format (success):
        {"ok": true, "data": <result>}

    Response format (error):
        {"ok": false, "error": "<message>"}
    """
    db = websocket.app.state.db
    settings = websocket.app.state.settings

    # Authenticate via API key before accepting the connection
    key_hash = hash_api_key(api_key)
    key_record = await db.get_api_key_by_hash(key_hash)
    if not key_record:
        await websocket.close(code=4001, reason="Invalid API key")
        return
    if key_record.get("expires_at") and key_record["expires_at"] < time.time():
        await websocket.close(code=4001, reason="API key expired")
        return
    user = {"username": key_record["name"], "id": key_record["id"]}

    await websocket.accept()
    logger.info("WebSocket connected: user=%s", user.get("username", "unknown"))

    async def send_ok(data):
        await websocket.send_json({"ok": True, "data": data})

    async def send_error(message: str):
        await websocket.send_json({"ok": False, "error": message})

    async def resolve_project(name: str):
        projects = await db.list_projects()
        proj = next((p for p in projects if p["name"] == name), None)
        if not proj:
            raise ValueError(f"Project '{name}' not found")
        return proj

    async def resolve_env(project_id: str, environment: str):
        env = await db.get_environment(project_id, environment)
        if not env:
            raise ValueError(f"Environment '{environment}' not found")
        return env

    try:
        while True:
            raw = await websocket.receive_json()
            action = raw.get("action", "")

            try:
                if action == "ping":
                    await send_ok("pong")

                elif action == "list_projects":
                    projects = await db.list_projects()
                    await send_ok([
                        {"name": p["name"], "description": p.get("description", ""), "id": p["id"]}
                        for p in projects
                    ])

                elif action == "list_secrets":
                    project_name = raw.get("project")
                    env_name = raw.get("environment", "production")
                    if not project_name:
                        await send_error("'project' is required")
                        continue
                    proj = await resolve_project(project_name)
                    env = await resolve_env(proj["id"], env_name)
                    secrets = await db.list_secrets(proj["id"], env["id"])
                    await send_ok([{"key": s["key"], "version": s["version"]} for s in secrets])

                elif action == "get_secret":
                    project_name = raw.get("project")
                    key = raw.get("key")
                    env_name = raw.get("environment", "production")
                    if not project_name or not key:
                        await send_error("'project' and 'key' are required")
                        continue
                    proj = await resolve_project(project_name)
                    env = await resolve_env(proj["id"], env_name)
                    secret = await db.get_secret(proj["id"], env["id"], key)
                    if not secret:
                        await send_error(f"Secret '{key}' not found")
                        continue
                    value = decrypt(secret["encrypted_value"], settings.master_key)
                    await db.log_audit(
                        "ws.get_secret", "secret", user.get("username", "ws-client"),
                        secret["id"], details={"key": key, "project": project_name},
                    )
                    await send_ok(value)

                elif action == "set_secret":
                    project_name = raw.get("project")
                    key = raw.get("key")
                    value = raw.get("value")
                    env_name = raw.get("environment", "production")
                    description = raw.get("description", "")
                    if not project_name or not key or value is None:
                        await send_error("'project', 'key', and 'value' are required")
                        continue
                    proj = await resolve_project(project_name)
                    env = await resolve_env(proj["id"], env_name)
                    encrypted = encrypt(value, settings.master_key)
                    result = await db.set_secret(
                        proj["id"], env["id"], key, encrypted,
                        description=description, created_by=user.get("username", "ws-client"),
                    )
                    await db.log_audit(
                        "ws.set_secret", "secret", user.get("username", "ws-client"),
                        result["id"], details={"key": key, "project": project_name},
                    )
                    await send_ok({"key": key, "version": result["version"]})

                else:
                    await send_error(f"Unknown action: '{action}'. Valid actions: ping, list_projects, list_secrets, get_secret, set_secret")

            except ValueError as e:
                await send_error(str(e))
            except Exception as e:
                logger.exception("WebSocket handler error")
                await send_error(f"Internal error: {e}")

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected: user=%s", user.get("username", "unknown"))
