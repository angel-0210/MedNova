# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr
from typing import Literal, Optional
import uuid

# Roles a user may pick for themselves. "admin" is deliberately absent -- self-service
# registration must not be able to mint an admin; admins are provisioned out of band.
SelfServiceRole = Literal["doctor", "nurse", "attendant"]

from app.schemas.entities import UserResponse

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    # Clients store the profile straight off the login response instead of a second /me call.
    user: Optional[UserResponse] = None

class TokenPayload(BaseModel):
    sub: str  # User ID
    email: Optional[str] = None
    role: Optional[str] = None
    hospital_id: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: SelfServiceRole
    hospital_code: str

class RefreshRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr
