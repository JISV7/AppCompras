from fastapi import APIRouter
from src.core.deps import SessionDep, CurrentUser
from src.models.product import PriceLog
from src.schemas.price import PriceLogCreate
import uuid

router = APIRouter()

@router.post("/", status_code=201)
async def log_price(
    price_in: PriceLogCreate, 
    db: SessionDep, 
    current_user: CurrentUser
):
    new_log = PriceLog(
        product_barcode=price_in.product_barcode,
        store_id=uuid.UUID(price_in.store_id),
        user_id=current_user.user_id,
        price=price_in.price,
        currency=price_in.currency
    )
    db.add(new_log)
    await db.commit()
    return {"message": "Price logged successfully"}