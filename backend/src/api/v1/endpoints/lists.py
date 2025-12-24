import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from src.core.deps import SessionDep
from src.models.shopping_list import ShoppingList, ListItem
from src.schemas.shopping_list import ShoppingListCreate, ShoppingListRead, ListItemCreate

# NOTE: In a real app, you would add a `get_current_user` dependency here 
# to ensure users only see their own lists.

router = APIRouter()

@router.post("/", response_model=ShoppingListRead)
async def create_list(list_in: ShoppingListCreate, db: SessionDep):
    # Hardcoded user_id for demo purposes since we aren't enforcing auth headers in this snippet
    # You should replace this with current_user.id
    demo_user_uuid = uuid.UUID("00000000-0000-0000-0000-000000000000") 
    
    new_list = ShoppingList(**list_in.model_dump(), user_id=demo_user_uuid)
    db.add(new_list)
    await db.commit()
    await db.refresh(new_list)
    return new_list

@router.get("/{list_id}", response_model=ShoppingListRead)
async def get_list(list_id: uuid.UUID, db: SessionDep):
    result = await db.execute(select(ShoppingList).where(ShoppingList.list_id == list_id))
    shopping_list = result.scalars().first()
    if not shopping_list:
        raise HTTPException(status_code=404, detail="List not found")
    return shopping_list

@router.post("/{list_id}/items", response_model=ShoppingListRead)
async def add_item(list_id: uuid.UUID, item_in: ListItemCreate, db: SessionDep):
    # 1. Verify list exists
    result = await db.execute(select(ShoppingList).where(ShoppingList.list_id == list_id))
    shopping_list = result.scalars().first()
    if not shopping_list:
        raise HTTPException(status_code=404, detail="List not found")

    # 2. Add item
    new_item = ListItem(list_id=list_id, **item_in.model_dump())
    db.add(new_item)
    await db.commit()
    await db.refresh(shopping_list) # Refresh parent to load new items
    return shopping_list