from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import desc, select, func
from geoalchemy2 import Geometry

from src.core.deps import CurrentUser, SessionDep
from src.models.price import PriceLog
from src.models.product import Product
from src.models.store import Store
from src.schemas.price import PriceLogCreate, PriceLogRead, PriceComparison

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


@router.get("/comparison/{barcode}", response_model=list[PriceComparison])
async def get_price_comparison(
    barcode: str,
    db: SessionDep,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
):
    """
    Get the latest price for a product in every store where it has been recorded.
    If lat/lon provided, returns distance to each store.
    """
    # Subquery to get the latest price log ID per store for this product
    latest_logs_sq = (
        select(
            PriceLog.store_id,
            func.max(PriceLog.recorded_at).label("max_recorded_at")
        )
        .where(PriceLog.product_barcode == barcode)
        .group_by(PriceLog.store_id)
        .subquery()
    )

    # Join with PriceLog to get the full log data and Store to get name/location
    stmt = (
        select(
            PriceLog.price,
            PriceLog.currency,
            PriceLog.recorded_at,
            Store.store_id,
            Store.name.label("store_name"),
            Store.address,
        )
        .join(latest_logs_sq, (PriceLog.store_id == latest_logs_sq.c.store_id) & (PriceLog.recorded_at == latest_logs_sq.c.max_recorded_at))
        .join(Store, PriceLog.store_id == Store.store_id)
        .where(PriceLog.product_barcode == barcode)
    )

    if lat is not None and lon is not None:
        user_point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326).cast(Geometry)
        stmt = stmt.add_columns(
            func.ST_Distance(Store.location.cast(Geometry), user_point, True).label("distance_meters")
        )
        # Order by price (asc) then distance (asc)
        stmt = stmt.order_by(PriceLog.price.asc(), "distance_meters")
    else:
        stmt = stmt.order_by(PriceLog.price.asc())

    result = await db.execute(stmt)
    
    comparisons = []
    for row in result:
        comparison_dict = {
            "price": row.price,
            "currency": row.currency,
            "recorded_at": row.recorded_at,
            "store_id": row.store_id,
            "store_name": row.store_name,
            "address": row.address,
            "distance_meters": getattr(row, "distance_meters", None)
        }
        comparisons.append(PriceComparison(**comparison_dict))

    return comparisons
