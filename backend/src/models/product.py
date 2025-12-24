import datetime
import uuid
from sqlalchemy import String, DECIMAL, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.models.base import Base

class Product(Base):
    __tablename__ = "products"

    barcode: Mapped[str] = mapped_column(String(20), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150))
    brand: Mapped[str | None] = mapped_column(String(100))
    category: Mapped[str | None] = mapped_column(String(50))
    image_url: Mapped[str | None] = mapped_column(String)
    data_source: Mapped[str] = mapped_column(String(20), default="USER")
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now())

class PriceLog(Base):
    __tablename__ = "price_logs"

    log_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    product_barcode: Mapped[str] = mapped_column(ForeignKey("products.barcode"))
    store_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stores.store_id"))
    # user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id")) # Uncomment when user model exists
    price: Mapped[float] = mapped_column(DECIMAL(10, 2))
    currency: Mapped[str] = mapped_column(String(5), default="USD")
    recorded_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now())
