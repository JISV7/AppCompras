import uuid
from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from src.core.deps import SessionDep, CurrentUser
from src.models.shopping_list import ShoppingList, ListItem
from src.models.product import Product
from src.schemas.shopping_list import (
    ShoppingListCreate,
    ShoppingListRead,
    ListItemCreate,
)

router = APIRouter()


@router.post("/", response_model=ShoppingListRead)
async def create_list(
    list_in: ShoppingListCreate, db: SessionDep, current_user: CurrentUser
):
    new_list = ShoppingList(**list_in.model_dump(), user_id=current_user.user_id)
    db.add(new_list)
    await db.commit()
    await db.refresh(new_list)
    return new_list


@router.get("/", response_model=list[ShoppingListRead])
async def get_my_lists(db: SessionDep, current_user: CurrentUser):
    result = await db.execute(
        select(ShoppingList).where(ShoppingList.user_id == current_user.user_id)
    )
    return result.scalars().all()


@router.get("/{list_id}", response_model=ShoppingListRead)
async def get_list(list_id: uuid.UUID, db: SessionDep, current_user: CurrentUser):
    result = await db.execute(
        select(ShoppingList).where(ShoppingList.list_id == list_id)
    )
    shopping_list = result.scalars().first()
    if not shopping_list:
        raise HTTPException(status_code=404, detail="List not found")

    if shopping_list.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this list")

    return shopping_list


@router.post("/{list_id}/items", response_model=ShoppingListRead)
async def add_item(
    list_id: uuid.UUID,
    item_in: ListItemCreate,
    db: SessionDep,
    current_user: CurrentUser,
):
    # 1. Verify list exists and belongs to user
    result = await db.execute(
        select(ShoppingList).where(ShoppingList.list_id == list_id)
    )
    shopping_list = result.scalars().first()
    if not shopping_list:
        raise HTTPException(status_code=404, detail="List not found")
    if shopping_list.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this list")

    # 2. Verify Product Exists (Prevent 500 Error)
    # We check if the product is in our DB. If not, the frontend should probably
    # call the "Create Product" endpoint first, or we could handle it here.
    # For now, we enforce that the product must exist.
    product_check = await db.execute(
        select(Product).where(Product.barcode == item_in.product_barcode)
    )
    if not product_check.scalars().first():
        raise HTTPException(
            status_code=404,
            detail=f"Product {item_in.product_barcode} not found. Scan it first!",
        )

    # 3. Add item
    new_item = ListItem(list_id=list_id, **item_in.model_dump())
    db.add(new_item)
    await db.commit()

    # Refresh parent to load the new item relationship
    await db.refresh(shopping_list)
    return shopping_list
