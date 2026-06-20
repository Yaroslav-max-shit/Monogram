from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Connection
from schemas import ConnectConfirm
from middleware.auth import get_current_user
import secrets

router = APIRouter(prefix="/connect", tags=["connect"])

@router.post("/generate")
def generate_code(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    code = secrets.token_urlsafe(16)
    conn = Connection(user_id=user.id, connect_code=code, status="pending")
    db.add(conn)
    db.commit()
    return {"connect_code": code}

@router.post("/confirm")
def confirm_connection(data: ConnectConfirm, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.query(Connection).filter(Connection.connect_code == data.connect_code, Connection.status == "pending").first()
    if not conn:
        raise HTTPException(status_code=404, detail="Код не найден")
    conn.monogram_user_id = data.monogram_user_id
    conn.status = "active"
    db.commit()
    return {"status": "connected"}

@router.get("/status")
def get_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.query(Connection).filter(Connection.user_id == user.id, Connection.status == "active").first()
    return {"connected": bool(conn), "monogram_user_id": conn.monogram_user_id if conn else None}

@router.delete("/")
def disconnect(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Connection).filter(Connection.user_id == user.id).update({"status": "revoked"})
    db.commit()
    return {"status": "disconnected"}
