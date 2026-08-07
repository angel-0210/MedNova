import uuid
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, Request
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import, missing-module-attribute]
from supabase import create_client, Client
from app.core.config import settings
from app.core.logging import logger
from app.core.security import get_current_user
from app.core.exceptions import MedNovaException, UnauthorizedException, InvalidCredentialsException, ConflictException, EntityNotFoundException, PermissionDeniedException
from app.database.session import get_db
from app.database.models import User, Hospital
from app.database.repositories.entities import UserRepository, HospitalRepository
from app.schemas.auth import Token, LoginRequest, RegisterRequest
from app.schemas.entities import UserResponse
from app.services.audit_service import AuditService

router = APIRouter()

# Initialize Supabase client
supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Registers a new user inside Supabase Auth, links them to a Hospital by code,
    and inserts the synced user profile into the public.users database table.
    """
    user_repo = UserRepository(db)
    hospital_repo = HospitalRepository(db)

    # 1. Resolve Hospital from Code
    hospital = await hospital_repo.get_by_code(payload.hospital_code)
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hospital with code '{payload.hospital_code}' does not exist."
        )

    # 2. Check if user email already exists locally
    existing_user = await user_repo.get_by_email(payload.email)
    if existing_user:
        raise ConflictException("Email is already registered", "EMAIL_EXISTS")

    try:
        # 3. Create user in Supabase Auth
        # In Supabase Auth, we pass user_metadata so that roles/hospital_id are encoded inside JWT
        auth_response = supabase_client.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {
                    "role": payload.role,
                    "hospital_id": str(hospital.hospital_id),
                    "name": payload.name
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to register user in Auth provider"
            )

        auth_user_id = uuid.UUID(auth_response.user.id)

        # 4. Insert User Profile into our database
        new_user = User(
            user_id=auth_user_id,
            hospital_id=hospital.hospital_id,
            name=payload.name,
            email=payload.email,
            password_hash=None,  # Handled by Supabase Auth
            role=payload.role,
            is_active=True
        )
        
        created_user = await user_repo.create(new_user)
        await db.flush()

        # 5. Log registration in audit log
        audit_service = AuditService(db)
        client_ip = request.client.host if request.client else "unknown"
        await audit_service.log_action(
            hospital_id=hospital.hospital_id,
            user_id=created_user.user_id,
            action="REGISTER_USER",
            entity_name="users",
            entity_id=str(created_user.user_id),
            ip_address=client_ip
        )

        return created_user

    except Exception as e:
        logger.exception("User registration failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticates email & password via Supabase Auth and returns JWT tokens.
    """
    try:
        # 1. Authenticate with Supabase
        auth_response = supabase_client.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
        
        if not auth_response.session:
            raise InvalidCredentialsException()

        # 2. Lookup user locally to verify active state
        user_repo = UserRepository(db)
        user_uuid = uuid.UUID(auth_response.user.id)
        user = await user_repo.get_by_id(user_uuid)
        
        if not user:
            raise UnauthorizedException("User profile not found in public database", "USER_PROFILE_NOT_FOUND")
            
        if not user.is_active:
            raise PermissionDeniedException("User account is inactive", "USER_INACTIVE")

        # 3. Log login
        audit_service = AuditService(db)
        client_ip = request.client.host if request.client else "unknown"
        await audit_service.log_action(
            hospital_id=user.hospital_id,
            user_id=user.user_id,
            action="LOGIN_USER",
            entity_name="users",
            entity_id=str(user.user_id),
            ip_address=client_ip
        )

        return Token(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            user=UserResponse.model_validate(user)
        )

    except MedNovaException:
        raise
    except Exception as e:
        logger.warn("Login attempt failed", email=payload.email, error=str(e))
        raise InvalidCredentialsException("Invalid email or password")


@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logs out the current user session.
    """
    try:
        supabase_client.auth.sign_out()
        
        audit_service = AuditService(db)
        client_ip = request.client.host if request.client else "unknown"
        await audit_service.log_action(
            hospital_id=current_user.hospital_id,
            user_id=current_user.user_id,
            action="LOGOUT_USER",
            entity_name="users",
            entity_id=str(current_user.user_id),
            ip_address=client_ip
        )
        
        return {"success": True, "message": "Successfully logged out"}
    except Exception as e:
        logger.warn("Logout failed", user_id=str(current_user.user_id), error=str(e))
        return {"success": False, "message": f"Logout failed: {str(e)}"}


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Refreshes the authenticated session using a refresh token.
    """
    try:
        auth_response = supabase_client.auth.refresh_session(refresh_token)
        if not auth_response.session:
            raise UnauthorizedException("Invalid refresh token", "INVALID_REFRESH_TOKEN")
            
        return Token(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token
        )
    except Exception as e:
        logger.warn("Token refresh failed", error=str(e))
        raise UnauthorizedException("Failed to refresh session", "REFRESH_FAILED")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the current authenticated user's profile information.
    """
    return current_user


@router.post("/reset-password")
async def reset_password(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiates password reset via Supabase Auth.
    """
    try:
        supabase_client.auth.reset_password_for_email(email)
        return {"success": True, "message": "Password reset email sent successfully."}
    except Exception as e:
        logger.error("Password reset request failed", email=email, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to initiate password reset: {str(e)}"
        )
