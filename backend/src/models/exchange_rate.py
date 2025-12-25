import uuid
import datetime
from sqlalchemy import String, DECIMAL, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.models.base import Base

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    rate_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    currency_code: Mapped[str] = mapped_column(String(5)) # USD, EUR
    rate_to_ves: Mapped[float] = mapped_column(DECIMAL(12, 4))
    source: Mapped[str | None] = mapped_column(String(50)) # "BCV", "Parallel", etc.
    recorded_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now())