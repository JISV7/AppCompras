from fastapi import APIRouter, Query
from geoalchemy2.elements import WKTElement
from sqlalchemy import func, select

from src.core.deps import SessionDep
from src.models.store import Store
from src.schemas.store import StoreCreate, StoreRead

router = APIRouter()


@router.post("/", response_model=StoreRead)
async def create_store(store_in: StoreCreate, db: SessionDep):
    point = f"POINT({store_in.longitude} {store_in.latitude})"

    new_store = Store(
        name=store_in.name,
        address=store_in.address,
        location=WKTElement(point, srid=4326),
    )
    db.add(new_store)
    await db.commit()
    await db.refresh(new_store)
    return new_store


@router.get("/nearby", response_model=list[StoreRead])
async def get_nearby_stores(
    db: SessionDep,
    lat: float,
    lon: float,
    radius_meters: int = Query(1000, ge=100, le=50000),
):
    user_location = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326).cast(
        type_=Store.location.type
    )

    query = select(Store).where(
        func.ST_DWithin(Store.location, user_location, radius_meters, True)
    )

    result = await db.execute(query)
    return result.scalars().all()
