from sqlalchemy import String, DECIMAL, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column
from src.models.base import Base

class SmartPriceEstimate(Base):
    __tablename__ = "v_smart_price_estimates"
    # Treat as read-only view
    __table_args__ = {"info": dict(is_view=True)}
    
    barcode: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    image_url: Mapped[str | None] = mapped_column(String)
    estimated_price_usd: Mapped[float | None] = mapped_column(Float) # Using Float for simplicity with Pydantic
    highest_price: Mapped[float | None] = mapped_column(DECIMAL(10, 2))
    lowest_price: Mapped[float | None] = mapped_column(DECIMAL(10, 2))
    data_points: Mapped[int] = mapped_column(Integer)

class PricePrediction(Base):
    __tablename__ = "v_price_predictions"
    __table_args__ = {"info": dict(is_view=True)}

    product_barcode: Mapped[str] = mapped_column(String, primary_key=True)
    predicted_price_usd: Mapped[float | None] = mapped_column(DECIMAL(10, 2))
    reliability_score: Mapped[float | None] = mapped_column(Float)
