import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from src.core.deps import SessionDep, CurrentUser
from src.models.shopping_list import ShoppingList, ListItem
from src.schemas.shopping_list import ShoppingListCreate, ShoppingListRead, ListItemCreate

router = APIRouter()

@router.post("/", response_model=ShoppingListRead)
async def create_list(
    list_in: ShoppingListCreate, 
    db: SessionDep, 
    current_user: CurrentUser
):
    new_list = ShoppingList(**list_in.model_dump(), user_id=current_user.user_id)
    db.add(new_list)
    await db.commit()
    await db.refresh(new_list)
    return new_list

@router.get("/", response_model=list[ShoppingListRead])
async def get_my_lists(db: SessionDep, current_user: CurrentUser):
    result = await db.execute(select(ShoppingList).where(ShoppingList.user_id == current_user.user_id))
    return result.scalars().all()

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