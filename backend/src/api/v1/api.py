from fastapi import APIRouter

from src.api.v1.endpoints import auth, lists, prices, products, stores

api_router = APIRouter()

# api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(stores.router, prefix="/stores", tags=["Stores"])
api_router.include_router(lists.router, prefix="/lists", tags=["Shopping Lists"])
api_router.include_router(prices.router, prefix="/prices", tags=["Prices"])
