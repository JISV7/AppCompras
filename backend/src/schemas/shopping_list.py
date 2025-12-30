from typing import List, Optional
from datetime import datetime
from uuid import UUID

from src.schemas.common import BaseSchema


# Item Schemas
class ListItemCreate(BaseSchema):
    product_barcode: str
    quantity: int = 1
    store_id: Optional[UUID] = None


class ListItemRead(BaseSchema):
    item_id: UUID
    product_barcode: str
    quantity: int
    planned_price: Optional[float] = None
    is_purchased: bool
    added_at: datetime
    store_id: Optional[UUID] = None


class ListItemUpdate(BaseSchema):
    quantity: Optional[int] = None
    planned_price: Optional[float] = None
    is_purchased: Optional[bool] = None
    store_id: Optional[UUID] = None


# List Schemas
class ShoppingListCreate(BaseSchema):
    name: str
    budget_limit: Optional[float] = None
    currency: str = "USD"


class ShoppingListUpdate(BaseSchema):
    name: Optional[str] = None
    budget_limit: Optional[float] = None
    currency: Optional[str] = None
    store_id: Optional[UUID] = None


class ShoppingListRead(BaseSchema):
    list_id: UUID
    name: str
    budget_limit: Optional[float]
    currency: Optional[str] # Match model
    status: str
    items: List[ListItemRead] = []
