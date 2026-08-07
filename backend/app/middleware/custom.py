import time
from starlette.datastructures import Headers
from app.core.logging import logger

class PerformanceMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.perf_counter()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = Headers(raw=message.get("headers", []))
                process_time = time.perf_counter() - start_time
                new_headers = list(headers.items())
                new_headers.append(("X-Process-Time", str(process_time)))
                message["headers"] = [
                    (k.encode("latin-1"), v.encode("latin-1")) for k, v in new_headers
                ]
            await send(message)

        await self.app(scope, receive, send_wrapper)


class LoggingMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)
        request_id = headers.get("X-Request-ID")
        method = scope.get("method", "")
        path = scope.get("path", "")
        query_string = scope.get("query_string", b"").decode("utf-8")

        logger.info(
            "Request started",
            method=method,
            path=path,
            query_params=query_string,
            request_id=request_id
        )

        start_time = time.perf_counter()
        status_code = [200]

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status_code[0] = message.get("status", 200)
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
            duration = (time.perf_counter() - start_time) * 1000  # in ms
            logger.info(
                "Request completed",
                method=method,
                path=path,
                status_code=status_code[0],
                duration_ms=round(duration, 2),
                request_id=request_id
            )
        except Exception as e:
            duration = (time.perf_counter() - start_time) * 1000
            logger.exception(
                "Request failed",
                method=method,
                path=path,
                duration_ms=round(duration, 2),
                error=str(e),
                request_id=request_id
            )
            raise e
