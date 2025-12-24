from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from src.core.deps import SessionDep
from src.core import security
from src.core.config import settings
from src.models.user import User
from src.schemas.user import UserCreate, UserRead, Token

router = APIRouter()

@router.post("/register", response_model=UserRead)
async def register(user_in: UserCreate, db: SessionDep):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=security.get_password_hash(user_in.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: SessionDep):
    # Verify User
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalars().first()
    
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(user.user_id, expires_delta=access_token_expires)
    
    return {"access_token": access_token, "token_type": "bearer"}