from typing import Optional

from src.schemas.common import BaseSchema


class ProductCreate(BaseSchema):
    barcode: str
    name: str
    brand: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None


class ProductRead(ProductCreate):
    data_source: str
    estimated_price_usd: Optional[float] = None
    predicted_price_usd: Optional[float] = None
