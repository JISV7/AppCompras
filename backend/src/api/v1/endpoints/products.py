from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from src.core.deps import SessionDep, CurrentUser
from src.models.product import Product
from src.schemas.product import ProductRead, ProductCreate
from src.services.external_product import fetch_product_from_off

router = APIRouter()


@router.get("/{barcode}", response_model=ProductRead)
async def get_product(barcode: str, db: SessionDep, current_user: CurrentUser):
    result = await db.execute(select(Product).where(Product.barcode == barcode))
    product = result.scalars().first()

    if product:
        return product

    external_data = await fetch_product_from_off(barcode)

    if not external_data:
        raise HTTPException(status_code=404, detail="Product not found")

    # Auto-save the product found in OpenFoodFacts to our DB
    new_product = Product(**external_data)
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)

    return new_product


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
