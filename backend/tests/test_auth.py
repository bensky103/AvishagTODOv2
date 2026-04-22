import pytest

from app.config import settings


@pytest.mark.asyncio
async def test_health_requires_no_auth(unauthed_client):
    """Health endpoint should not require auth."""
    res = await unauthed_client.get("/health")
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_api_requires_auth(unauthed_client):
    """API endpoints should return 401 without auth."""
    res = await unauthed_client.get("/api/tasks/")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_auth_with_valid_pin(unauthed_client):
    """Should return token for valid PIN."""
    res = await unauthed_client.post("/api/auth/verify", json={"pin": settings.pin_code})
    assert res.status_code == 200
    assert res.json()["ok"] is True


@pytest.mark.asyncio
async def test_auth_with_invalid_pin(unauthed_client):
    """Should reject invalid PIN."""
    res = await unauthed_client.post("/api/auth/verify", json={"pin": "definitely-not-the-pin"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_auth_token_grants_access(unauthed_client):
    """Cookie-based auth should grant API access after verify."""
    auth_res = await unauthed_client.post("/api/auth/verify", json={"pin": settings.pin_code})
    assert auth_res.status_code == 200
    # Verify endpoint sets an httponly cookie; httpx AsyncClient persists it on the cookie jar
    res = await unauthed_client.get("/api/tasks/")
    assert res.status_code == 200
