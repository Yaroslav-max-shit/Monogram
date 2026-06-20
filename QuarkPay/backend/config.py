from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    SECRET_KEY: str = "quarkpay-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    DATABASE_URL: str = "sqlite:///./quarkpay.db"
    
    MONOGRAM_API_URL: str = "http://localhost:8000"
    MONOGRAM_SECRET_KEY: str = ""
    
    CORS_ORIGINS_STR: str = "http://localhost:5174,http://localhost:5173"
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS_STR.split(",")]
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
