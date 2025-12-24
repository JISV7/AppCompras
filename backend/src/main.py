from fastapi import FastAPI
from contextlib import asynccontextmanager
from src.core.config import settings
from src.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Smart Budget API is running"}
