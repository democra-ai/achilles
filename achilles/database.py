"""SQLite database layer with encrypted secret storage.

Follows managing-secrets skill patterns:
- Encrypted at rest (AES-256-GCM)
- Audit logging for all access
- Secret versioning
- Project/environment hierarchy (Doppler-inspired)
"""

import aiosqlite
import json
import time
import uuid
from pathlib import Path
from typing import Any

from achilles.config import Settings


SCHEMA = """
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS environments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at REAL NOT NULL,
    UNIQUE(project_id, name)
);

CREATE TABLE IF NOT EXISTS secrets (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment_id TEXT NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    encrypted_value TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    tags TEXT DEFAULT '[]',
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'secret',
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL,
    created_by TEXT DEFAULT 'system',
    deleted_at REAL,
    UNIQUE(project_id, environment_id, key)
);

CREATE TABLE IF NOT EXISTS secret_versions (
    id TEXT PRIMARY KEY,
    secret_id TEXT NOT NULL REFERENCES secrets(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_at REAL NOT NULL,
    created_by TEXT DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    scopes TEXT NOT NULL DEFAULT '["read"]',
    project_ids TEXT DEFAULT '[]',
    created_at REAL NOT NULL,
    last_used_at REAL,
    expires_at REAL,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    timestamp REAL NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    actor TEXT NOT NULL,
    details TEXT DEFAULT '{}',
    ip_address TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at REAL NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_secrets_project ON secrets(project_id);
CREATE INDEX IF NOT EXISTS idx_secrets_env ON secrets(environment_id);
CREATE INDEX IF NOT EXISTS idx_secrets_key ON secrets(key);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
"""


