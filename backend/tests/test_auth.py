import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    response = await client.post("/api/auth/register", json={
        "name": "Jane Doe",
        "username": "janedoe",
        "email": "jane@example.com",
        "password": "SecretPassword123!",
        "confirm_password": "SecretPassword123!"
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "jane@example.com"
    assert data["user"]["username"] == "janedoe"


@pytest.mark.asyncio
async def test_register_password_mismatch(client: AsyncClient):
    response = await client.post("/api/auth/register", json={
        "name": "Jane Doe",
        "username": "janedoe2",
        "email": "jane2@example.com",
        "password": "Password123!",
        "confirm_password": "DifferentPassword!"
    })
    assert response.status_code == 400
    assert "Passwords do not match" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, user_a):
    response = await client.post("/api/auth/login", json={
        "email": "aarti@together.app",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "aarti"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, user_a):
    response = await client.post("/api/auth/login", json={
        "email": "aarti@together.app",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient, user_a, token_a):
    response = await client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {token_a}"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_a.id
    assert data["email"] == user_a.email


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401
