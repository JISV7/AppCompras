from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr
from src.schemas.common import BaseSchema


class UserCreate(BaseSchema):
    username: str
    email: EmailStr
    password: str


class UserRead(BaseSchema):
    user_id: UUID
    username: str
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
