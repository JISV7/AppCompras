from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, or_
from sqlalchemy.dialects.postgresql import insert

from src.core.deps import CurrentUser, SessionDep
from src.models.product import Product
from src.models.views import SmartPriceEstimate, PricePrediction
from src.schemas.product import ProductCreate, ProductRead
from src.services.external_product import (
    fetch_product_from_off,
    normalize_to_gtin13,
    validate_gtin,
)

router = APIRouter()


@router.get("/", response_model=List[ProductRead])
async def search_products(
    db: SessionDep,
    current_user: CurrentUser,
    q: Optional[str] = Query(
        None, description="Search query for name, brand, or category"
    ),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    stmt = select(Product)
    if q:
        search_filter = f"%{q}%"
        stmt = stmt.where(
            or_(
                Product.name.ilike(search_filter),
                Product.brand.ilike(search_filter),
                Product.category.ilike(search_filter),
                Product.barcode.ilike(search_filter),
            )
        )

    stmt = stmt.limit(limit).offset(offset).order_by(Product.name.asc())
    result = await db.execute(stmt)
    products = result.scalars().all()

    # Enrich with estimates if needed (optional for search list to keep it fast,
    # but the schema requires it or allows null)
    # For now, return basic product data as per ProductRead
    return products


@router.get("/{barcode}", response_model=ProductRead)
async def get_product(barcode: str, db: SessionDep, current_user: CurrentUser):
    # Validate the barcode first
    validate_gtin(barcode)

    # Normalize the input barcode to GTIN-13 for consistent lookup
    normalized_barcode = normalize_to_gtin13(barcode)

    result = await db.execute(
        select(Product).where(Product.barcode == normalized_barcode)
    )
    product = result.scalars().first()

    # If product not in DB, try external
    if not product:
        external_data = await fetch_product_from_off(barcode)

        if not external_data:
            raise HTTPException(status_code=404, detail="Product not found")

        # Auto-save the product found in OpenFoodFacts to our DB using upsert
        stmt = insert(Product).values(**external_data)
        stmt = stmt.on_conflict_do_update(
            index_elements=["barcode"],
            set_=dict(
                name=stmt.excluded.name,
                brand=stmt.excluded.brand,
                category=stmt.excluded.category,
                image_url=stmt.excluded.image_url,
                data_source=stmt.excluded.data_source,
                created_at=stmt.excluded.created_at,  # Preserve original creation time
            ),
        )

        await db.execute(stmt)
        await db.commit()

        # Fetch the upserted product to return it
        result = await db.execute(
            select(Product).where(Product.barcode == normalized_barcode)
        )
        product = result.scalars().first()

    if not product:
        raise HTTPException(status_code=500, detail="Failed to upsert product")

    # Fetch estimates
    estimate_res = await db.execute(
        select(SmartPriceEstimate).where(
            SmartPriceEstimate.barcode == normalized_barcode
        )
    )
    estimate = estimate_res.scalars().first()

    # Fetch predictions
    prediction_res = await db.execute(
        select(PricePrediction).where(
            PricePrediction.product_barcode == normalized_barcode
        )
    )
    prediction = prediction_res.scalars().first()

    # Convert to schema
    product_data = ProductRead.model_validate(product)
    if estimate and estimate.estimated_price_usd is not None:
        product_data.estimated_price_usd = float(estimate.estimated_price_usd)
    if prediction and prediction.predicted_price_usd is not None:
        product_data.predicted_price_usd = float(prediction.predicted_price_usd)

    return product_data


@router.post("/", response_model=ProductRead)
async def create_product(
    product_in: ProductCreate, db: SessionDep, current_user: CurrentUser
):
    # Check if exists
    existing = await db.execute(
        select(Product).where(Product.barcode == product_in.barcode)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Product already exists")

    db_product = Product(**product_in.model_dump())
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product
