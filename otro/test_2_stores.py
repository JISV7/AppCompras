import pytest
from tests.conftest import state

@pytest.mark.asyncio
async def test_create_store(client):
    headers = {"Authorization": f"Bearer {state.token}"}
    response = await client.post("/api/v1/stores/", headers=headers, json={
        "name": "Supermercado Test",
        "address": "Av Bolivar, Valencia",
        "latitude": 10.1989,
        "longitude": -68.0053
    })
    assert response.status_code == 200
    state.store_id = response.json()["store_id"]

@pytest.mark.asyncio
async def test_get_nearby_stores(client):
    headers = {"Authorization": f"Bearer {state.token}"}
    response = await client.get(
        "/api/v1/stores/nearby?lat=10.1990&lon=-68.0050&radius_meters=1000",
        headers=headers
    )
    assert response.status_code == 200
    assert len(response.json()) >= 1