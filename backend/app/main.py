import asyncio
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.exceptions import setup_exception_handlers
from app.api.v1.router import api_router
from app.websocket.router import router as ws_router
from app.middleware.custom import PerformanceMiddleware, LoggingMiddleware

# 1. Initialize logging
setup_logging()

# 2. Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise-grade AI-powered ventilator monitoring platform backend",
    version="1.0.0",
    debug=settings.DEBUG
)

# 3. Add Custom Middlewares
app.add_middleware(LoggingMiddleware)
app.add_middleware(PerformanceMiddleware)

# 4. Set CORS Middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# 5. Set Exception Handlers
setup_exception_handlers(app)

# 6. Mount routers
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(ws_router)

@app.get("/health", tags=["System"])
async def health_check():
    """
    Health check endpoint for container orchestration and uptime monitoring.
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up MedNova backend server...")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down MedNova backend server...")
