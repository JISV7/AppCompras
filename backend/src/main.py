from contextlib import asynccontextmanager
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from src.api.v1.api import api_router
from src.core.config import settings
from src.core.database import AsyncSessionLocal
from src.core.deps import SessionDep
from src.services.exchange_rate_updater import update_exchange_rate

logger = logging.getLogger(__name__)


async def run_rate_update():
    """Helper function to create a DB session for the scheduled job."""
    logger.info("Scheduler starting job: update_exchange_rate")
    async with AsyncSessionLocal() as db:
        await update_exchange_rate(db)
    logger.info("Scheduler finished job: update_exchange_rate")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events for the application.
    Starts a scheduler for background tasks.
    """
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(
        run_rate_update,
        "cron",
        hour=23,
        minute=0,
        day_of_week="mon-fri",
        name="update_exchange_rate",
    )
    scheduler.start()
    logger.info(
        "Scheduler started. Job 'update_exchange_rate' scheduled for 23:00 UTC, Mon-Fri."
    )

    yield

    scheduler.shutdown()
    logger.info("Scheduler shut down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace "*" with specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "Smart Budget API is running"}


@app.get("/health", status_code=200)
async def health_check(db: SessionDep, response: Response):
    """
    Checks if the API is running and DB is reachable.
    """
    try:
        # Tries to execute a simple query
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        # If DB fails, return 503 Service Unavailable
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "error", "database": "unreachable", "detail": str(e)}
