from fastapi import APIRouter, HTTPException
from sqlalchemy import select, desc
from src.core.deps import SessionDep, CurrentUser
from src.models.price import PriceLog
from src.models.product import Product
from src.models.store import Store
from src.schemas.price import PriceLogCreate, PriceLogRead

router = APIRouter()


@router.post("/", response_model=PriceLogRead)
async def report_price(
    price_in: PriceLogCreate, db: SessionDep, current_user: CurrentUser
):
    # 1. Verify Product exists
    product = await db.execute(
        select(Product).where(Product.barcode == price_in.product_barcode)
    )
    if not product.scalars().first():
        raise HTTPException(status_code=404, detail="Product not found. Scan it first!")

    # 2. Verify Store exists
    store = await db.execute(select(Store).where(Store.store_id == price_in.store_id))
    if not store.scalars().first():
        raise HTTPException(status_code=404, detail="Store not found.")

    # 3. Save Price Log
    new_log = PriceLog(**price_in.model_dump(), user_id=current_user.user_id)

    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    return new_log


@router.get("/product/{barcode}", response_model=list[PriceLogRead])
async def get_product_prices(barcode: str, db: SessionDep):
    """Get history of prices for a product (Newest first)"""
    result = await db.execute(
        select(PriceLog)
        .where(PriceLog.product_barcode == barcode)
        .order_by(desc(PriceLog.recorded_at))
        .limit(20)
    )
    return result.scalars().all()
