import uuid
from datetime import datetime, timedelta
from typing import Annotated, Any
import random

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import get_password_hash
from src.core import security
from src.core.config import settings
from src.core.deps import SessionDep
from src.models.user import User
from src.models.password_reset import PasswordReset
from src.schemas.user import Token, UserCreate, UserRead, ForgotPasswordRequest, ResetPasswordRequest
from src.core.email_utils import send_reset_code

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=201)
async def register(user_in: UserCreate, db: SessionDep) -> Any:
    user_in.email = user_in.email.strip()
    user_in.username = user_in.username.strip()
    user_in.password = user_in.password.strip()
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
    user = User(email=user_in.email, username=user_in.username, password_hash=hashed_pw)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(
    db: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Any:

    email_input = form_data.username.strip()
    password_input = form_data.password.strip()
    # 1. Authenticate via EMAIL
    result = await db.execute(select(User).where(User.email == email_input))
    user = result.scalars().first()

    # 2. Verify Password
    if not user or not security.verify_password(password_input, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Generate Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.user_id)}, 
        expires_delta=access_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/forgot-password", status_code=200)
async def forgot_password(
    data: ForgotPasswordRequest,
    session: SessionDep
):
    result = await session.execute(select(User).where(User.email == data.email))
    user = result.scalars().first()

    if not user:
        return {"message": "A code has been sent to your email."}
    
    code = f"{random.randint(100000, 999999)}"
    expires = datetime.utcnow() + timedelta(minutes=15)
    
    reset_entry = PasswordReset(
        user_id=user.user_id,
        code=code,
        expires_at=expires
    )
    session.add(reset_entry)
    await session.commit()
    try:
        await send_reset_code(user.email, code)
        print(f"✅ Email sent successfully to {user.email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

    return {"message": "Code sent successfully"}


@router.post("/reset-password", status_code=200)
async def reset_password(
    data: ResetPasswordRequest,
    session: SessionDep
):
    user_result = await session.execute(select(User).where(User.email == data.email))
    user = user_result.scalars().first()
    
    if not user:
         raise HTTPException(status_code=400, detail="Invalid request")

    stmt = select(PasswordReset).where(
        PasswordReset.user_id == user.user_id,
        PasswordReset.code == data.code,
        PasswordReset.is_used == False,
        PasswordReset.expires_at > datetime.utcnow()
    )
    result = await session.execute(stmt)
    reset_entry = result.scalars().first()

    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    user.password_hash = get_password_hash(data.new_password)
    reset_entry.is_used = True
    
    session.add(user)
    session.add(reset_entry)
    await session.commit()

    return {"message": "Password updated successfully"}