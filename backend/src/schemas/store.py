from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from src.schemas.common import BaseSchema

class StoreCreate(BaseSchema):
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float

class StoreRead(BaseSchema):
    store_id: UUID
    name: str
    address: Optional[str] = None
