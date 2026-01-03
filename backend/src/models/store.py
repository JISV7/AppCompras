import uuid

from geoalchemy2 import Geography
from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class Store(Base):
    __tablename__ = "stores"

    store_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"
    )
    name: Mapped[str] = mapped_column(String(100), index=True)
    address: Mapped[str | None] = mapped_column(Text)

    location = Column(Geography(geometry_type="POINT", srid=4326))
