from typing import Any
from fastapi import APIRouter

from src.schemas.user import UserRead
from src.core.deps import CurrentUser

router = APIRouter()


@router.get("/me", response_model=UserRead)
def read_user_me(current_user: CurrentUser) -> Any:
    return current_user
