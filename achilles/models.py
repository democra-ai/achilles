"""Pydantic models for request/response validation.

Follows fastapi skill Pattern 2: Input Validation
and rest-api-design-patterns skill: Consistent Error Response Format
"""

from pydantic import BaseModel, Field
from typing import Any


# --- Auth ---

class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8)


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


# --- Projects ---

class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100, pattern=r"^[a-zA-Z0-9_-]+$")
    description: str = Field(default="", max_length=500)


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: float
    updated_at: float


class EnvironmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    description: str = Field(default="", max_length=500)


# --- Secrets ---

class SecretCreate(BaseModel):
    key: str = Field(min_length=1, max_length=200, pattern=r"^[a-zA-Z0-9_./-]+$")
    value: str = Field(min_length=1)
    description: str = Field(default="", max_length=500)
    tags: list[str] = Field(default_factory=list)


class SecretBulkCreate(BaseModel):
    secrets: list[SecretCreate] = Field(min_length=1, max_length=100)


class SecretResponse(BaseModel):
    id: str
    key: str
    value: str  # decrypted value
    version: int
    description: str
    tags: list[str]
    created_at: float
    updated_at: float


class SecretMetadata(BaseModel):
    """Secret listing without the value."""
    id: str
    key: str
    version: int
    description: str
    tags: list[str]
    created_at: float
    updated_at: float


# --- API Keys ---

class APIKeyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    scopes: list[str] = Field(default_factory=lambda: ["read"])
    project_ids: list[str] = Field(default_factory=list)
    expires_in_days: int | None = Field(default=None, ge=1, le=365)


class APIKeyResponse(BaseModel):
    id: str
    name: str
    key: str  # Only returned on creation
    created_at: float


# --- AI / MCP ---

class AISecretRequest(BaseModel):
    """AI-friendly secret retrieval request."""
    project: str
    environment: str = "production"
    keys: list[str] = Field(default_factory=list)


class AISecretResponse(BaseModel):
    """AI-friendly secret response."""
    project: str
    environment: str
    secrets: dict[str, str]


class MCPToolCall(BaseModel):
    """MCP-compatible tool call format."""
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class MCPToolResult(BaseModel):
    """MCP-compatible tool result."""
    content: list[dict[str, Any]]
    is_error: bool = False


class OpenAIFunctionDef(BaseModel):
    """OpenAI function calling format."""
    name: str
    description: str
    parameters: dict[str, Any]


# --- Audit ---

class AuditEntry(BaseModel):
    id: str
    timestamp: float
    action: str
    resource_type: str
    resource_id: str | None
    actor: str
    details: dict[str, Any]
    ip_address: str | None


# --- Error ---

class ErrorResponse(BaseModel):
    error: dict[str, Any]
