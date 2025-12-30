from typing import Any, List
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy import select, desc
from src.core.deps import SessionDep, CurrentUser
from src.models.exchange_rate import ExchangeRate
from src.schemas.exchange_rate import ExchangeRateCreate, ExchangeRateRead
from src.services.exchange_rate_updater import update_exchange_rate

router = APIRouter()

@router.post("/update", response_model=ExchangeRateRead)
async def trigger_update(
    session: SessionDep,
    current_user: CurrentUser,  # Protect endpoint
):
    """Manually triggers the exchange rate update service."""
    new_rate = await update_exchange_rate(session)
    if not new_rate:
        raise HTTPException(
            status_code=500, detail="Failed to update exchange rate from any source."
        )
    return new_rate


@router.post("/", response_model=ExchangeRateRead, status_code=201)
async def create_exchange_rate(
    rate_in: ExchangeRateCreate,
    session: SessionDep
) -> Any:
    new_rate = ExchangeRate(
        currency_code=rate_in.currency_code.upper(),
        rate_to_ves=rate_in.rate_to_ves,
        source=rate_in.source
    )
    session.add(new_rate)
    await session.commit()
    await session.refresh(new_rate)
    return new_rate

@router.get("/latest", response_model=ExchangeRateRead)
async def get_latest_rate(
    session: SessionDep,
    currency: str = Query("USD", max_length=5)
) -> Any:
    stmt = (
        select(ExchangeRate)
        .where(ExchangeRate.currency_code == currency.upper())
        .order_by(desc(ExchangeRate.recorded_at))
        .limit(1)
    )
    result = await session.execute(stmt)
    rate = result.scalars().first()

    if not rate:
        raise HTTPException(status_code=404, detail=f"No rate found for {currency}")
    
    return rate

@router.get("/history", response_model=List[ExchangeRateRead])
async def get_rate_history(
    session: SessionDep,
    limit: int = 10
) -> Any:
    stmt = (
        select(ExchangeRate)
        .order_by(desc(ExchangeRate.recorded_at))
        .limit(limit)
    )
    result = await session.execute(stmt)
    return result.scalars().all()