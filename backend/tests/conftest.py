import pytest
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator
from sqlalchemy import text  # <--- Import text
from src.main import app
from src.core.database import engine  # <--- Make sure to import your engine


# 1. New Fixture: Initialize Database Extension
@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        # This ensures PostGIS functions are available
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
    yield
    # Cleanup is handled by the session scope ending


# 2. Your existing client fixture
@pytest.fixture(scope="session")
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


class TestState:
    token: str = ""
    user_id: str = ""
    store_id: str = ""
    list_id: str = ""
    product_barcode: str = "7591016000000"


state = TestState()
