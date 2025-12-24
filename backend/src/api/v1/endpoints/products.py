from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from src.core.deps import SessionDep
from src.models.product import Product
from src.schemas.product import ProductRead, ProductCreate
from src.services.external_product import fetch_product_from_off

router = APIRouter()

@router.get("/{barcode}", response_model=ProductRead)
async def get_product(barcode: str, db: SessionDep):
    result = await db.execute(select(Product).where(Product.barcode == barcode))
    product = result.scalars().first()

    if product:
        return product

    external_data = await fetch_product_from_off(barcode)
    
    if not external_data:
        raise HTTPException(status_code=404, detail="Product not found")

    new_product = Product(**external_data)
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    return new_product

@router.post("/", response_model=ProductRead)
async def create_product(product_in: ProductCreate, db: SessionDep):
    db_product = Product(**product_in.model_dump())
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product
