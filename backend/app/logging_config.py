import logging
import logging.handlers
import os
from pathlib import Path

import structlog

LOGS_DIR = Path(__file__).resolve().parent.parent / "logs"


class _PlainFileRenderer:
    """Render structlog events as: TIMESTAMP | LEVEL | file:func.event | extras"""

    _APP_ROOT = str(Path(__file__).resolve().parent.parent) + os.sep

    def __call__(self, logger, method_name, event_dict):
        ts = event_dict.pop("timestamp", "")
        level = event_dict.pop("level", method_name).upper()
        name = event_dict.pop("logger", "")
        event = event_dict.pop("event", "")

        # Extract relative file path and function name from the stdlib LogRecord
        record = event_dict.pop("_record", None)
        file_loc = ""
        if record:
            path = record.pathname.replace(self._APP_ROOT, "")
            file_loc = f"{path}:{record.funcName}"

        # Drop internal structlog keys
        for key in ("_from_structlog",):
            event_dict.pop(key, None)

        source = f"{file_loc}.{event}" if file_loc else (f"{name}.{event}" if name and event else name or event)
        extras = " ".join(f"{k}={v}" for k, v in event_dict.items()) if event_dict else ""
        if extras:
            return f"{ts} | {level} | {source} | {extras}"
        return f"{ts} | {level} | {source}"


def setup_logging() -> None:
    """Configure structured logging with file rotation and filtered console output."""
    LOGS_DIR.mkdir(exist_ok=True)

    # File handler — plain text, no ANSI colors, rotation (5MB, keep 5 files)
    file_handler = logging.handlers.RotatingFileHandler(
        LOGS_DIR / "app.log",
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter("%(message)s"))

    # Console handler — colored output for terminal
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
                   "telegram.ext", "hpack", "urllib3",
                   "apscheduler", "openai", "openai._base_client"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    # Keep uvicorn startup messages visible
    logging.getLogger("uvicorn").setLevel(logging.INFO)

    # Shared processors (before forking to file vs console)
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    # Use foreign_pre_chain so stdlib log records also get processed
    formatter_file = structlog.stdlib.ProcessorFormatter(
        processors=[*shared_processors, _PlainFileRenderer()],
    )
    formatter_console = structlog.stdlib.ProcessorFormatter(
        processors=[*shared_processors, structlog.dev.ConsoleRenderer()],
    )

    file_handler.setFormatter(formatter_file)
    console_handler.setFormatter(formatter_console)

    # Configure structlog to route through stdlib
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
