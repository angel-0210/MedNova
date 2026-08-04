import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import logger

class PerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = time.perf_counter() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate or extract request ID
        request_id = request.headers.get("X-Request-ID")
        
        # Log request start
        logger.info(
            "Request started",
            method=request.method,
            path=request.url.path,
            query_params=str(request.query_params),
            request_id=request_id
        )
        
        start_time = time.perf_counter()
        try:
            response = await call_next(request)
            duration = (time.perf_counter() - start_time) * 1000  # in ms
            
            # Log successful response
            logger.info(
                "Request completed",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=round(duration, 2),
                request_id=request_id
            )
            return response
        except Exception as e:
            duration = (time.perf_counter() - start_time) * 1000
            logger.exception(
                "Request failed",
                method=request.method,
                path=request.url.path,
                duration_ms=round(duration, 2),
                error=str(e),
                request_id=request_id
            )
            raise e
