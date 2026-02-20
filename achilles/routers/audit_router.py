"""Audit log endpoints.

Follows managing-secrets skill: Audit access — Log secret retrieval
"""

from fastapi import APIRouter, Depends, Query, Request

from achilles.auth import get_current_user

router = APIRouter(prefix="/api/v1/audit", tags=["audit"])


@router.get("")
async def get_audit_log(
    request: Request,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    action: str | None = None,
    resource_type: str | None = None,
    user: dict = Depends(get_current_user),
):
    """Get audit log entries with filtering."""
    db = request.app.state.db
    entries = await db.get_audit_log(
        limit=limit, offset=offset, action=action, resource_type=resource_type
    )
    return {"entries": entries, "limit": limit, "offset": offset}
