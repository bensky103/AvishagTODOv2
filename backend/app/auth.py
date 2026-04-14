import secrets
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import settings

# Simple token store (in-memory; single-user app)
_valid_tokens: set[str] = set()


def verify_pin(pin: str) -> str | None:
    """Check PIN and return a session token if valid."""
    if pin == settings.pin_code:
        token = secrets.token_urlsafe(32)
        _valid_tokens.add(token)
        return token
    return None


def check_token(token: str) -> bool:
    return token in _valid_tokens


class AuthMiddleware(BaseHTTPMiddleware):
    EXEMPT_PATHS = {"/health", "/api/auth/verify"}

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        # Skip auth for exempt paths, OPTIONS, and non-API routes (static frontend)
        if path in self.EXEMPT_PATHS or request.method == "OPTIONS" or not path.startswith("/api/"):
            return await call_next(request)

        # Check cookie first (set by /api/auth/verify), then Authorization header
        token = request.cookies.get("auth_token") or request.headers.get("Authorization", "").removeprefix("Bearer ")
        if not check_token(token):
            return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

        return await call_next(request)
