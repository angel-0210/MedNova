# pyrefly: ignore [missing-import]
import httpx
import uuid
from typing import List, Optional, Dict, Any
# pyrefly: ignore [missing-import]
from fastapi import Depends, Header, HTTPException, status
# pyrefly: ignore [missing-import]
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# pyrefly: ignore [missing-import, missing-source-for-stubs]
from jose import jwt
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import UnauthorizedException, PermissionDeniedException
from app.database.session import get_db
from app.database.models import User
from app.database.repositories.entities import UserRepository
from app.schemas.auth import TokenPayload

# OAuth2 bearer token scheme
security_scheme = HTTPBearer(auto_error=False)

class JWKSCache:
    """
    In-memory cache for Supabase JSON Web Key Set (JWKS).
    Refreshes keys if the key ID (kid) is not found in the cache.
    """
    def __init__(self):
        self.jwks_url = settings.SUPABASE_JWKS_URL
        self.keys: List[Dict[str, Any]] = []
        self._last_fetched: Optional[float] = None

    async def get_keys(self) -> List[Dict[str, Any]]:
        if not self.keys:
            await self.refresh_keys()
        return self.keys

    async def refresh_keys(self):
        try:
            logger.info("Fetching Supabase JWKS keys...", url=self.jwks_url)
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.jwks_url)
                if response.status_code == 200:
                    data = response.json()
                    self.keys = data.get("keys", [])
                    logger.info("Successfully fetched JWKS keys", key_count=len(self.keys))
                else:
                    logger.error("Failed to fetch JWKS", status_code=response.status_code)
        except Exception as e:
            logger.exception("Exception occurred while fetching JWKS", error=str(e))

    async def get_key_by_kid(self, kid: str) -> Optional[Dict[str, Any]]:
        keys = await self.get_keys()
        for key in keys:
            if key.get("kid") == kid:
                return key
        # Try refreshing once if kid is not found
        await self.refresh_keys()
        for key in self.keys:
            if key.get("kid") == kid:
                return key
        return None

jwks_cache = JWKSCache()

async def verify_supabase_jwt(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> TokenPayload:
    """
    Verifies the JWT signature, audience, and expiry locally using RS256 with the Supabase JWKS.
    """
    if not credentials:
        raise UnauthorizedException("Missing Authorization credentials", "MISSING_CREDENTIALS")
    
    token = credentials.credentials
    try:
        # Get token header to extract the kid (Key ID)
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise UnauthorizedException("Invalid token header: missing key ID", "INVALID_TOKEN_HEADER")
        
        # Resolve public key
        key = await jwks_cache.get_key_by_kid(kid)
        if not key:
            raise UnauthorizedException("Invalid token signature: Key ID not recognized", "INVALID_TOKEN_KEY")
        
        # Trust the algorithm the JWKS key declares rather than a hardcoded constant --
        # Supabase signs with ES256 on newer projects and RS256 on older ones, and a project
        # can rotate between them. Falling back to the token header would let a caller pick
        # the algorithm, so only the key's own "alg" (or the configured default) is accepted.
        algorithm = key.get("alg") or settings.JWT_ALGORITHM

        # Decode and verify the token signature
        payload = jwt.decode(
            token,
            key,
            algorithms=[algorithm],
            audience=settings.JWT_AUDIENCE,
            options={"verify_aud": True, "verify_signature": True}
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Invalid token payload: missing subject", "INVALID_TOKEN_SUBJECT")
            
        return TokenPayload(
            sub=user_id,
            email=payload.get("email"),
            role=payload.get("user_metadata", {}).get("role"),
            hospital_id=payload.get("user_metadata", {}).get("hospital_id"),
            exp=payload.get("exp")
        )
    # pyrefly: ignore [missing-attribute]
    except jwt.ExpiredSignatureError:
        raise UnauthorizedException("Token has expired", "TOKEN_EXPIRED")
    # pyrefly: ignore [missing-attribute]
    except jwt.JWTError as e:
        logger.warn("JWT Verification failed", error=str(e))
        raise UnauthorizedException(f"Invalid authentication token: {str(e)}", "INVALID_TOKEN")


async def get_current_user(
    payload: TokenPayload = Depends(verify_supabase_jwt),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    FastAPI dependency that returns the current authenticated User model from the database.
    """
    user_repo = UserRepository(db)
    user_uuid = uuid.UUID(payload.sub)
    user = await user_repo.get_by_id(user_uuid)
    
    if not user:
        # If user is valid in Supabase Auth but doesn't exist in public.users yet,
        # we can create a temporary context/user or raise. Raising is standard to block unauthorized access.
        raise UnauthorizedException("User profile not found in public database", "USER_PROFILE_NOT_FOUND")
        
    if not user.is_active:
        raise PermissionDeniedException("User account is inactive", "USER_INACTIVE")
        
    return user


class RequireRole:
    """
    FastAPI dependency to restrict endpoint access to specific roles (RBAC).
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            logger.warn(
                "RBAC access denied", 
                user_id=str(current_user.user_id), 
                user_role=current_user.role, 
                required_roles=self.allowed_roles
            )
            raise PermissionDeniedException(
                f"Role '{current_user.role}' is not authorized to access this resource",
                "ROLE_NOT_AUTHORIZED"
            )
        return current_user
