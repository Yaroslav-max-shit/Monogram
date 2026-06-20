from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Account, Transaction, Notification
from schemas import TransferCreate
from middleware.auth import get_current_user
from datetime import datetime
import secrets

router = APIRouter(prefix="/transfer", tags=["transfers"])

@router.post("/")
def create_transfer(data: TransferCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.pin_code != data.pin_code:
        raise HTTPException(status_code=400, detail="Неверный PIN")
    
    from_account = db.query(Account).filter(Account.id == data.from_account_id, Account.user_id == user.id).first()
    if not from_account:
        raise HTTPException(status_code=404, detail="Счёт отправителя не найден")
    if from_account.is_blocked:
        raise HTTPException(status_code=400, detail="Счёт заблокирован")
    if from_account.balance < data.amount:
        raise HTTPException(status_code=400, detail="Недостаточно средств")
    
    to_user = None
    to_account = None
    
    if data.to_username:
        to_user = db.query(User).filter(User.username == data.to_username).first()
        if not to_user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        to_account = db.query(Account).filter(Account.user_id == to_user.id, Account.is_primary == True).first()
    elif data.to_account_id:
        to_account = db.query(Account).filter(Account.id == data.to_account_id).first()
        if not to_account:
            raise HTTPException(status_code=404, detail="Счёт получателя не найден")
        to_user = db.query(User).filter(User.id == to_account.user_id).first()
    
    if not to_account:
        raise HTTPException(status_code=400, detail="Счёт получателя не найден")
    
    from_account.balance -= data.amount
    to_account.balance += data.amount
    
    tx = Transaction(
        from_account_id=from_account.id,
        to_account_id=to_account.id,
        amount=data.amount,
        description=data.description,
        transaction_type="transfer",
        status="completed"
    )
    db.add(tx)
    
    notif = Notification(
        user_id=to_user.id,
        type="transfer_incoming",
        message=f"Получен перевод {data.amount}₽ от {user.username}"
    )
    db.add(notif)
    
    notif_out = Notification(
        user_id=user.id,
        type="transfer_outgoing",
        message=f"Перевод {data.amount}₽ пользователю {to_user.username}"
    )
    db.add(notif_out)
    
    db.commit()
    
    link_code = secrets.token_urlsafe(8)
    
    return {
        "status": "completed",
        "transaction_id": tx.id,
        "amount": data.amount,
        "to_username": to_user.username,
        "link": f"/transfer/{link_code}"
    }

@router.get("/history")
def transfer_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account_ids = [a.id for a in db.query(Account).filter(Account.user_id == user.id).all()]
    txs = db.query(Transaction).filter(
        (Transaction.from_account_id.in_(account_ids)) | (Transaction.to_account_id.in_(account_ids))
    ).order_by(Transaction.created_at.desc()).limit(100).all()
    
    return [{"id": t.id, "from_account_id": t.from_account_id, "to_account_id": t.to_account_id,
             "amount": t.amount, "description": t.description, "transaction_type": t.transaction_type,
             "status": t.status, "created_at": t.created_at.isoformat()} for t in txs]

@router.get("/link/{code}")
def get_transfer_by_link(code: str, db: Session = Depends(get_db)):
    return {"code": code, "status": "active"}
