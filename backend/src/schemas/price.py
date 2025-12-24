from pydantic import BaseModel
from src.schemas.common import BaseSchema

class PriceLogCreate(BaseSchema):
    product_barcode: str
    store_id: str # UUID
    price: float
    currency: str = "USD"