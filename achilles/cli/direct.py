"""Direct database access for CLI — no HTTP server needed.

Provides synchronous wrappers around the async Database class,
allowing CLI commands to read/write the vault directly via SQLite.
"""

import asyncio
import json
import sqlite3
from pathlib import Path
from typing import Any

from achilles.config import Settings, get_settings
from achilles.crypto import decrypt


def _get_db_path() -> Path:
    settings = get_settings()
    settings.ensure_dirs()
    return settings.db_path


def _get_master_key() -> str:
    return get_settings().master_key


def _query(db_path: Path, sql: str, params: tuple = ()) -> list[dict]:
    """Execute a read query and return rows as dicts."""
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        cursor = conn.execute(sql, params)
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def _query_one(db_path: Path, sql: str, params: tuple = ()) -> dict | None:
    rows = _query(db_path, sql, params)
    return rows[0] if rows else None


def list_projects() -> list[dict]:
    """List all projects directly from SQLite."""
    return _query(_get_db_path(), "SELECT * FROM projects ORDER BY created_at DESC")


def resolve_project(name: str) -> dict | None:
    """Find a project by name (case-insensitive)."""
    return _query_one(
        _get_db_path(),
        "SELECT * FROM projects WHERE LOWER(name) = LOWER(?)",
        (name,),
    )


def resolve_project_by_id_or_name(identifier: str) -> dict | None:
    """Find a project by ID or name."""
    # Try by ID first
    row = _query_one(_get_db_path(), "SELECT * FROM projects WHERE id = ?", (identifier,))
    if row:
        return row
    # Then by name
    return resolve_project(identifier)


def get_environment(project_id: str, env_name: str) -> dict | None:
    return _query_one(
        _get_db_path(),
        "SELECT * FROM environments WHERE project_id = ? AND name = ?",
        (project_id, env_name),
    )


def list_environments(project_id: str) -> list[dict]:
    return _query(
        _get_db_path(),
        "SELECT * FROM environments WHERE project_id = ? ORDER BY created_at",
        (project_id,),
    )


def get_global_project() -> dict | None:
    return _query_one(_get_db_path(), "SELECT * FROM projects WHERE is_global = 1")


def list_secrets_merged(project_id: str, environment_name: str) -> list[dict]:
    """List secrets with inheritance: own > linked > Global. Metadata only."""
    db_path = _get_db_path()

    # 1. Own secrets
    env = get_environment(project_id, environment_name)
    own_secrets = []
    if env:
        own_secrets = _query(
            db_path,
            "SELECT id, project_id, key, version, tags, description, category, created_at, updated_at "
            "FROM secrets WHERE project_id = ? AND environment_id = ? AND deleted_at IS NULL ORDER BY key",
            (project_id, env["id"]),
        )
        for s in own_secrets:
            s["_source"] = "own"

    # 2. Linked secrets
    linked_secrets = _query(
        db_path,
        """SELECT s.id, s.key, s.version, s.tags, s.description, s.category,
                  s.created_at, s.updated_at, s.project_id,
                  e.name as env_name, p.name as source_project
           FROM project_secrets ps
           JOIN secrets s ON s.id = ps.secret_id
           JOIN environments e ON e.id = s.environment_id
           JOIN projects p ON p.id = s.project_id
           WHERE ps.project_id = ? AND e.name = ? AND s.deleted_at IS NULL
           ORDER BY s.key""",
        (project_id, environment_name),
    )
    for s in linked_secrets:
        s["_source"] = "linked"

    # 3. Global secrets
    global_secrets = []
    proj = _query_one(db_path, "SELECT is_global FROM projects WHERE id = ?", (project_id,))
    is_self_global = proj and proj["is_global"]

    if not is_self_global:
        global_proj = get_global_project()
        if global_proj:
            global_env = get_environment(global_proj["id"], environment_name)
            if global_env:
                global_secrets = _query(
                    db_path,
                    "SELECT id, project_id, key, version, tags, description, category, created_at, updated_at "
                    "FROM secrets WHERE project_id = ? AND environment_id = ? AND deleted_at IS NULL ORDER BY key",
                    (global_proj["id"], global_env["id"]),
                )
                for s in global_secrets:
                    s["_source"] = "global"

    # Merge with priority: own > linked > global
    seen_keys: set[str] = set()
    merged: list[dict] = []
    for s in own_secrets:
        seen_keys.add(s["key"])
        merged.append(s)
    for s in linked_secrets:
        if s["key"] not in seen_keys:
            seen_keys.add(s["key"])
            merged.append(s)
    for s in global_secrets:
        if s["key"] not in seen_keys:
            seen_keys.add(s["key"])
            merged.append(s)

    merged.sort(key=lambda s: s["key"])
    return merged


def get_secret_merged(project_id: str, environment_name: str, key: str) -> dict | None:
    """Get a single secret with inheritance. Returns row with encrypted_value."""
    db_path = _get_db_path()

    # 1. Own
    env = get_environment(project_id, environment_name)
    if env:
        secret = _query_one(
            db_path,
            "SELECT * FROM secrets WHERE project_id = ? AND environment_id = ? AND key = ? AND deleted_at IS NULL",
            (project_id, env["id"], key),
        )
        if secret:
            secret["_source"] = "own"
            return secret

    # 2. Linked
    row = _query_one(
        db_path,
        """SELECT s.* FROM project_secrets ps
           JOIN secrets s ON s.id = ps.secret_id
           JOIN environments e ON e.id = s.environment_id
           WHERE ps.project_id = ? AND e.name = ? AND s.key = ? AND s.deleted_at IS NULL
           LIMIT 1""",
        (project_id, environment_name, key),
    )
    if row:
        row["_source"] = "linked"
        return row

    # 3. Global
    proj = _query_one(db_path, "SELECT is_global FROM projects WHERE id = ?", (project_id,))
    is_self_global = proj and proj["is_global"]
    if not is_self_global:
        global_proj = get_global_project()
        if global_proj:
            global_env = get_environment(global_proj["id"], environment_name)
            if global_env:
                secret = _query_one(
                    db_path,
                    "SELECT * FROM secrets WHERE project_id = ? AND environment_id = ? AND key = ? AND deleted_at IS NULL",
                    (global_proj["id"], global_env["id"], key),
                )
                if secret:
                    secret["_source"] = "global"
                    return secret
    return None


def decrypt_secret(encrypted_value: str) -> str:
    """Decrypt a secret value using the master key."""
    return decrypt(encrypted_value, _get_master_key())
