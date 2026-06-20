from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Account
from schemas import AccountCreate
from middleware.auth import get_current_user

router = APIRouter(prefix="/accounts", tags=["accounts"])

@router.get("/")
def list_accounts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    return [{"id": a.id, "name": a.name, "balance": a.balance, "currency": a.currency,
             "account_type": a.account_type, "is_primary": a.is_primary,
             "is_transfer_default": a.is_transfer_default, "is_blocked": a.is_blocked} for a in accounts]

@router.post("/")
def create_account(data: AccountCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Account).filter(Account.user_id == user.id).count()
    if count >= 10:
        raise HTTPException(status_code=400, detail="Максимум 10 счетов")
    account = Account(user_id=user.id, name=data.name, account_type=data.account_type)
    db.add(account)
    db.commit()
    db.refresh(account)
    return {"id": account.id, "name": account.name, "balance": account.balance}

@router.delete("/{account_id}")
def delete_account(account_id: int, data: dict = {}, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pin_code = data.get("pin_code", "")
    if user.pin_code != pin_code:
        raise HTTPException(status_code=400, detail="Неверный PIN-код")
    
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Счёт не найден")
    if account.is_primary:
        raise HTTPException(status_code=400, detail="Нельзя удалить основной счёт")
    
    transfer_to = data.get("transfer_to")
    if transfer_to:
        target = db.query(Account).filter(Account.id == int(transfer_to), Account.user_id == user.id).first()
        if target:
            target.balance += account.balance
            if account.is_transfer_default:
                target.is_transfer_default = True
    
    db.delete(account)
    db.commit()
    return {"status": "deleted"}

@router.put("/{account_id}/primary")
def set_primary(account_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Account).filter(Account.user_id == user.id).update({"is_primary": False})
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Счёт не найден")
    account.is_primary = True
    db.commit()
    return {"status": "ok"}

@router.put("/{account_id}/transfer-default")
def set_transfer_default(account_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Account).filter(Account.user_id == user.id).update({"is_transfer_default": False})
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Счёт не найден")
    account.is_transfer_default = True
    db.commit()
    return {"status": "ok"}
