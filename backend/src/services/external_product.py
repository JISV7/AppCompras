import httpx
from typing import Optional

OFF_API_URL = "https://world.openfoodfacts.org/api/v0/product/{barcode}.json"

async def fetch_product_from_off(barcode: str) -> Optional[dict]:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(OFF_API_URL.format(barcode=barcode), timeout=5.0)
            if response.status_code != 200:
                return None
            
            data = response.json()
            if data.get("status") != 1:
                return None

            product = data.get("product", {})
            return {
                "barcode": str(product.get("code", barcode)),
                "name": product.get("product_name", "Unknown Product"),
                "brand": product.get("brands", None),
                "image_url": product.get("image_url", None),
                "category": product.get("categories", "").split(",")[0] if product.get("categories") else None,
                "data_source": "OFF"
            }
        except Exception:
            return None
