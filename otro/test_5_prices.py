import pytest
from tests.conftest import state

@pytest.mark.asyncio
async def test_log_price(client):
    headers = {"Authorization": f"Bearer {state.token}"}
    response = await client.post("/api/v1/prices/", headers=headers, json={
        "product_barcode": state.product_barcode,
        "store_id": state.store_id,
        "price": 45.50,
        "currency": "VES"
    })
    assert response.status_code == 201