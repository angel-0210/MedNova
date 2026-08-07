import os
from pathlib import Path
from typing import List, Union
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Load .env file
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings(BaseModel):
    # App Settings
    PROJECT_NAME: str = "MedNova Backend"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # Supabase Settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_PUBLISHABLE_KEY: str = os.getenv("SUPABASE_ANON_KEY", "") or os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    SUPABASE_SECRET_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("SUPABASE_SECRET_KEY", "")
    SUPABASE_JWKS_URL: str = os.getenv("SUPABASE_JWKS_URL", "")
    DATABASE_URL: str = os.getenv("SUPABASE_CONNECTION_URL", "")

    # JWT Settings
    JWT_ALGORITHM: str = "RS256"  # Supabase uses RS256 for signing tokens
    JWT_AUDIENCE: str = "authenticated"

    # Firebase Notification Settings
    FCM_PROJECT_ID: str = os.getenv("FCM_PROJECT_ID", "mednova-fcm")
    FCM_CREDENTIALS_PATH: str = os.getenv("FCM_CREDENTIALS_PATH", "")

    # Security Settings
    BACKEND_CORS_ORIGINS: List[str] = [
        origin.strip() for origin in os.getenv("BACKEND_CORS_ORIGINS", "*").split(",") if origin.strip()
    ]

    # AI Model Settings
    AI_MODEL_PATH: str = os.getenv("AI_MODEL_PATH", "app/ai/models/ventilator_risk_v1.tflite")
    AI_MODEL_VERSION: str = "ventilator_risk_v1.0"

    class Config:
        arbitrary_types_allowed = True

settings = Settings()
