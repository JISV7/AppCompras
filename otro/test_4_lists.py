import pytest
from tests.conftest import state

@pytest.mark.asyncio
async def test_create_shopping_list(client):
    headers = {"Authorization": f"Bearer {state.token}"}
    response = await client.post("/api/v1/lists/", headers=headers, json={
        "name": "Weekly Groceries",
        "budget_limit": 100.00,
        "currency": "USD"
    })
    assert response.status_code == 200
    state.list_id = response.json()["list_id"]

@pytest.mark.asyncio
async def test_add_item_to_list(client):
    headers = {"Authorization": f"Bearer {state.token}"}
    response = await client.post(f"/api/v1/lists/{state.list_id}/items", headers=headers, json={
        "product_barcode": state.product_barcode,
        "quantity": 2
    })
    assert response.status_code == 200