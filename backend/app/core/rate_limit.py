from __future__ import annotations

from typing import Final

from fastapi import Request, status
from fastapi.responses import JSONResponse
from redis.asyncio import Redis
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.utils.response_wrapper import api_response


class RedisRateLimitMiddleware(BaseHTTPMiddleware):
    _SKIP_PATH_PREFIXES: Final[tuple[str, ...]] = ("/", "/docs", "/redoc", "/openapi.json")

    def __init__(self, app):
        super().__init__(app)
        self.redis = Redis.from_url(settings.redis_url, decode_responses=True)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path in self._SKIP_PATH_PREFIXES:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        key = f"rl:{client_ip}:{path}"

        try:
            current = await self.redis.incr(key)
            if current == 1:
                await self.redis.expire(key, settings.rate_limit_window_seconds)
            if current > settings.rate_limit_per_minute:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content=api_response(False, "Rate limit exceeded", {}),
                )
        except Exception:
            # Fail-open to avoid hard outage if Redis is unavailable.
            pass

        return await call_next(request)


async def rate_limit_placeholder() -> None:
    # Backward-compatible dependency hook for routes that still use Depends().
    return None
