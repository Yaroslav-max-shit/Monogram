from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserCreate, UserLogin
from middleware.auth import get_current_user
from config import settings
from jose import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_token(user_id: int):
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@router.post("/register")
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email уже используется")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username уже занят")
    if len(data.pin_code) != 6 or not data.pin_code.isdigit():
        raise HTTPException(status_code=400, detail="PIN должен быть 6 цифр")
    
    user = User(
        email=data.email,
        username=data.username,
        password_hash=pwd_context.hash(data.password),
        pin_code=data.pin_code
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    from models import Account
    account = Account(user_id=user.id, name="Основной", balance=0.0, is_primary=True, is_transfer_default=True)
    db.add(account)
    db.commit()
    
    token = create_token(user.id)
    return {"access_token": token, "user_id": user.id, "username": user.username}

@router.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not pwd_context.verify(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    
    token = create_token(user.id)
    return {"access_token": token, "user_id": user.id, "username": user.username}

@router.post("/refresh")
def refresh(user: User = Depends(get_current_user)):
    token = create_token(user.id)
    return {"access_token": token}

@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "username": user.username, "language": user.language}

@router.post("/verify-pin")
def verify_pin(data: dict, user: User = Depends(get_current_user)):
    pin = data.get("pin_code", "")
    if user.pin_code != pin:
        raise HTTPException(status_code=400, detail="Неверный PIN-код")
    return {"status": "ok"}
