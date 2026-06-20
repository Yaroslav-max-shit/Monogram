from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models import User, Account, Transaction, Notification, Card, Template, AutoPayment, Session as UserSession, Connection
from config import settings
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
import secrets
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

app = FastAPI(title="QuarkPay", version="1.0.0")

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def create_token(user_id: int):
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Не авторизован")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub") or 0)
    except JWTError:
        raise HTTPException(status_code=401, detail="Токен истёк")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    return user

# ============================================
# AUTH
# ============================================
@app.post("/auth/register")
def register(data: dict, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.get("email")).first():
        raise HTTPException(status_code=400, detail="Email уже используется")
    if db.query(User).filter(User.username == data.get("username")).first():
        raise HTTPException(status_code=400, detail="Username уже занят")
    pin = data.get("pin_code", "")
    if len(pin) != 6 or not pin.isdigit():
        raise HTTPException(status_code=400, detail="PIN должен быть 6 цифр")
    user = User(email=data["email"], username=data["username"], password_hash=pwd_context.hash(data["password"]), pin_code=pin)
    db.add(user)
    db.commit()
    db.refresh(user)
    account = Account(user_id=user.id, name="Основной", balance=0.0, is_primary=True, is_transfer_default=True)
    db.add(account)
    db.commit()
    token = create_token(user.id)
    return {"access_token": token, "user_id": user.id, "username": user.username}

@app.post("/auth/login")
def login(data: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.get("username")).first()
    if not user or not pwd_context.verify(data.get("password", ""), user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    token = create_token(user.id)
    return {"access_token": token, "user_id": user.id, "username": user.username}

@app.post("/auth/refresh")
def refresh(user: User = Depends(get_current_user)):
    return {"access_token": create_token(user.id)}

@app.get("/auth/me")
def get_me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "username": user.username, "language": user.language}

@app.post("/auth/verify-pin")
def verify_pin(data: dict, user: User = Depends(get_current_user)):
    if user.pin_code != data.get("pin_code", ""):
        raise HTTPException(status_code=400, detail="Неверный PIN-код")
    return {"status": "ok"}

# ============================================
# ACCOUNTS
# ============================================
@app.get("/accounts/")
def list_accounts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    return [{"id": a.id, "name": a.name, "balance": a.balance, "currency": a.currency, "account_type": a.account_type, "is_primary": a.is_primary, "is_transfer_default": a.is_transfer_default, "is_blocked": a.is_blocked} for a in accounts]

@app.post("/accounts/")
def create_account(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Account).filter(Account.user_id == user.id).count()
    if count >= 10:
        raise HTTPException(status_code=400, detail="Максимум 10 счетов")
    account = Account(user_id=user.id, name=data.get("name", "Счёт"), account_type=data.get("account_type", "main"))
    db.add(account)
    db.commit()
    db.refresh(account)
    return {"id": account.id, "name": account.name, "balance": account.balance}

