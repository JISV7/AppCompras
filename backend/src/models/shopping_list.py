import datetime
import uuid

from sqlalchemy import DECIMAL, Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base


class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    list_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.user_id"))
    name: Mapped[str] = mapped_column(String(100))
    budget_limit: Mapped[float | None] = mapped_column(DECIMAL(10, 2))
    currency: Mapped[str] = mapped_column(String(5), default="USD")
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    # Relationships
    items = relationship(
        "ListItem",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ListItem(Base):
    __tablename__ = "list_items"

    item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    list_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("shopping_lists.list_id", ondelete="CASCADE")
    )
    product_barcode: Mapped[str] = mapped_column(ForeignKey("products.barcode"))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    is_purchased: Mapped[bool] = mapped_column(Boolean, default=False)
    added_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    shopping_list = relationship("ShoppingList", back_populates="items")