class Database:
    def __init__(self, settings: Settings):
        self.db_path = settings.db_path
        self._db: aiosqlite.Connection | None = None

    async def connect(self) -> None:
        self._db = await aiosqlite.connect(str(self.db_path))
        self._db.row_factory = aiosqlite.Row
        await self._db.execute("PRAGMA journal_mode=WAL")
        await self._db.execute("PRAGMA foreign_keys=ON")
        await self._db.executescript(SCHEMA)

        # Migrations for existing databases
        cursor = await self._db.execute("PRAGMA table_info(secrets)")
        columns = [row[1] for row in await cursor.fetchall()]
        if "category" not in columns:
            await self._db.execute(
                "ALTER TABLE secrets ADD COLUMN category TEXT NOT NULL DEFAULT 'secret'"
            )
        if "deleted_at" not in columns:
            await self._db.execute(
                "ALTER TABLE secrets ADD COLUMN deleted_at REAL"
            )

        # Create indexes that depend on migrated columns
        await self._db.execute("CREATE INDEX IF NOT EXISTS idx_secrets_category ON secrets(category)")
        await self._db.execute("CREATE INDEX IF NOT EXISTS idx_secrets_deleted ON secrets(deleted_at)")

        await self._db.commit()

    async def close(self) -> None:
        if self._db:
            await self._db.close()

    @property
    def db(self) -> aiosqlite.Connection:
        if not self._db:
            raise RuntimeError("Database not connected")
        return self._db

    # --- Projects ---

    async def create_project(self, name: str, description: str = "") -> dict:
        now = time.time()
        project_id = str(uuid.uuid4())
        await self.db.execute(
            "INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (project_id, name, description, now, now),
        )
        # Create default environments
        for env_name in ("development", "staging", "production"):
            env_id = str(uuid.uuid4())
            await self.db.execute(
                "INSERT INTO environments (id, project_id, name, created_at) VALUES (?, ?, ?, ?)",
                (env_id, project_id, env_name, now),
            )
        await self.db.commit()
        return {"id": project_id, "name": name, "description": description, "created_at": now}

    async def list_projects(self) -> list[dict]:
        cursor = await self.db.execute("SELECT * FROM projects ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

    async def get_project(self, project_id: str) -> dict | None:
        cursor = await self.db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None

    async def delete_project(self, project_id: str) -> bool:
        cursor = await self.db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        await self.db.commit()
        return cursor.rowcount > 0

    # --- Environments ---

    async def list_environments(self, project_id: str) -> list[dict]:
        cursor = await self.db.execute(
            "SELECT * FROM environments WHERE project_id = ? ORDER BY created_at",
            (project_id,),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

    async def get_environment(self, project_id: str, env_name: str) -> dict | None:
        cursor = await self.db.execute(
            "SELECT * FROM environments WHERE project_id = ? AND name = ?",
            (project_id, env_name),
        )
        row = await cursor.fetchone()
        return dict(row) if row else None

    async def create_environment(self, project_id: str, name: str, description: str = "") -> dict:
        env_id = str(uuid.uuid4())
        now = time.time()
        await self.db.execute(
            "INSERT INTO environments (id, project_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)",
            (env_id, project_id, name, description, now),
        )
        await self.db.commit()
        return {"id": env_id, "project_id": project_id, "name": name, "created_at": now}

    # --- Secrets ---

    async def set_secret(
        self,
        project_id: str,
        environment_id: str,
        key: str,
        encrypted_value: str,
        description: str = "",
        tags: list[str] | None = None,
        created_by: str = "system",
        category: str = "secret",
    ) -> dict:
        now = time.time()
        secret_id = str(uuid.uuid4())
        tags_json = json.dumps(tags or [])

        # Check if secret already exists
        cursor = await self.db.execute(
            "SELECT id, version FROM secrets WHERE project_id = ? AND environment_id = ? AND key = ?",
            (project_id, environment_id, key),
        )
        existing = await cursor.fetchone()

        if existing:
            secret_id = existing["id"]
            new_version = existing["version"] + 1

            # Archive current version
            cursor2 = await self.db.execute(
                "SELECT encrypted_value FROM secrets WHERE id = ?", (secret_id,)
            )
            current = await cursor2.fetchone()
            if current:
                await self.db.execute(
                    "INSERT INTO secret_versions (id, secret_id, version, encrypted_value, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)",
                    (str(uuid.uuid4()), secret_id, existing["version"], current["encrypted_value"], now, created_by),
                )

            await self.db.execute(
                "UPDATE secrets SET encrypted_value = ?, version = ?, tags = ?, description = ?, category = ?, updated_at = ?, created_by = ? WHERE id = ?",
                (encrypted_value, new_version, tags_json, description, category, now, created_by, secret_id),
            )
            version = new_version
        else:
            version = 1
            await self.db.execute(
                "INSERT INTO secrets (id, project_id, environment_id, key, encrypted_value, version, tags, description, category, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (secret_id, project_id, environment_id, key, encrypted_value, 1, tags_json, description, category, now, now, created_by),
            )

        await self.db.commit()
        return {"id": secret_id, "key": key, "version": version, "updated_at": now}

    async def get_secret(self, project_id: str, environment_id: str, key: str) -> dict | None:
        cursor = await self.db.execute(
            "SELECT * FROM secrets WHERE project_id = ? AND environment_id = ? AND key = ? AND deleted_at IS NULL",
            (project_id, environment_id, key),
        )
        row = await cursor.fetchone()
        return dict(row) if row else None

    async def list_secrets(
        self,
        project_id: str,
        environment_id: str,
        tag: str | None = None,
        category: str | None = None,
    ) -> list[dict]:
        query = "SELECT id, key, version, tags, description, category, created_at, updated_at, created_by FROM secrets WHERE project_id = ? AND environment_id = ? AND deleted_at IS NULL"
        params: list[Any] = [project_id, environment_id]

        if category:
            query += " AND category = ?"
            params.append(category)

        if tag:
            query += " AND tags LIKE ?"
            params.append(f'%"{tag}"%')

        query += " ORDER BY key"
        cursor = await self.db.execute(query, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

    async def delete_secret(self, project_id: str, environment_id: str, key: str) -> bool:
        """Soft-delete a secret (move to trash)."""
        now = time.time()
        cursor = await self.db.execute(
            "UPDATE secrets SET deleted_at = ? WHERE project_id = ? AND environment_id = ? AND key = ? AND deleted_at IS NULL",
            (now, project_id, environment_id, key),
        )
        await self.db.commit()
        return cursor.rowcount > 0

    # --- Trash ---

    async def list_trash(self) -> list[dict]:
        """List all soft-deleted secrets across all projects."""
        cursor = await self.db.execute(
            """SELECT s.id, s.key, s.version, s.tags, s.description, s.category,
                      s.created_at, s.updated_at, s.deleted_at,
                      s.project_id, s.environment_id,
                      p.name as project_name, e.name as env_name
               FROM secrets s
               JOIN projects p ON p.id = s.project_id
               JOIN environments e ON e.id = s.environment_id
               WHERE s.deleted_at IS NOT NULL
               ORDER BY s.deleted_at DESC"""
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

    async def restore_secret(self, secret_id: str) -> bool:
        """Restore a soft-deleted secret from trash."""
        cursor = await self.db.execute(
            "UPDATE secrets SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL",
            (secret_id,),
        )
        await self.db.commit()
        return cursor.rowcount > 0

    async def purge_secret(self, secret_id: str) -> bool:
        """Permanently delete a secret from trash."""
        cursor = await self.db.execute(
            "DELETE FROM secrets WHERE id = ? AND deleted_at IS NOT NULL",
            (secret_id,),
        )
        await self.db.commit()
        return cursor.rowcount > 0

    async def purge_expired_trash(self, max_age_days: int = 30) -> int:
        """Permanently delete all trash items older than max_age_days."""
        cutoff = time.time() - (max_age_days * 86400)
        cursor = await self.db.execute(
            "DELETE FROM secrets WHERE deleted_at IS NOT NULL AND deleted_at < ?",
            (cutoff,),
        )
        await self.db.commit()
        return cursor.rowcount

    async def get_secret_versions(self, secret_id: str) -> list[dict]:
        cursor = await self.db.execute(
            "SELECT * FROM secret_versions WHERE secret_id = ? ORDER BY version DESC",
            (secret_id,),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

    # --- API Keys ---

    async def create_api_key(
        self,
        name: str,
        key_hash: str,
        scopes: list[str] | None = None,
        project_ids: list[str] | None = None,
        expires_at: float | None = None,
    ) -> dict:
        key_id = str(uuid.uuid4())
        now = time.time()
        await self.db.execute(
            "INSERT INTO api_keys (id, name, key_hash, scopes, project_ids, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (key_id, name, key_hash, json.dumps(scopes or ["read"]), json.dumps(project_ids or []), now, expires_at),
        )
        await self.db.commit()
        return {"id": key_id, "name": name, "created_at": now}

    async def get_api_key_by_hash(self, key_hash: str) -> dict | None:
        cursor = await self.db.execute(
            "SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1",
            (key_hash,),
        )
        row = await cursor.fetchone()
        if row:
            result = dict(row)
            # Update last_used_at
            await self.db.execute(
                "UPDATE api_keys SET last_used_at = ? WHERE id = ?",
                (time.time(), result["id"]),
            )
            await self.db.commit()
            return result
        return None

    async def list_api_keys(self) -> list[dict]:
        cursor = await self.db.execute(
            "SELECT id, name, scopes, project_ids, created_at, last_used_at, expires_at, is_active FROM api_keys WHERE is_active = 1 ORDER BY created_at DESC"
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

    async def revoke_api_key(self, key_id: str) -> bool:
        cursor = await self.db.execute(
            "UPDATE api_keys SET is_active = 0 WHERE id = ?", (key_id,)
        )
        await self.db.commit()
        return cursor.rowcount > 0

    async def delete_api_key(self, key_id: str) -> bool:
        cursor = await self.db.execute(
            "DELETE FROM api_keys WHERE id = ?", (key_id,)
        )
        await self.db.commit()
        return cursor.rowcount > 0

    # --- Users ---

    async def create_user(self, username: str, password_hash: str, role: str = "user") -> dict:
        user_id = str(uuid.uuid4())
        now = time.time()
        await self.db.execute(
            "INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, username, password_hash, role, now),
        )
        await self.db.commit()
        return {"id": user_id, "username": username, "role": role}

    async def get_user(self, username: str) -> dict | None:
        cursor = await self.db.execute(
            "SELECT * FROM users WHERE username = ? AND is_active = 1", (username,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None

    async def user_count(self) -> int:
        cursor = await self.db.execute("SELECT COUNT(*) as count FROM users")
        row = await cursor.fetchone()
        return row["count"] if row else 0

    # --- Audit Log ---

    async def log_audit(
        self,
        action: str,
        resource_type: str,
        actor: str,
        resource_id: str | None = None,
        details: dict | None = None,
        ip_address: str | None = None,
    ) -> None:
        await self.db.execute(
            "INSERT INTO audit_log (id, timestamp, action, resource_type, resource_id, actor, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), time.time(), action, resource_type, resource_id, actor, json.dumps(details or {}), ip_address),
        )
        await self.db.commit()

    async def get_audit_log(
        self,
        limit: int = 50,
        offset: int = 0,
        action: str | None = None,
        resource_type: str | None = None,
    ) -> list[dict]:
        query = "SELECT * FROM audit_log WHERE 1=1"
        params: list[Any] = []
        if action:
            query += " AND action = ?"
            params.append(action)
        if resource_type:
            query += " AND resource_type = ?"
            params.append(resource_type)
        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        cursor = await self.db.execute(query, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
