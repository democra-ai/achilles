"""Authentication module — JWT + API Key auth.

Follows fastapi skill Pattern 3: JWT Authentication
and managing-secrets skill: Multi-method auth (API Key, JWT)
"""

import hashlib
import json
import time

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, APIKeyHeader
from jose import JWTError, jwt
from passlib.hash import argon2

from achilles.config import Settings, get_settings


http_bearer = HTTPBearer(auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def hash_password(password: str) -> str:
    return argon2.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return argon2.verify(password, password_hash)


def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()


def create_access_token(
    user_id: str,
    username: str,
    role: str,
    settings: Settings,
) -> tuple[str, int]:
    """Create JWT access token. Returns (token, expires_in_seconds)."""
    expires_in = settings.jwt_expire_minutes * 60
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + expires_in,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, expires_in


async def get_current_user(
    request: Request,
    bearer: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    api_key: str | None = Depends(api_key_header),
) -> dict:
    """Authenticate via JWT bearer token or API key.

    Returns user dict with keys: id, username, role, auth_method
    """
    settings: Settings = request.app.state.settings
    db = request.app.state.db

    # Try JWT first
    if bearer:
        try:
            payload = jwt.decode(
                bearer.credentials,
                settings.jwt_secret,
                algorithms=[settings.jwt_algorithm],
            )
            return {
                "id": payload["sub"],
                "username": payload["username"],
                "role": payload.get("role", "user"),
                "auth_method": "jwt",
            }
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Try API key
    if api_key:
        key_hash = hash_api_key(api_key)
        key_record = await db.get_api_key_by_hash(key_hash)
        if key_record:
            # Check expiry
            if key_record.get("expires_at") and key_record["expires_at"] < time.time():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="API key has expired",
                )
            return {
                "id": key_record["id"],
                "username": key_record["name"],
                "role": "api_key",
                "auth_method": "api_key",
                "scopes": json.loads(key_record.get("scopes", '["read"]')),
                "project_ids": json.loads(key_record.get("project_ids", "[]")),
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )

    # Dev mode: skip auth, return a default dev user
    if settings.dev_mode:
        return {
            "id": "dev",
            "username": "dev",
            "role": "admin",
            "auth_method": "dev",
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide a Bearer token or X-API-Key header.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_scope(scope: str):
    """Dependency to check API key scope."""
    async def _check(user: dict = Depends(get_current_user)) -> dict:
        if user["auth_method"] == "api_key":
            scopes = user.get("scopes", [])
            if scope not in scopes and "admin" not in scopes:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required scope: {scope}",
                )
        return user
    return _check
