"""APScheduler wiring — starts/stops the daily reminder cron job."""

import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.services.reminder_service import send_daily_reminder

logger = structlog.get_logger("scheduler")

_scheduler: AsyncIOScheduler | None = None


def start_scheduler(bot_app, session_factory) -> None:
    """Create and start the AsyncIOScheduler with the daily reminder job."""
    global _scheduler

    async def send_daily_reminder_wrapped():
        await send_daily_reminder(bot_app, session_factory)

    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        send_daily_reminder_wrapped,
        CronTrigger(hour=9, minute=0, timezone="Asia/Jerusalem"),
        id="daily_task_reminder",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("scheduler_started")


def stop_scheduler() -> None:
    """Gracefully stop the scheduler."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("scheduler_stopped")
    _scheduler = None
