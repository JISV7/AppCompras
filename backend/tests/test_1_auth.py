import uuid
import pytest
from tests.conftest import state

random_email = f"tester_{uuid.uuid4().hex[:6]}@example.com"

@pytest.mark.asyncio
async def test_register_user(client):
    response = await client.post("/api/v1/auth/register", json={
        "username": "Test User",
        "email": random_email,
        "password": "strongpassword123"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == random_email
    state.user_id = data["user_id"]

@pytest.mark.asyncio
async def test_login_user(client):
    response = await client.post("/api/v1/auth/login", data={
        "username": random_email,
        "password": "strongpassword123"
    })
    assert response.status_code == 200
    data = response.json()
    state.token = data["access_token"]