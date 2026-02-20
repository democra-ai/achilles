"""Achilles Vault CLI.

Follows cli-building skill patterns:
- Async-first design (typer with async support)
- Composable commands (modular subcommands)
- Output formatting with unicode symbols and rich
- Proper error handling with exit codes
"""

import json
import sys

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


if __name__ == "__main__":
    app()
