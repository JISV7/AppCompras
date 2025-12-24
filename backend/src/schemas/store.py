from typing import Optional
from pydantic import BaseModel
from src.schemas.common import BaseSchema

class StoreCreate(BaseSchema):
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float

class StoreRead(BaseSchema):
    store_id: str  # UUID as str
    name: str
    address: Optional[str] = None
