import pytest


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
    res = await unauthed_client.post("/api/auth/verify", json={"pin": "0000"})
    assert res.status_code == 200
    assert "token" in res.json()


@pytest.mark.asyncio
async def test_auth_with_invalid_pin(unauthed_client):
    """Should reject invalid PIN."""
    res = await unauthed_client.post("/api/auth/verify", json={"pin": "9999"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_auth_token_grants_access(unauthed_client):
    """Token from auth should grant API access."""
    auth_res = await unauthed_client.post("/api/auth/verify", json={"pin": "0000"})
    token = auth_res.json()["token"]
    res = await unauthed_client.get("/api/tasks/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
