"""Integration tests for the API."""

import pytest
from httpx import ASGITransport, AsyncClient

from achilles.main import create_app


@pytest.fixture
def app(tmp_path):
    """Create app with temporary database."""
    import os
    os.environ["ACHILLES_MASTER_KEY"] = "test-master-key-12345678"
    os.environ["ACHILLES_JWT_SECRET"] = "test-jwt-secret-12345678"

    from achilles.config import Settings
    settings = Settings(data_dir=tmp_path)
    application = create_app()
    # Override settings
    application.state._settings_override = settings
    return application


@pytest.fixture
async def client(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_register_and_login(client):
    # Register
    resp = await client.post("/api/v1/auth/register", json={
        "username": "testuser",
        "password": "testpassword123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["username"] == "testuser"
    assert data["role"] == "admin"  # First user is admin

    # Login
    resp = await client.post("/api/v1/auth/login", json={
        "username": "testuser",
        "password": "testpassword123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_unauthenticated_access(client):
    resp = await client.get("/api/v1/projects")
    assert resp.status_code == 401
