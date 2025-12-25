import uuid

import pytest

from tests.conftest import state

# Generate a unique name for this test run
random_id = uuid.uuid4().hex[:6]
store_name = f"Supermercado Test {random_id}"


@pytest.mark.asyncio
async def test_create_store(client):
    headers = {"Authorization": f"Bearer {state.token}"}
    response = await client.post(
        "/api/v1/stores/",
        headers=headers,
        json={
            "name": store_name,  # <--- Use the unique name
            "address": "Av Bolivar, Valencia",
            "latitude": 10.1989,
            "longitude": -68.0053,
        },
    )

    # NOTE: Check if your API returns 200 or 201 (Created)
    assert response.status_code in [200, 201]

    data = response.json()
    # Save ID for future tests
    # Make sure your API returns "id" or "store_id". Adjust key if needed.
    state.store_id = data["id"] if "id" in data else data["store_id"]


@pytest.mark.asyncio
async def test_get_nearby_stores(client):
    headers = {"Authorization": f"Bearer {state.token}"}
    response = await client.get(
        "/api/v1/stores/nearby?lat=10.1990&lon=-68.0050&radius_meters=1000",
        headers=headers,
    )
    assert response.status_code == 200
    assert len(response.json()) >= 1
