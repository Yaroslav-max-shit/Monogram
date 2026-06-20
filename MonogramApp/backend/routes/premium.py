from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import User
from .auth import get_current_user

router = APIRouter(prefix="/premium", tags=["premium"])

class SubscribeRequest(BaseModel):
    plan: str
    promo_code: str = ""

@router.get("/check/{user_id}")
def check_premium(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.premium_until:
        is_premium = user.premium_until > datetime.utcnow()
        return {"is_premium": is_premium}
    return {"is_premium": False}

@router.post("/invisible")
def toggle_invisible(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.premium_until or current_user.premium_until < datetime.utcnow():
        raise HTTPException(402, "Premium required")
    current_user.is_invisible = not current_user.is_invisible
    db.commit()
    return {"is_invisible": current_user.is_invisible}

@router.post("/subscribe")
async def subscribe_to_premium(
    data: SubscribeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prices = {"month": 4900, "year": 49900}
    amount = prices.get(data.plan, 4900)
    import httpx, uuid, os
    shop_id = os.getenv("YOOKASSA_SHOP_ID", "")
    secret_key = os.getenv("YOOKASSA_SECRET_KEY", "")
    return_url = os.getenv("FRONTEND_URL", "http://localhost:5173") + "/payment/success"
    idempotence_key = str(uuid.uuid4())
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.yookassa.ru/v3/payments",
            json={
                "amount": {"value": amount / 100, "currency": "RUB"},
                "payment_method_data": {"type": "bank_card"},
                "confirmation": {"type": "redirect", "return_url": return_url},
                "description": f"Premium {data.plan} for {current_user.username}",
                "metadata": {"user_id": current_user.id, "plan": data.plan}
            },
            auth=(shop_id, secret_key),
            headers={"Idempotence-Key": idempotence_key}
        )
        if response.status_code != 200:
            raise HTTPException(400, "Payment creation failed")
        data_resp = response.json()
        return {"status": "ok", "payment_url": data_resp["confirmation"]["confirmation_url"]}
