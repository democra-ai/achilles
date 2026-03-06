"""Platform catalog API — 3-layer structure: categories → platforms → secret keys.

Endpoints:
    GET /api/v1/platforms                 - flat list of all platforms (lightweight, no secrets)
    GET /api/v1/platforms/categories      - full 3-layer structure with categories
    GET /api/v1/platforms/{id}            - single platform with full secret templates
    GET /api/v1/platforms/{id}/keys       - key names only (autocomplete)
"""

import json
import logging
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException

logger = logging.getLogger("achilles.platforms")

CATALOG_PATH = Path(__file__).parent.parent / "platforms" / "platforms.json"

router = APIRouter(prefix="/api/v1/platforms", tags=["platforms"])


@lru_cache(maxsize=1)
def _load_catalog() -> dict:
    """Load and cache the platform catalog from disk.

    Supports both v1 (flat platforms[]) and v2 (categories[]) structures.
    Restart the server to pick up catalog changes.
    """
    if not CATALOG_PATH.exists():
        logger.warning("Platform catalog not found at %s", CATALOG_PATH)
        return {"version": "0.0.0", "categories": [], "platforms": []}
    with CATALOG_PATH.open(encoding="utf-8") as f:
        data = json.load(f)
    logger.info("Loaded platform catalog v%s", data.get("version", "?"))
    return data


def _all_platforms() -> list[dict]:
    """Return a flat list of all platforms regardless of catalog structure."""
    data = _load_catalog()
    # v2: categories[].platforms[]
    if "categories" in data:
        platforms = []
        for cat in data["categories"]:
            for p in cat.get("platforms", []):
                p = dict(p)
                p.setdefault("category", cat["id"])
                p.setdefault("category_name", cat.get("name", cat["id"]))
                platforms.append(p)
        return platforms
    # v1 fallback: flat platforms[]
    return data.get("platforms", [])


@router.get("")
async def list_platforms():
    """Flat list of all platforms — lightweight summary without secret details."""
    return {
        "version": _load_catalog().get("version", "unknown"),
        "platforms": [
            {
                "id": p["id"],
                "name": p["name"],
                "category": p.get("category", "other"),
                "category_name": p.get("category_name", p.get("category", "other")),
                "color": p.get("color", "#888888"),
                "docs_url": p.get("docs_url", ""),
                "key_prefixes": p.get("key_prefixes", []),
                "secret_count": len(p.get("secrets", [])),
            }
            for p in _all_platforms()
        ],
    }


@router.get("/categories")
async def list_categories():
    """Full 3-layer catalog: categories → platforms → secret key templates."""
    data = _load_catalog()
    version = data.get("version", "unknown")

    # v2 native format
    if "categories" in data:
        return {
            "version": version,
            "categories": [
                {
                    "id": cat["id"],
                    "name": cat["name"],
                    "color": cat.get("color", "#888888"),
                    "platforms": [
                        {
                            "id": p["id"],
                            "name": p["name"],
                            "color": p.get("color", "#888888"),
                            "docs_url": p.get("docs_url", ""),
                            "key_prefixes": p.get("key_prefixes", []),
                            "secret_count": len(p.get("secrets", [])),
                            "secrets": p.get("secrets", []),
                        }
                        for p in cat.get("platforms", [])
                    ],
                }
                for cat in data["categories"]
            ],
        }

    # v1 fallback: group by category field
    platforms = data.get("platforms", [])
    groups: dict[str, list] = {}
    for p in platforms:
        cat = p.get("category", "other")
        groups.setdefault(cat, []).append(p)
    return {
        "version": version,
        "categories": [
            {
                "id": cat,
                "name": cat.replace("_", " ").title(),
                "color": "#888888",
                "platforms": [
                    {
                        "id": p["id"],
                        "name": p["name"],
                        "color": p.get("color", "#888888"),
                        "docs_url": p.get("docs_url", ""),
                        "key_prefixes": p.get("key_prefixes", []),
                        "secret_count": len(p.get("secrets", [])),
                        "secrets": p.get("secrets", []),
                    }
                    for p in ps
                ],
            }
            for cat, ps in groups.items()
        ],
    }


@router.get("/{platform_id}")
async def get_platform(platform_id: str):
    """Get a single platform with full secret templates."""
    platforms = _all_platforms()
    platform = next((p for p in platforms if p["id"] == platform_id), None)
    if not platform:
        raise HTTPException(
            status_code=404,
            detail=f"Platform '{platform_id}' not found. "
                   f"Available: {[p['id'] for p in platforms]}",
        )
    return platform


@router.get("/{platform_id}/keys")
async def get_platform_keys(platform_id: str):
    """Get just the key names for a platform — useful for autocomplete."""
    platforms = _all_platforms()
    platform = next((p for p in platforms if p["id"] == platform_id), None)
    if not platform:
        raise HTTPException(status_code=404, detail=f"Platform '{platform_id}' not found")
    return {
        "platform_id": platform_id,
        "keys": [s["key"] for s in platform.get("secrets", [])],
    }
