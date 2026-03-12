"""Secret CRUD endpoints.

Follows rest-api-design-patterns skill:
- Pattern 1: Collection and Item Resources
- Pattern 2: Nested Resources (project/environment/secret)
- Consistent Error Response Format
- Cursor-based pagination

Follows managing-secrets skill:
- Encrypted at rest
- Audit logging for all access
- Secret versioning
"""

import json

from fastapi import APIRouter, Depends, HTTPException, Request, status

from achilles.auth import get_current_user, require_scope
from achilles.crypto import decrypt, encrypt
from achilles.models import (
    SecretBulkCreate,
    SecretCreate,
    SecretLinkRequest,
    SecretMetadata,
    SecretResponse,
)

router = APIRouter(prefix="/api/v1/projects/{project_id}/environments/{env_name}/secrets", tags=["secrets"])
link_router = APIRouter(prefix="/api/v1/secrets", tags=["secrets"])


async def _resolve_env(request: Request, project_id: str, env_name: str) -> tuple:
    """Resolve project and environment, returning (project, environment)."""
    db = request.app.state.db

    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    env = await db.get_environment(project_id, env_name)
    if not env:
        raise HTTPException(status_code=404, detail=f"Environment '{env_name}' not found")

    return project, env


@router.get("", response_model=list[SecretMetadata])
async def list_secrets(
    request: Request,
    project_id: str,
    env_name: str,
    tag: str | None = None,
    category: str | None = None,
    user: dict = Depends(require_scope("read")),
):
    """List all secrets in a project/environment with inheritance (own + linked + Global)."""
    db = request.app.state.db

    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    rows = await db.list_secrets_merged(project_id, env_name, tag=tag, category=category)

    return [
        SecretMetadata(
            id=r["id"],
            key=r["key"],
            version=r["version"],
            description=r["description"],
            tags=json.loads(r["tags"]) if isinstance(r["tags"], str) else r["tags"],
            category=r.get("category", "api_key"),
            source=r.get("_source", "own"),
            owner_project_id=r.get("project_id"),
            created_at=r["created_at"],
            updated_at=r["updated_at"],
        )
        for r in rows
    ]


@router.get("/{key}", response_model=SecretResponse)
async def get_secret(
    request: Request,
    project_id: str,
    env_name: str,
    key: str,
    user: dict = Depends(require_scope("read")),
):
    """Get a secret value (decrypted) with inheritance lookup (own > linked > Global)."""
    db = request.app.state.db
    settings = request.app.state.settings

    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    secret = await db.get_secret_merged(project_id, env_name, key)
    if not secret:
        raise HTTPException(status_code=404, detail=f"Secret '{key}' not found")

    try:
        decrypted = decrypt(secret["encrypted_value"], settings.master_key)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to decrypt secret '{key}'. "
                "The master key may have changed since this secret was encrypted. "
                "Re-create the secret to fix this."
            ),
        )

    await db.log_audit(
        "secret.read", "secret", user["username"], secret["id"],
        details={"key": key, "project_id": project_id, "environment": env_name},
        ip_address=request.client.host if request.client else None,
    )

    return SecretResponse(
        id=secret["id"],
        key=secret["key"],
        value=decrypted,
        version=secret["version"],
        description=secret["description"],
        tags=json.loads(secret["tags"]) if isinstance(secret["tags"], str) else secret["tags"],
        category=secret.get("category", "api_key"),
        created_at=secret["created_at"],
        updated_at=secret["updated_at"],
    )


@router.put("/{key}", status_code=status.HTTP_200_OK)
async def set_secret(
    request: Request,
    project_id: str,
    env_name: str,
    key: str,
    body: SecretCreate,
    user: dict = Depends(require_scope("write")),
):
    """Create or update a secret."""
    db = request.app.state.db
    settings = request.app.state.settings
    _, env = await _resolve_env(request, project_id, env_name)

    encrypted = encrypt(body.value, settings.master_key)

    result = await db.set_secret(
        project_id=project_id,
        environment_id=env["id"],
        key=key,
        encrypted_value=encrypted,
        description=body.description,
        tags=body.tags,
        created_by=user["username"],
        category=body.category.value,
    )

    await db.log_audit(
        "secret.write", "secret", user["username"], result["id"],
        details={"key": key, "project_id": project_id, "environment": env_name, "version": result["version"]},
        ip_address=request.client.host if request.client else None,
    )

    return result


