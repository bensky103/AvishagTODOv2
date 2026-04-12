import os
from contextlib import asynccontextmanager
from pathlib import Path

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import tasks, suppliers, issues
from app.config import settings

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

# CORS — allow all origins for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["suppliers"])
app.include_router(issues.router, prefix="/api/issues", tags=["issues"])


@app.get("/health")
async def health():
    return {"status": "ok"}


# Mount Next.js static export — must be AFTER API routes
frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "out"
if frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
