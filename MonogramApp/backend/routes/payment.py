from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import httpx
import os
import secrets
from database import get_db
from models import User
from .auth import get_current_user

router = APIRouter(prefix="/payment", tags=["payment"])

_payment_tokens: dict[str, dict] = {}

@router.post("/create")
async def create_payment(
    plan: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prices = {"month": 4900, "year": 49900}
    amount = prices.get(plan, 4900)
    
    shop_id = os.getenv("YOOKASSA_SHOP_ID", "")
    secret_key = os.getenv("YOOKASSA_SECRET_KEY", "")
    return_url = os.getenv("FRONTEND_URL", "http://localhost:5173") + "/payment/success"
    
    idempotence_key = str(uuid.uuid4())
    notification_token = secrets.token_urlsafe(32)
    _payment_tokens[notification_token] = {"user_id": current_user.id, "plan": plan}
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.yookassa.ru/v3/payments",
            json={
                "amount": {"value": amount / 100, "currency": "RUB"},
                "payment_method_data": {"type": "bank_card"},
                "confirmation": {
                    "type": "redirect",
                    "return_url": return_url
                },
                "description": f"Premium {plan} для {current_user.username}",
                "metadata": {
                    "user_id": current_user.id,
                    "plan": plan,
                    "notification_token": notification_token
                }
            },
            auth=(shop_id, secret_key),
            headers={"Idempotence-Key": idempotence_key}
        )
        
        if response.status_code != 200:
            raise HTTPException(400, "Ошибка создания платежа")
        
        data = response.json()
        return {"payment_url": data["confirmation"]["confirmation_url"]}

@router.post("/webhook")
async def payment_webhook(request: Request):
    body = await request.json()
    
    if body.get("event") == "payment.succeeded":
        payment = body.get("object", {})
        metadata = payment.get("metadata", {})
        
        notification_token = metadata.get("notification_token", "")
        stored = _payment_tokens.pop(notification_token, None)
        if not stored:
            return {"status": "ignored"}
        
        user_id = stored["user_id"]
        plan = stored["plan"]
        
        duration = 30 if plan == "month" else 365
        expires_at = datetime.utcnow() + timedelta(days=duration)
        
        db_payment = next(get_db())
        try:
            user = db_payment.query(User).filter(User.id == user_id).first()
            if user:
                user.premium_until = expires_at
                db_payment.commit()
        finally:
            db_payment.close()
        
        return {"status": "ok"}
    
    return {"status": "ignored"}

@router.post("/quarkpay-webhook")
async def quarkpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook от QuarkPay — подтверждение оплаты Premium"""
    body = await request.json()
    
    user_id = body.get("user_id")
    plan = body.get("plan")
    amount = body.get("amount")
    transaction_id = body.get("transaction_id")
    
    if not user_id or not plan:
        return {"status": "ignored"}
    
    duration = 30 if plan == "month" else 365
    expires_at = datetime.utcnow() + timedelta(days=duration)
    
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.premium_until = expires_at
        db.commit()
    
    return {"status": "ok", "user_id": user_id, "plan": plan}