@router.post("/bulk", status_code=status.HTTP_200_OK)
async def bulk_set_secrets(
    request: Request,
    project_id: str,
    env_name: str,
    body: SecretBulkCreate,
    user: dict = Depends(require_scope("write")),
):
    """Create or update multiple secrets at once."""
    db = request.app.state.db
    settings = request.app.state.settings
    _, env = await _resolve_env(request, project_id, env_name)

    results = []
    for secret in body.secrets:
        encrypted = encrypt(secret.value, settings.master_key)
        result = await db.set_secret(
            project_id=project_id,
            environment_id=env["id"],
            key=secret.key,
            encrypted_value=encrypted,
            description=secret.description,
            tags=secret.tags,
            created_by=user["username"],
            category=secret.category.value,
        )
        results.append(result)

    await db.log_audit(
        "secret.bulk_write", "secret", user["username"],
        details={"project_id": project_id, "environment": env_name, "count": len(results)},
        ip_address=request.client.host if request.client else None,
    )

    return {"created": len(results), "secrets": results}


@router.delete("/{key}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_secret(
    request: Request,
    project_id: str,
    env_name: str,
    key: str,
    user: dict = Depends(require_scope("write")),
):
    """Delete a secret."""
    db = request.app.state.db
    _, env = await _resolve_env(request, project_id, env_name)

    success = await db.delete_secret(project_id, env["id"], key)
    if not success:
        raise HTTPException(status_code=404, detail=f"Secret '{key}' not found")

    await db.log_audit(
        "secret.delete", "secret", user["username"],
        details={"key": key, "project_id": project_id, "environment": env_name},
        ip_address=request.client.host if request.client else None,
    )


@router.get("/{key}/versions")
async def get_secret_versions(
    request: Request,
    project_id: str,
    env_name: str,
    key: str,
    user: dict = Depends(require_scope("read")),
):
    """Get version history for a secret."""
    db = request.app.state.db
    _, env = await _resolve_env(request, project_id, env_name)

    secret = await db.get_secret(project_id, env["id"], key)
    if not secret:
        raise HTTPException(status_code=404, detail=f"Secret '{key}' not found")

    versions = await db.get_secret_versions(secret["id"])
    return {
        "key": key,
        "current_version": secret["version"],
        "versions": [
            {"version": v["version"], "created_at": v["created_at"], "created_by": v["created_by"]}
            for v in versions
        ],
    }


# --- Secret Linking (many-to-many) ---

@link_router.post("/{secret_id}/link", status_code=status.HTTP_200_OK)
async def link_secret(
    request: Request,
    secret_id: str,
    body: SecretLinkRequest,
    user: dict = Depends(require_scope("write")),
):
    """Link a secret to one or more additional projects."""
    db = request.app.state.db
    linked = []
    for pid in body.project_ids:
        project = await db.get_project(pid)
        if not project:
            raise HTTPException(status_code=404, detail=f"Project '{pid}' not found")
        success = await db.link_secret_to_project(secret_id, pid)
        if success:
            linked.append(pid)

    await db.log_audit(
        "secret.link", "secret", user["username"], secret_id,
        details={"linked_projects": linked},
        ip_address=request.client.host if request.client else None,
    )
    return {"linked": linked}


@link_router.delete("/{secret_id}/link/{project_id}", status_code=status.HTTP_200_OK)
async def unlink_secret(
    request: Request,
    secret_id: str,
    project_id: str,
    user: dict = Depends(require_scope("write")),
):
    """Remove a secret's link to a project (does not delete the secret)."""
    db = request.app.state.db
    success = await db.unlink_secret_from_project(secret_id, project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Link not found")

    await db.log_audit(
        "secret.unlink", "secret", user["username"], secret_id,
        details={"unlinked_project": project_id},
        ip_address=request.client.host if request.client else None,
    )
    return {"unlinked": True}


@link_router.get("/{secret_id}/projects")
async def get_secret_projects(
    request: Request,
    secret_id: str,
    user: dict = Depends(require_scope("read")),
):
    """Get all projects a secret is linked to."""
    db = request.app.state.db
    projects = await db.get_secret_projects(secret_id)
    return {"projects": projects}
