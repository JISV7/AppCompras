import datetime
import uuid

from sqlalchemy import DECIMAL, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class PriceLog(Base):
    __tablename__ = "price_logs"

    log_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )

    product_barcode: Mapped[str] = mapped_column(ForeignKey("products.barcode"))
    store_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stores.store_id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id"))

    price: Mapped[float] = mapped_column(DECIMAL(18, 8))
    currency: Mapped[str] = mapped_column(String(5), default="USD")
    recorded_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
