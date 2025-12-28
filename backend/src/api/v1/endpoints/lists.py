import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from src.core.deps import CurrentUser, SessionDep
from src.models.product import Product
from src.models.shopping_list import ListItem, ShoppingList
from src.schemas.shopping_list import (
    ListItemCreate,
    ListItemUpdate,
    ShoppingListCreate,
    ShoppingListRead,
    ShoppingListUpdate,
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


@router.put("/{list_id}", response_model=ShoppingListRead)
async def update_list(
    list_id: uuid.UUID,
    list_update: ShoppingListUpdate,
    db: SessionDep,
    current_user: CurrentUser,
):
    result = await db.execute(
        select(ShoppingList).where(ShoppingList.list_id == list_id)
    )
    shopping_list = result.scalars().first()
    if not shopping_list:
        raise HTTPException(status_code=404, detail="List not found")

    if shopping_list.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this list")

    update_data = list_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shopping_list, field, value)

    db.add(shopping_list)
    await db.commit()
    await db.refresh(shopping_list)
    return shopping_list


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_list(list_id: uuid.UUID, db: SessionDep, current_user: CurrentUser):
    result = await db.execute(
        select(ShoppingList).where(ShoppingList.list_id == list_id)
    )
    shopping_list = result.scalars().first()
    if not shopping_list:
        raise HTTPException(status_code=404, detail="List not found")

    if shopping_list.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this list")

    await db.delete(shopping_list)
    await db.commit()


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

    # 3. Check if Item already exists in the list
    existing_item = await db.execute(
        select(ListItem).where(
            ListItem.list_id == list_id,
            ListItem.product_barcode == item_in.product_barcode
        )
    )
    item = existing_item.scalars().first()

    if item:
        # Increment quantity
        item.quantity += item_in.quantity
        db.add(item)
    else:
        # Create new item
        new_item = ListItem(list_id=list_id, **item_in.model_dump())
        db.add(new_item)

    await db.commit()

    # Refresh parent to load the new item relationship
    await db.refresh(shopping_list)
    return shopping_list


@router.delete("/{list_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    list_id: uuid.UUID,
    item_id: uuid.UUID,
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

    # 2. Find the item
    item_result = await db.execute(
        select(ListItem).where(
            ListItem.list_id == list_id,
            ListItem.item_id == item_id
        )
    )
    item = item_result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # 3. Delete
    await db.delete(item)
    await db.commit()


@router.put("/{list_id}/items/{item_id}", response_model=ShoppingListRead)
async def update_item(
    list_id: uuid.UUID,
    item_id: uuid.UUID,
    item_in: ListItemUpdate,
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

    # 2. Find the item
    item_result = await db.execute(
        select(ListItem).where(
            ListItem.list_id == list_id,
            ListItem.item_id == item_id
        )
    )
    item = item_result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # 3. Update
    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.add(item)
    await db.commit()
    
    # 4. Refresh List to return full structure
    await db.refresh(shopping_list)
    return shopping_list
