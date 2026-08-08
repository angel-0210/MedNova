import uuid
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, Request
# pyrefly: ignore [missing-import]
from fastapi.security import HTTPAuthorizationCredentials
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy.exc import SQLAlchemyError
# pyrefly: ignore [missing-import, missing-module-attribute]
from supabase import create_client, Client
from app.core.config import settings
from app.core.logging import logger
from app.core.security import get_current_user, security_scheme
from app.core.exceptions import MedNovaException, UnauthorizedException, InvalidCredentialsException, ConflictException, EntityNotFoundException, PermissionDeniedException
from app.database.session import get_db
from app.database.models import User, Hospital
from app.database.repositories.entities import UserRepository, HospitalRepository
from app.schemas.auth import Token, LoginRequest, RegisterRequest, RefreshRequest, PasswordResetRequest
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

    # 3. Create user in Supabase Auth
    # In Supabase Auth, we pass user_metadata so that roles/hospital_id are encoded inside JWT
    try:
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
    except Exception as e:
        logger.exception("Auth provider registration failed", email=payload.email, error=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration failed")

    if not auth_response.user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user in Auth provider"
        )

    auth_user_id = uuid.UUID(auth_response.user.id)

    try:
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
        # Without this the auth user survives with no public.users row, and every later
        # login succeeds at Supabase then dies on USER_PROFILE_NOT_FOUND.
        # ponytail: best-effort rollback; a crash between the two calls still orphans the
        # auth user -- add a reconcile job if that shows up in practice.
        logger.exception("User profile creation failed, rolling back auth user", error=str(e))
        try:
            supabase_client.auth.admin.delete_user(str(auth_user_id))
        except Exception as cleanup_error:
            logger.error("Failed to roll back auth user", user_id=str(auth_user_id), error=str(cleanup_error))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed"
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
    except SQLAlchemyError as e:
        # A database outage is not a credential problem. This handler used to swallow it
        # into "Invalid email or password", which sent two debugging sessions chasing
        # passwords while the real fault was an unreachable database.
        logger.exception("Login failed: database unreachable", email=payload.email, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable. Please try again shortly."
        )
    except Exception as e:
        # Supabase answers "Email not confirmed" when an account never clicked its
        # confirmation link. Collapsing that into "Invalid email or password" sent people
        # hunting for a password problem that did not exist -- it is the one auth failure
        # the user can actually act on, so it gets its own code.
        reason = str(e)
        logger.warn("Login attempt failed", email=payload.email, error=reason)
        if "email not confirmed" in reason.lower():
            raise UnauthorizedException(
                "Email address is not confirmed. Check your inbox for the confirmation link.",
                "EMAIL_NOT_CONFIRMED"
            )
        raise InvalidCredentialsException("Invalid email or password")


@router.post("/logout")
async def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Logs out the current user session.
    """
    try:
        # sign_out() on the shared server client has no session attached -- it revoked
        # nothing. Revoke the caller's own token so the refresh token dies with it.
        supabase_client.auth.admin.sign_out(credentials.credentials)


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
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refreshes the authenticated session using a refresh token.
    """
    try:
        auth_response = supabase_client.auth.refresh_session(payload.refresh_token)
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
    payload: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiates password reset via Supabase Auth.
    """
    try:
        supabase_client.auth.reset_password_for_email(payload.email)
    except Exception as e:
        # Never leak whether the address exists -- log it, answer the same either way.
        logger.error("Password reset request failed", email=payload.email, error=str(e))
    return {"success": True, "message": "If that email is registered, a reset link has been sent."}
