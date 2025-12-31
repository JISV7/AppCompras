from fastapi import APIRouter, Query
from geoalchemy2 import Geometry
from geoalchemy2.elements import WKTElement
from sqlalchemy import func, select, or_

from src.core.deps import CurrentUser, SessionDep
from src.models.store import Store
from src.schemas.store import StoreCreate, StoreRead

router = APIRouter()


@router.post("/", response_model=StoreRead)
async def create_store(store_in: StoreCreate, db: SessionDep, current_user: CurrentUser):
    # SRID 4326 is WGS 84 (GPS coordinates)
    point = f"POINT({store_in.longitude} {store_in.latitude})"

    new_store = Store(
        name=store_in.name,
        address=store_in.address,
        location=WKTElement(point, srid=4326),
    )
    db.add(new_store)
    await db.commit()
    await db.refresh(new_store)

    # Manually attach lat/lon for the response
    setattr(new_store, "latitude", store_in.latitude)
    setattr(new_store, "longitude", store_in.longitude)
    
    return new_store


@router.get("/", response_model=list[StoreRead])
async def search_stores(
    db: SessionDep,
    q: str | None = Query(None),
    limit: int = 50,
    offset: int = 0,
):
    # Select Store object AND coordinates
    # Cast Geography to Geometry for ST_X/ST_Y
    stmt = select(
        Store,
        func.ST_Y(func.cast(Store.location, Geometry)).label("latitude"),
        func.ST_X(func.cast(Store.location, Geometry)).label("longitude")
    )

    if q:
        stmt = stmt.where(
            or_(
                Store.name.ilike(f"%{q}%"),
                Store.address.ilike(f"%{q}%")
            )
        )
    
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    
    stores = []
    for row in result:
        store_obj = row[0]
        # Attach the computed coordinates to the ORM object
        setattr(store_obj, "latitude", row.latitude)
        setattr(store_obj, "longitude", row.longitude)
        stores.append(store_obj)
        
    return stores


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

    stmt = select(
        Store,
        func.ST_Y(func.cast(Store.location, Geometry)).label("latitude"),
        func.ST_X(func.cast(Store.location, Geometry)).label("longitude")
    ).where(
        func.ST_DWithin(Store.location, user_location, radius_meters, True)
    )

    result = await db.execute(stmt)
    stores = []
    for row in result:
        store_obj = row[0]
        setattr(store_obj, "latitude", row.latitude)
        setattr(store_obj, "longitude", row.longitude)
        stores.append(store_obj)
        
    return stores