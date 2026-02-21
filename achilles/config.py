"""Configuration for Achilles Vault."""

import os
import secrets
from pathlib import Path

from pydantic import BaseModel, Field


def _resolve_master_key() -> str:
    """Resolve master key: env var > persisted file > generate and persist."""
    env_key = os.environ.get("ACHILLES_MASTER_KEY")
    if env_key:
        return env_key

    data_dir = Path.home() / ".achilles"
    key_file = data_dir / "master.key"

    if key_file.exists():
        return key_file.read_text().strip()

    # Generate and persist a new key
    data_dir.mkdir(parents=True, exist_ok=True)
    new_key = secrets.token_hex(32)
    key_file.write_text(new_key)
    key_file.chmod(0o600)
    return new_key


def _resolve_jwt_secret() -> str:
    """Resolve JWT secret: env var > persisted file > generate and persist."""
    env_key = os.environ.get("ACHILLES_JWT_SECRET")
    if env_key:
        return env_key

    data_dir = Path.home() / ".achilles"
    key_file = data_dir / "jwt.key"

    if key_file.exists():
        return key_file.read_text().strip()

    data_dir.mkdir(parents=True, exist_ok=True)
    new_key = secrets.token_hex(32)
    key_file.write_text(new_key)
    key_file.chmod(0o600)
    return new_key


class Settings(BaseModel):
    """Application settings with secure defaults."""

    # Server
    host: str = Field(default="127.0.0.1")
    port: int = Field(default=8900)
    debug: bool = Field(default=False)

    # Database
    data_dir: Path = Field(default_factory=lambda: Path.home() / ".achilles")
    db_name: str = Field(default="vault.db")

    # Security
    master_key: str = Field(default_factory=_resolve_master_key)
    jwt_secret: str = Field(default_factory=_resolve_jwt_secret)
    jwt_algorithm: str = Field(default="HS256")
    jwt_expire_minutes: int = Field(default=60)

    # Rate limiting
    rate_limit: str = Field(default="100/minute")
    auth_rate_limit: str = Field(default="10/minute")

    # Dev mode — skip authentication
    dev_mode: bool = Field(
        default_factory=lambda: os.environ.get("ACHILLES_DEV_MODE", "true").lower() == "true"
    )

    @property
    def db_path(self) -> Path:
        return self.data_dir / self.db_name

    def ensure_dirs(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)


def get_settings() -> Settings:
    return Settings()
