import uuid

import pytest

from tests.conftest import state

random_id = uuid.uuid4().hex[:6]
random_email = f"tester_{random_id}@example.com"
random_username = f"Test User {random_id}"


@pytest.mark.asyncio
async def test_register_user(client):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "username": random_username,
            "email": random_email,
            "password": "strongpassword123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == random_email
    state.user_id = data["user_id"]


@pytest.mark.asyncio
async def test_login_user(client):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": random_email, "password": "strongpassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    state.token = data["access_token"]
