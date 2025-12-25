import pytest
from tests.conftest import state


@pytest.mark.asyncio
async def test_create_shopping_list(client):
    headers = {"Authorization": f"Bearer {state.token}"}
    response = await client.post(
        "/api/v1/lists/",
        headers=headers,
        json={"name": "Weekly Groceries", "budget_limit": 100.00, "currency": "USD"},
    )

    assert response.status_code == 200
    data = response.json()

    assert data["name"] == "Weekly Groceries"
    assert "list_id" in data

    state.list_id = data["list_id"]


@pytest.mark.asyncio
async def test_add_item_to_list(client):
    headers = {"Authorization": f"Bearer {state.token}"}
    barcode = state.product_barcode
    qty = 2

    response = await client.post(
        f"/api/v1/lists/{state.list_id}/items",
        headers=headers,
        json={"product_barcode": barcode, "quantity": qty},
    )

    assert response.status_code == 200
    data = response.json()

    assert len(data["items"]) > 0
    assert data["items"][-1]["product_barcode"] == barcode
    assert data["items"][-1]["quantity"] == qty


@pytest.mark.asyncio
async def test_get_my_lists(client):
    """Verify we can fetch the list back"""
    headers = {"Authorization": f"Bearer {state.token}"}
    response = await client.get("/api/v1/lists/", headers=headers)

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[-1]["name"] == "Weekly Groceries"
