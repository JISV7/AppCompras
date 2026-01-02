import uuid

from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy import select

from src.core.deps import CurrentUser, SessionDep
from src.models.product import Product
from src.models.shopping_list import ListItem, ShoppingList
from src.models.store import Store
from src.models.price import PriceLog
from src.schemas.shopping_list import (
    ListItemCreate,
    ListItemUpdate,
    ShoppingListCreate,
    ShoppingListRead,
    ShoppingListUpdate,
)
from src.schemas.price import PriceLogCreate

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
        select(ShoppingList)
        .where(ShoppingList.user_id == current_user.user_id)
        .order_by(ShoppingList.status.asc(), ShoppingList.created_at.desc())
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
        raise HTTPException(
            status_code=403, detail="Not authorized to update this list"
        )

    update_data = list_update.model_dump(exclude_unset=True)

    if shopping_list.status == "COMPLETED":
        # Only allow updates if we are changing status back to ACTIVE (re-opening)
        if update_data.get("status") != "ACTIVE":
            raise HTTPException(
                status_code=400,
                detail="Cannot edit a completed list. Re-open it first.",
            )
        else:
            # Reset planned prices to defaults (None) on reopen
            for item in shopping_list.items:
                item.planned_price = None

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
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this list"
        )

    await db.delete(shopping_list)
    await db.commit()


@router.post("/{list_id}/complete", response_model=ShoppingListRead)
async def complete_list(
    list_id: uuid.UUID,
    db: SessionDep,
    current_user: CurrentUser,
    store_id: uuid.UUID = Query(
        ...
    ),  # Assume all items were bought at this store for simplicity for now
):
    # 1. Verify list exists and belongs to user
    result = await db.execute(
        select(ShoppingList).where(ShoppingList.list_id == list_id)
    )
    shopping_list = result.scalars().first()
    if not shopping_list:
        raise HTTPException(status_code=404, detail="List not found")
    if shopping_list.user_id != current_user.user_id:
        raise HTTPException(
            status_code=403, detail="Not authorized to complete this list"
        )

    # 2. Verify Store exists
    store_check = await db.execute(select(Store).where(Store.store_id == store_id))
    if not store_check.scalars().first():
        raise HTTPException(
            status_code=404, detail=f"Store with ID {store_id} not found."
        )

    # 3. Process each item in the list
    for item in shopping_list.items:
        # If item has a price, we want to ensure it is logged and marked as purchased
        if item.planned_price is not None:
            if not item.is_purchased:
                item.is_purchased = True

            # Use item's specific store if assigned, else use the list's completion store
            final_store_id = item.store_id or store_id
            if not item.store_id:
                item.store_id = final_store_id

            # Log price if not already logged for this specific event
            existing_price_log = await db.execute(
                select(PriceLog).where(
                    PriceLog.product_barcode == item.product_barcode,
                    PriceLog.user_id == current_user.user_id,
                    PriceLog.store_id == final_store_id,
                    PriceLog.price == item.planned_price,
                )
            )
            if not existing_price_log.scalars().first():
                price_log_create = PriceLogCreate(
                    product_barcode=item.product_barcode,
                    store_id=final_store_id,
                    price=item.planned_price,
                    currency=shopping_list.currency,
                )
                new_price_log = PriceLog(
                    **price_log_create.model_dump(), user_id=current_user.user_id
                )
                db.add(new_price_log)
            db.add(item)
        elif not item.is_purchased:
            # Item has no price but we are completing the list, mark as purchased anyway
            item.is_purchased = True
            if not item.store_id:
                item.store_id = store_id
            db.add(item)

    # 4. Update shopping list status
    shopping_list.status = "COMPLETED"
    db.add(shopping_list)

    await db.commit()
    await db.refresh(
        shopping_list
    )  # Refresh to get latest state, including updated items
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

    # 3. Check if Item already exists in the list
    existing_item = await db.execute(
        select(ListItem).where(
            ListItem.list_id == list_id,
            ListItem.product_barcode == item_in.product_barcode,
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
        select(ListItem).where(ListItem.list_id == list_id, ListItem.item_id == item_id)
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

    update_data = item_in.model_dump(exclude_unset=True)

    if shopping_list.status == "COMPLETED":
        if "planned_price" in update_data:
            raise HTTPException(
                status_code=400, detail="Cannot update price in a completed list"
            )

    # 2. Find the item
    item_result = await db.execute(
        select(ListItem).where(ListItem.list_id == list_id, ListItem.item_id == item_id)
    )
    item = item_result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # 3. Update
    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    # If item is marked as purchased, log the price
    if (
        item.is_purchased
        and item.planned_price is not None
        and item.store_id is not None
    ):
        # Verify Store exists
        store_check = await db.execute(
            select(Store).where(Store.store_id == item.store_id)
        )
        if not store_check.scalars().first():
            raise HTTPException(
                status_code=404, detail=f"Store with ID {item.store_id} not found."
            )

        # Check if a price log already exists for this item, user, store, and price to avoid duplicates
        existing_price_log = await db.execute(
            select(PriceLog).where(
                PriceLog.product_barcode == item.product_barcode,
                PriceLog.user_id == current_user.user_id,
                PriceLog.store_id == item.store_id,
                PriceLog.price == item.planned_price,
            )
        )
        if not existing_price_log.scalars().first():
            price_log_create = PriceLogCreate(
                product_barcode=item.product_barcode,
                store_id=item.store_id,
                price=item.planned_price,
                currency=shopping_list.currency,  # Use the list's currency
            )
            new_price_log = PriceLog(
                **price_log_create.model_dump(), user_id=current_user.user_id
            )
            db.add(new_price_log)

    db.add(item)
    await db.commit()

    # 4. Refresh List to return full structure
    await db.refresh(shopping_list)
    return shopping_list
