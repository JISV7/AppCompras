from datetime import timedelta
from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from src.core.deps import SessionDep
from src.core import security
from src.core.config import settings
from src.models.user import User
from src.schemas.user import UserCreate, UserRead, Token

router = APIRouter()

@router.post("/register", response_model=UserRead, status_code=201)
async def register(user_in: UserCreate, db: SessionDep) -> Any:
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )
    print(f"\n---> DEBUG: user_in object: {user_in}")
    print(f"---> DEBUG: user_in.password type: {type(user_in.password)}")
    print(f"---> DEBUG: user_in.password value: {user_in.password}")
    hashed_pw = security.get_password_hash(user_in.password)
    print(f"---> DEBUG: hashed_pw value: {hashed_pw}")
    user = User(
        email=user_in.email,
        username=user_in.username,
        password_hash=hashed_pw
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=Token)
async def login(
    db: SessionDep, 
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Any:
    # 1. Authenticate via EMAIL
    # OAuth2 forms always send the email in the 'username' field
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    # 2. Verify Password using 'password_hash' from your Model
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Generate Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=str(user.user_id), # Ensure UUID is converted to string for JWT
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}