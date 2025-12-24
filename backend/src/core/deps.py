from typing import Annotated, AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import AsyncSessionLocal

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

SessionDep = Annotated[AsyncSession, Depends(get_db)]