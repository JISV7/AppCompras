from typing import Optional, List
from pydantic import BaseModel
from src.schemas.common import BaseSchema

# Item Schemas
class ListItemCreate(BaseSchema):
    product_barcode: str
    quantity: int = 1

class ListItemRead(BaseSchema):
    item_id: str
    product_barcode: str
    quantity: int
    is_purchased: bool

# List Schemas
class ShoppingListCreate(BaseSchema):
    name: str
    budget_limit: Optional[float] = None
    currency: str = "USD"

class ShoppingListRead(BaseSchema):
    list_id: str
    name: str
    budget_limit: Optional[float]
    status: str
    items: List[ListItemRead] = []