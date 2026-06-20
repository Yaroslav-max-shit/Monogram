from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Account, Transaction
from middleware.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats")
def get_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_accounts = db.query(Account).count()
    total_transactions = db.query(Transaction).count()
    total_volume = db.query(Transaction).filter(Transaction.status == "completed").with_entities(Transaction.amount).all()
    volume = sum(t[0] for t in total_volume) if total_volume else 0
    return {"total_users": total_users, "total_accounts": total_accounts, "total_transactions": total_transactions, "total_volume": volume}

@router.get("/users")
def list_users(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "username": u.username, "created_at": u.created_at.isoformat()} for u in users]

@router.get("/transactions")
def list_transactions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txs = db.query(Transaction).order_by(Transaction.created_at.desc()).limit(100).all()
    return [{"id": t.id, "amount": t.amount, "type": t.transaction_type, "status": t.status, "created_at": t.created_at.isoformat()} for t in txs]
