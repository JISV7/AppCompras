import pytest
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator
from src.main import app

# We use "function" scope so the loop resets for each test, preventing crashes
@pytest.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    # ASGITransport connects directly to the FastAPI app without needing a running server
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

# Global state to share data between tests (IDs, Tokens)
class TestState:
    token: str = ""
    user_id: str = ""
    store_id: str = ""
    list_id: str = ""
    product_barcode: str = "7591016000000" # Fake Venezuelan barcode

state = TestState()