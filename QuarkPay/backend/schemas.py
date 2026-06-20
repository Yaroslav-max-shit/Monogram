from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    pin_code: str

class UserLogin(BaseModel):
    username: str
    password: str

class AccountCreate(BaseModel):
    name: str
    account_type: str = "main"

class TransferCreate(BaseModel):
    from_account_id: int
    to_username: Optional[str] = None
    to_account_id: Optional[int] = None
    amount: float
    description: str = ""
    pin_code: str

class SettingsUpdate(BaseModel):
    pin_code: Optional[str] = None
    language: Optional[str] = None

class ConnectConfirm(BaseModel):
    connect_code: str
    monogram_user_id: int

class PremiumPay(BaseModel):
    account_id: int
    plan: str

class NotificationResponse(BaseModel):
    id: int
    type: str
    message: str
    is_read: bool
    created_at: datetime

class AccountResponse(BaseModel):
    id: int
    name: str
    balance: float
    currency: str
    account_type: str
    is_primary: bool
    is_transfer_default: bool
    is_blocked: bool

class TransactionResponse(BaseModel):
    id: int
    from_account_id: Optional[int]
    to_account_id: Optional[int]
    amount: float
    description: str
    transaction_type: str
    status: str
    created_at: datetime
