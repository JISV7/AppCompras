import re
from typing import Annotated, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, BeforeValidator, ConfigDict, field_validator

from src.schemas.common import BaseSchema

def trim_string(v: str) -> str:
    if isinstance(v, str):
        return v.strip()
    return v

TrimmedStr = Annotated[str, BeforeValidator(trim_string)]
TrimmedEmail = Annotated[EmailStr, BeforeValidator(trim_string)]

def validate_strong_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError('Password must be at least 8 characters long')
    if not re.search(r"\d", v):
        raise ValueError('Password must contain at least one number')
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
        raise ValueError('Password must contain at least one symbol (*, !, @, etc.)')
    return v

class UserCreate(BaseSchema):
    username: TrimmedStr
    email: TrimmedEmail
    password: TrimmedStr

    @field_validator('password')
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        return validate_strong_password(v)

class UserRead(BaseSchema):
    user_id: UUID
    username: str
    email: EmailStr
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: TrimmedEmail

class ResetPasswordRequest(BaseModel):
    email: TrimmedEmail
    code: str
    new_password: TrimmedStr

    @field_validator('new_password')
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        return validate_strong_password(v)