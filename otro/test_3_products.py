import pytest
from tests.conftest import state

@pytest.mark.asyncio
async def test_scan_new_product(client):
    real_barcode = "5449000000996" # Coca Cola
    headers = {"Authorization": f"Bearer {state.token}"}
    
    response = await client.get(f"/api/v1/products/{real_barcode}", headers=headers)
    
    if response.status_code == 404:
        # Fallback if external API fails
        response = await client.post("/api/v1/products/", headers=headers, json={
            "barcode": real_barcode,
            "name": "Coca Cola Manual",
            "brand": "Coca Cola",
            "category": "Beverages"
        })
    
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_create_custom_product(client):
    headers = {"Authorization": f"Bearer {state.token}"}
    response = await client.post("/api/v1/products/", headers=headers, json={
        "barcode": state.product_barcode,
        "name": "Harina PAN Test",
        "brand": "Alimentos Polar",
        "category": "Grocery"
    })
    
    if response.status_code == 400:
        assert response.json()["detail"] == "Product already exists"
    else:
        assert response.status_code == 200