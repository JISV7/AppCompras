import openfoodfacts
from fastapi.concurrency import run_in_threadpool
from typing import Optional, Dict, Any

api = openfoodfacts.API(user_agent="ElPrecioJusto/1.0 (destructomax1@gmail.com)")


async def fetch_product_from_off(barcode: str) -> Optional[Dict[str, Any]]:
    """
    Fetches product metadata using the official openfoodfacts SDK.
    """
    try:
        fields_needed = [
            "code",
            "product_name",
            "brands",
            "categories",
            "image_url",
            "image_front_url",
        ]

        product_data = await run_in_threadpool(
            api.product.get, barcode, fields=fields_needed
        )

        if not product_data:
            return None

        return {
            "barcode": str(product_data.get("code", barcode)),
            "name": product_data.get("product_name", "Unknown Product"),
            "brand": product_data.get("brands", None),
            "image_url": product_data.get(
                "image_url", product_data.get("image_front_url")
            ),
            "category": product_data.get("categories", "").split(",")[0]
            if product_data.get("categories")
            else None,
            "data_source": "OFF",
        }

    except Exception:
        return None
