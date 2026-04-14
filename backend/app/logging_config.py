import logging
import logging.handlers
import os
from pathlib import Path

import structlog

LOGS_DIR = Path(__file__).resolve().parent.parent / "logs"


def setup_logging() -> None:
    """Configure structured logging with file rotation and filtered console output."""
    LOGS_DIR.mkdir(exist_ok=True)

    # File handler — all app logs with rotation (5MB, keep 5 files)
    file_handler = logging.handlers.RotatingFileHandler(
        LOGS_DIR / "app.log",
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter("%(message)s"))

    # Console handler — only warnings+ from app, suppress noisy libraries
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter("%(message)s"))

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)

    # Suppress noisy third-party loggers
    for noisy in ("uvicorn.access", "uvicorn.error", "httpcore", "httpx",
                   "sqlalchemy.engine", "aiosqlite", "watchfiles",
                   "telegram.ext", "hpack", "urllib3"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    # Keep uvicorn startup messages visible
    logging.getLogger("uvicorn").setLevel(logging.INFO)

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.dev.ConsoleRenderer() if os.getenv("LOG_FORMAT") != "json"
            else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
