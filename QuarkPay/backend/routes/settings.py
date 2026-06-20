from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Account
from middleware.auth import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/")
def get_settings(user: User = Depends(get_current_user)):
    return {"pin_code": "***", "language": user.language}

@router.put("/")
def update_settings(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.get("pin_code"):
        current_pin = data.get("current_pin", "")
        if user.pin_code != current_pin:
            raise HTTPException(status_code=400, detail="Неверный текущий PIN")
        new_pin = data["pin_code"]
        if len(new_pin) != 6 or not new_pin.isdigit():
            raise HTTPException(status_code=400, detail="PIN должен быть 6 цифр")
        user.pin_code = new_pin
    
    if data.get("language"):
        user.language = data["language"]
    
    db.commit()
    return {"status": "ok"}
