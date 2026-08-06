# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from fastapi.exceptions import RequestValidationError
from app.core.logging import logger

class MedNovaException(Exception):
    def __init__(self, message: str, error_code: str, status_code: int = 400):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        super().__init__(message)

class EntityNotFoundException(MedNovaException):
    def __init__(self, message: str = "Resource not found", error_code: str = "RESOURCE_NOT_FOUND"):
        super().__init__(message, error_code, status_code=404)

class UnauthorizedException(MedNovaException):
    def __init__(self, message: str = "Unauthorized access", error_code: str = "UNAUTHORIZED"):
        super().__init__(message, error_code, status_code=401)

class InvalidCredentialsException(MedNovaException):
    def __init__(self, message: str = "Invalid credentials", error_code: str = "INVALID_CREDENTIALS"):
        super().__init__(message, error_code, status_code=401)

class PermissionDeniedException(MedNovaException):
    def __init__(self, message: str = "Permission denied", error_code: str = "PERMISSION_DENIED"):
        super().__init__(message, error_code, status_code=403)

class ConflictException(MedNovaException):
    def __init__(self, message: str = "Resource conflict", error_code: str = "RESOURCE_CONFLICT"):
        super().__init__(message, error_code, status_code=409)

class ValidationException(MedNovaException):
    def __init__(self, message: str = "Validation failed", error_code: str = "VALIDATION_FAILED"):
        super().__init__(message, error_code, status_code=422)

# Global Exception Handlers for FastAPI
def setup_exception_handlers(app: FastAPI):
    @app.exception_handler(MedNovaException)
    async def mednova_exception_handler(request: Request, exc: MedNovaException):
        logger.warn("MedNova domain exception occurred", path=request.url.path, error_code=exc.error_code, message=exc.message)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.message,
                "error_code": exc.error_code
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Format validation error messages nicely
        errors = exc.errors()
        messages = []
        for err in errors:
            loc = " -> ".join([str(x) for x in err.get("loc", [])])
            msg = err.get("msg", "invalid value")
            messages.append(f"{loc}: {msg}")
        
        detail_msg = "; ".join(messages)
        logger.warn("Request validation failed", path=request.url.path, detail=detail_msg)
        
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "message": f"Validation failed: {detail_msg}",
                "error_code": "VALIDATION_FAILED"
            }
        )

    @app.exception_handler(Exception)
    async def global_generic_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandle exception occurred", path=request.url.path, error=str(exc))
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "An unexpected error occurred on the server.",
                "error_code": "INTERNAL_SERVER_ERROR"
            }
        )
