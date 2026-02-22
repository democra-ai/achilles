"""Trash / recycle bin endpoints for soft-deleted secrets."""

import json

from fastapi import APIRouter, Depends, HTTPException, Request, status

from achilles.auth import get_current_user, require_scope

router = APIRouter(prefix="/api/v1/trash", tags=["trash"])


@router.get("")
async def list_trash(
    request: Request,
    user: dict = Depends(require_scope("read")),
):
    """List all items in the trash."""
    db = request.app.state.db
    rows = await db.list_trash()
    return [
        {
            "id": r["id"],
            "key": r["key"],
            "version": r["version"],
            "description": r["description"],
            "tags": json.loads(r["tags"]) if isinstance(r["tags"], str) else r["tags"],
            "category": r.get("category", "secret"),
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "deleted_at": r["deleted_at"],
            "project_id": r["project_id"],
            "project_name": r["project_name"],
            "env_name": r["env_name"],
        }
        for r in rows
    ]


@router.post("/{secret_id}/restore", status_code=status.HTTP_200_OK)
async def restore_secret(
    request: Request,
    secret_id: str,
    user: dict = Depends(require_scope("write")),
):
    """Restore a secret from trash."""
    db = request.app.state.db
    success = await db.restore_secret(secret_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found in trash")

    await db.log_audit(
        "secret.restore", "secret", user["username"], secret_id,
        ip_address=request.client.host if request.client else None,
    )
    return {"restored": True}


@router.delete("/{secret_id}", status_code=status.HTTP_204_NO_CONTENT)
async def purge_secret(
    request: Request,
    secret_id: str,
    user: dict = Depends(require_scope("write")),
):
    """Permanently delete a secret from trash."""
    db = request.app.state.db
    success = await db.purge_secret(secret_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found in trash")

    await db.log_audit(
        "secret.purge", "secret", user["username"], secret_id,
        ip_address=request.client.host if request.client else None,
    )


@router.delete("", status_code=status.HTTP_200_OK)
async def empty_trash(
    request: Request,
    user: dict = Depends(require_scope("write")),
):
    """Empty the entire trash (permanently delete all)."""
    db = request.app.state.db
    count = await db.purge_expired_trash(max_age_days=0)

    await db.log_audit(
        "secret.empty_trash", "secret", user["username"],
        details={"count": count},
        ip_address=request.client.host if request.client else None,
    )
    return {"purged": count}
