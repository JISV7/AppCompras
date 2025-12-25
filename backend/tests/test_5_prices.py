import pytest
from tests.conftest import state

@pytest.mark.asyncio
async def test_report_price(client):
    headers = {"Authorization": f"Bearer {state.token}"}
    
    # We use 'price' now, matching your SQL
    response = await client.post("/api/v1/prices/", headers=headers, json={
        "product_barcode": state.product_barcode,
        "store_id": str(state.store_id),
        "price": 3.50,  
        "currency": "USD"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["price"] == 3.50
    assert "log_id" in data

@pytest.mark.asyncio
async def test_get_prices_for_product(client):
    headers = {"Authorization": f"Bearer {state.token}"}
    
    response = await client.get(f"/api/v1/prices/product/{state.product_barcode}", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["price"] == 3.50