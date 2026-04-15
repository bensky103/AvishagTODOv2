from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from app.api import tasks, suppliers, issues
from app.auth import AuthMiddleware, verify_pin, invalidate_token, check_token
from app.config import settings
from app.logging_config import setup_logging

setup_logging()

logger = structlog.get_logger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    bot_app = None
    if settings.telegram_bot_token:
        from app.agent.bot import start_bot, stop_bot
        bot_app = await start_bot()
        logger.info("telegram_bot_started")
    yield
    if bot_app:
        await stop_bot(bot_app)
        logger.info("telegram_bot_stopped")


app = FastAPI(title="Avishag Purchase Manager", lifespan=lifespan)

# Rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Auth middleware
app.add_middleware(AuthMiddleware)

# --- Auth endpoint ---
@app.post("/api/auth/verify")
async def auth_verify(body: dict):
    from starlette.responses import JSONResponse as StarletteJSONResponse
    pin = body.get("pin", "")
    token = verify_pin(pin)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid PIN")
    response = StarletteJSONResponse(content={"ok": True})
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 30,  # 30 days
    )
    return response

# --- Logout endpoint ---
@app.post("/api/auth/logout")
async def auth_logout(request: Request):
    token = request.cookies.get("auth_token", "")
    invalidate_token(token)
    response = JSONResponse(content={"ok": True})
    response.delete_cookie("auth_token", path="/")
    return response

# --- Auth check endpoint (replaces JS cookie reading for httponly) ---
@app.get("/api/auth/check")
async def auth_check(request: Request):
    token = request.cookies.get("auth_token", "")
    if check_token(token):
        return {"authenticated": True}
    return JSONResponse(status_code=401, content={"authenticated": False})

# --- Global exception handler ---
@app.exception_handler(Exception)
async def generic_error_handler(request, exc):
    logger.error("unhandled_error", path=str(request.url), error=str(exc), type=type(exc).__name__)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["suppliers"])
app.include_router(issues.router, prefix="/api/issues", tags=["issues"])


@app.get("/health")
async def health():
    return {"status": "ok"}


# --- Serve static frontend (mirrors what nginx does in prod) ---
import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

_frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "out"
if _frontend_dir.is_dir():
    # Serve Next.js static assets
    _next_static = _frontend_dir / "_next"
    if _next_static.is_dir():
        app.mount("/_next", StaticFiles(directory=str(_next_static)), name="next-static")

    @app.get("/{path:path}")
    async def serve_frontend(path: str):
        """Serve frontend pages — same as nginx try_files."""
        # Try exact file
        file = _frontend_dir / path
        if file.is_file():
            return FileResponse(str(file))
        # Try path.html
        html_file = _frontend_dir / f"{path}.html"
        if html_file.is_file():
            return FileResponse(str(html_file))
        # Try path/index.html
        index_file = _frontend_dir / path / "index.html"
        if index_file.is_file():
            return FileResponse(str(index_file))
        # Fallback to index.html (SPA)
        fallback = _frontend_dir / "index.html"
        if fallback.is_file():
            return FileResponse(str(fallback))
        return JSONResponse(status_code=404, content={"detail": "Not found"})
