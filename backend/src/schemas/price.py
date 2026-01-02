from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import Field

from src.schemas.common import BaseSchema


class PriceLogCreate(BaseSchema):
    product_barcode: str
    store_id: UUID
    price: float = Field(..., gt=0, description="Price value")
    currency: str = "USD"


class PriceLogRead(BaseSchema):
    log_id: UUID
    product_barcode: str
    store_id: UUID
    price: float
    currency: str
    recorded_at: datetime


class PriceComparison(BaseSchema):
    store_id: UUID
    store_name: str
    address: Optional[str] = None
    price: float
    currency: str
    recorded_at: datetime
    distance_meters: Optional[float] = None
