"""Auth endpoints — registration, login, API key management.

Follows fastapi skill patterns:
- Pattern 3: JWT Authentication
- Pattern 4: Rate Limiting (strict on auth endpoints)
"""

import time

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from achilles.auth import (
    create_access_token,
    get_current_user,
    hash_api_key,
    hash_password,
    verify_password,
)
from achilles.crypto import generate_api_key
from achilles.models import (
    APIKeyCreate,
    APIKeyResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, body: RegisterRequest):
    """Register a new user. First user becomes admin."""
    db = request.app.state.db

    existing = await db.get_user(body.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    user_count = await db.user_count()
    role = "admin" if user_count == 0 else "user"

    pw_hash = hash_password(body.password)
    user = await db.create_user(body.username, pw_hash, role)

    await db.log_audit("user.register", "user", user["username"], user["id"])

    return {"id": user["id"], "username": user["username"], "role": role}


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest):
    """Login and get a JWT access token."""
    db = request.app.state.db
    settings = request.app.state.settings

    user = await db.get_user(body.username)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token, expires_in = create_access_token(
        user["id"], user["username"], user["role"], settings
    )

    await db.log_audit(
        "user.login", "user", user["username"], user["id"],
        ip_address=request.client.host if request.client else None,
    )

    return TokenResponse(access_token=token, expires_in=expires_in)


@router.post("/api-keys", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key_endpoint(
    request: Request,
    body: APIKeyCreate,
    user: dict = Depends(get_current_user),
):
    """Create a new API key. The key is only shown once."""
    db = request.app.state.db

    raw_key = generate_api_key()
    key_hash = hash_api_key(raw_key)

    expires_at = None
    if body.expires_in_days:
        expires_at = time.time() + body.expires_in_days * 86400

    result = await db.create_api_key(
        name=body.name,
        key_hash=key_hash,
        scopes=body.scopes,
        project_ids=body.project_ids,
        expires_at=expires_at,
    )

    await db.log_audit("api_key.create", "api_key", user["username"], result["id"])

    return APIKeyResponse(
        id=result["id"],
        name=body.name,
        key=raw_key,
        created_at=result["created_at"],
    )


@router.get("/api-keys")
async def list_api_keys(
    request: Request,
    user: dict = Depends(get_current_user),
):
    """List all API keys (without the key values)."""
    db = request.app.state.db
    return await db.list_api_keys()


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    request: Request,
    key_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete an API key."""
    db = request.app.state.db
    success = await db.delete_api_key(key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")
    await db.log_audit("api_key.delete", "api_key", user["username"], key_id)


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user info."""
    return {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "auth_method": user["auth_method"],
    }
