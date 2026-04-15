import secrets
import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import settings

# Token store: token -> expiry timestamp
_valid_tokens: dict[str, float] = {}


def _cleanup_expired() -> None:
    """Remove expired tokens."""
    now = time.time()
    expired = [t for t, exp in _valid_tokens.items() if exp <= now]
    for t in expired:
        del _valid_tokens[t]


def verify_pin(pin: str) -> str | None:
    """Check PIN and return a session token if valid."""
    if pin == settings.pin_code:
        _cleanup_expired()
        # Enforce max tokens to prevent memory leak
        if len(_valid_tokens) >= settings.max_active_tokens:
            # Remove the oldest token
            oldest = min(_valid_tokens, key=_valid_tokens.get)
            del _valid_tokens[oldest]
        token = secrets.token_urlsafe(32)
        _valid_tokens[token] = time.time() + settings.token_ttl_seconds
        return token
    return None


def check_token(token: str) -> bool:
    """Validate a token exists and is not expired."""
    if not token or token not in _valid_tokens:
        return False
    if time.time() > _valid_tokens[token]:
        del _valid_tokens[token]
        return False
    return True


def invalidate_token(token: str) -> None:
    """Remove a token (logout)."""
    _valid_tokens.pop(token, None)


class AuthMiddleware(BaseHTTPMiddleware):
    EXEMPT_PATHS = {"/health", "/api/auth/verify", "/api/auth/logout", "/api/auth/check"}

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
