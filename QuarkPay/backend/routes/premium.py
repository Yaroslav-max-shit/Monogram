from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Account, Transaction, Notification
from schemas import PremiumPay
from middleware.auth import get_current_user

router = APIRouter(prefix="/premium", tags=["premium"])

PREMIUM_PRICES = {"monthly": 49, "yearly": 499}

@router.post("/pay")
def pay_premium(data: PremiumPay, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.plan not in PREMIUM_PRICES:
        raise HTTPException(status_code=400, detail="Неверный план")
    
    amount = PREMIUM_PRICES[data.plan]
    account = db.query(Account).filter(Account.id == data.account_id, Account.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Счёт не найден")
    if account.balance < amount:
        raise HTTPException(status_code=400, detail="Недостаточно средств")
    
    account.balance -= amount
    tx = Transaction(from_account_id=account.id, amount=amount, description=f"Premium {data.plan}", transaction_type="payment", status="completed")
    db.add(tx)
    
    notif = Notification(user_id=user.id, type="premium_purchased", message=f"Premium {data.plan} оформлен!")
    db.add(notif)
    
    db.commit()
    return {"status": "ok", "plan": data.plan, "amount": amount}

@router.get("/status")
def premium_status(user: User = Depends(get_current_user)):
    return {"is_premium": False, "plan": None}
