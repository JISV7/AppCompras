import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class ExchangeRateBase(BaseModel):
    currency_code: str = Field(default="USD", max_length=5)
    rate_to_ves: Decimal = Field(..., gt=0, description="Exchange rate (e.g., 64.50)")
    source: str = Field(default="BCV", max_length=50)


class ExchangeRateCreate(ExchangeRateBase):
    pass


class ExchangeRateRead(ExchangeRateBase):
    rate_id: uuid.UUID
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)