@app.delete("/accounts/{account_id}")
def delete_account(account_id: int, data: dict = {}, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.pin_code != data.get("pin_code", ""):
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

@app.put("/accounts/{account_id}/primary")
def set_primary(account_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Account).filter(Account.user_id == user.id).update({"is_primary": False})
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Счёт не найден")
    account.is_primary = True
    db.commit()
    return {"status": "ok"}

@app.put("/accounts/{account_id}/transfer-default")
def set_transfer_default(account_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Account).filter(Account.user_id == user.id).update({"is_transfer_default": False})
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Счёт не найден")
    account.is_transfer_default = True
    db.commit()
    return {"status": "ok"}

# ============================================
# TRANSFERS
# ============================================
@app.post("/transfer/")
def create_transfer(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.pin_code != data.get("pin_code", ""):
        raise HTTPException(status_code=400, detail="Неверный PIN")
    from_account = db.query(Account).filter(Account.id == data.get("from_account_id"), Account.user_id == user.id).first()
    if not from_account:
        raise HTTPException(status_code=404, detail="Счёт отправителя не найден")
    if from_account.is_blocked:
        raise HTTPException(status_code=400, detail="Счёт заблокирован")
    if from_account.balance < data.get("amount", 0):
        raise HTTPException(status_code=400, detail="Недостаточно средств")
    to_user = db.query(User).filter(User.username == data.get("to_username")).first()
    if not to_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    to_account = db.query(Account).filter(Account.user_id == to_user.id, Account.is_primary == True).first()
    if not to_account:
        raise HTTPException(status_code=400, detail="Счёт получателя не найден")
    from_account.balance -= data["amount"]
    to_account.balance += data["amount"]
    tx = Transaction(from_account_id=from_account.id, to_account_id=to_account.id, amount=data["amount"], description=data.get("description", ""), transaction_type="transfer", status="completed", category=data.get("category", ""))
    db.add(tx)
    db.add(Notification(user_id=to_user.id, type="transfer_incoming", message=f"Получен перевод {data['amount']}₽ от {user.username}"))
    db.add(Notification(user_id=user.id, type="transfer_outgoing", message=f"Перевод {data['amount']}₽ пользователю {to_user.username}"))
    db.commit()
    return {"status": "completed", "transaction_id": tx.id, "amount": data["amount"], "to_username": to_user.username}

@app.get("/transfer/history")
def transfer_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account_ids = [a.id for a in db.query(Account).filter(Account.user_id == user.id).all()]
    txs = db.query(Transaction).filter((Transaction.from_account_id.in_(account_ids)) | (Transaction.to_account_id.in_(account_ids))).order_by(Transaction.created_at.desc()).limit(100).all()
    return [{"id": t.id, "from_account_id": t.from_account_id, "to_account_id": t.to_account_id, "amount": t.amount, "description": t.description, "transaction_type": t.transaction_type, "status": t.status, "category": t.category, "created_at": t.created_at.isoformat()} for t in txs]

# ============================================
# SETTINGS
# ============================================
@app.get("/settings/")
def get_settings(user: User = Depends(get_current_user)):
    return {"language": user.language}

@app.put("/settings/")
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

# ============================================
# CONNECT
# ============================================
@app.post("/connect/generate")
def generate_code(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    code = secrets.token_urlsafe(16)
    conn = Connection(user_id=user.id, connect_code=code, status="pending")
    db.add(conn)
    db.commit()
    return {"connect_code": code}

@app.post("/connect/confirm")
def confirm_connection(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.query(Connection).filter(Connection.connect_code == data.get("connect_code"), Connection.status == "pending").first()
    if not conn:
        raise HTTPException(status_code=404, detail="Код не найден")
    conn.monogram_user_id = data.get("monogram_user_id")
    conn.status = "active"
    db.commit()
    return {"status": "connected"}

@app.get("/connect/status")
def get_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conn = db.query(Connection).filter(Connection.user_id == user.id, Connection.status == "active").first()
    return {"connected": bool(conn), "monogram_user_id": conn.monogram_user_id if conn else None}

@app.delete("/connect/")
def disconnect(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Connection).filter(Connection.user_id == user.id).update({"status": "revoked"})
    db.commit()
    return {"status": "disconnected"}

# ============================================
# NOTIFICATIONS
# ============================================
@app.get("/notifications/")
def list_notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(50).all()
    return [{"id": n.id, "type": n.type, "message": n.message, "is_read": n.is_read, "created_at": n.created_at.isoformat()} for n in notifs]

@app.put("/notifications/{notif_id}/read")
def mark_read(notif_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == user.id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}

@app.put("/notifications/read-all")
def mark_all_read(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "ok"}

# ============================================
# ADMIN
# ============================================
@app.get("/admin/stats")
def get_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"total_users": db.query(User).count(), "total_accounts": db.query(Account).count(), "total_transactions": db.query(Transaction).count()}

@app.get("/admin/users")
def list_users(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "username": u.username, "created_at": u.created_at.isoformat()} for u in users]

# ============================================
# WEBHOOK & PAYMENT
# ============================================
@app.post("/payment/confirm")
def confirm_payment(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Подтверждение оплаты — отправляет webhook в Monogram"""
    import httpx
    plan = data.get("plan")
    amount = data.get("amount")
    if plan not in ["month", "year"]:
        raise HTTPException(status_code=400, detail="Неверный план")
    
    account_id = data.get("account_id")
    if not account_id:
        raise HTTPException(status_code=400, detail="Выберите счёт")
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Счёт не найден")
    if account.balance < amount:
        raise HTTPException(status_code=400, detail="Недостаточно средств")
    
    account.balance -= amount
    tx = Transaction(from_account_id=account.id, amount=amount, description=f"Premium {plan}", transaction_type="payment", status="completed")
    db.add(tx)
    db.commit()
    
    # Webhook в Monogram
    try:
        with httpx.Client(timeout=5) as client:
            webhook_data = {
                "user_id": user.id,
                "username": user.username,
                "plan": plan,
                "amount": amount,
                "transaction_id": tx.id
            }
            client.post("http://localhost:8000/payment/quarkpay-webhook", json=webhook_data)
    except Exception:
        pass
    
    return {"status": "ok", "plan": plan, "amount": amount}

@app.post("/payment/test-premium")
def test_premium(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Тестовая оплата — без реальных денег"""
    plan = data.get("plan")
    if plan not in ["month", "year"]:
        raise HTTPException(status_code=400, detail="Неверный план")
    
    tx = Transaction(amount=0, description=f"Test Premium {plan}", transaction_type="payment", status="completed")
    db.add(tx)
    db.commit()
    
    # Webhook в Monogram
    import httpx
    try:
        with httpx.Client(timeout=5) as client:
            webhook_data = {
                "user_id": user.id,
                "username": user.username,
                "plan": plan,
                "amount": 0,
                "transaction_id": tx.id
            }
            client.post("http://localhost:8000/payment/quarkpay-webhook", json=webhook_data)
    except Exception:
        pass
    
    return {"status": "ok", "plan": plan}

@app.get("/payment/yoomoney-form")
def get_yoomoney_form(plan: str):
    """Генерация формы оплаты ЮMoney (Fundraising API)"""
    receiver = os.getenv("YOOMONEY_WALLET", "")
    if not receiver:
        raise HTTPException(status_code=500, detail="YooMoney кошелёк не настроен")
    
    prices = {"month": 49, "year": 499}
    amount = prices.get(plan, 49)
    
    label = f"premium_{plan}_{secrets.token_urlsafe(8)}"
    
    return {
        "receiver": receiver,
        "quickpay-form": "button",
        "sum": amount,
        "label": label,
        "successURL": f"https://f1w6ggb2-5174.euw.devtunnels.ms/pay-success?plan={plan}",
        "form_url": f"https://yoomoney.ru/quickpay/confirm?receiver={receiver}&quickpay-form=button&sum={amount}&label={label}&successURL=https://f1w6ggb2-5174.euw.devtunnels.ms/pay-success?plan={plan}"
    }

@app.post("/payment/yoomoney-webhook")
async def yoomoney_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook от ЮMoney — подтверждение оплаты"""
    form_data = await request.form()
    notification_type = form_data.get("notification_type")
    operation_id = form_data.get("operation_id")
    amount = form_data.get("amount")
    label = form_data.get("label", "")
    
    # Обработка оплаты
    if label.startswith("premium_"):
        plan = label.split("_")[1]
        duration = 30 if plan == "month" else 365
        expires_at = datetime.utcnow() + timedelta(days=duration)
        
        logger.info(f"ЮMoney оплата: {amount}₽, label={label}")
    
    return {"status": "ok"}

# ============================================
# HEALTH
# ============================================
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "QuarkPay"}

@app.get("/")
def root():
    return {"message": "QuarkPay API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
