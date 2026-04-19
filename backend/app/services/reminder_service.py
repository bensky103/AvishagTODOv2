"""Daily reminder service — queries due tasks and sends a Telegram digest."""

from datetime import datetime
from zoneinfo import ZoneInfo

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.task import Task

logger = structlog.get_logger("reminder_service")

_URGENCY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}
_URGENCY_ICON = {"critical": "🔥", "high": "⚡", "medium": "🟡", "low": "·"}


async def list_due_reminders(session: AsyncSession) -> tuple[list[Task], list[Task]]:
    """Return (today_tasks, overdue_tasks) for tasks with reminders due."""
    today_il = datetime.now(ZoneInfo("Asia/Jerusalem")).date()

    stmt = (
        select(Task)
        .where(Task.reminder_enabled == True)  # noqa: E712
        .where(Task.is_completed == False)  # noqa: E712
        .where(Task.due_date <= today_il)
    )
    result = await session.execute(stmt)
    tasks = list(result.scalars().all())

    today: list[Task] = []
    overdue: list[Task] = []
    for t in tasks:
        if t.due_date == today_il:
            today.append(t)
        else:
            overdue.append(t)

    # "today" sorted by urgency desc (critical first), then title
    today.sort(key=lambda t: (_URGENCY_ORDER.get(t.urgency, 99), t.title))
    # "overdue" sorted by due_date asc (oldest first)
    overdue.sort(key=lambda t: t.due_date)

    return today, overdue


def format_reminder_message(
    today: list[Task],
    overdue: list[Task],
    today_il,
) -> str | None:
    """Format the Hebrew digest message, or None if nothing to send."""
    if not today and not overdue:
        return None

    parts = ["🔔 תזכורת יומית"]

    if today:
        parts.append(f"\n📅 להיום ({len(today)}):")
        for t in today:
            icon = _URGENCY_ICON.get(t.urgency, "·")
            parts.append(f"{icon} {t.title}")

    if overdue:
        parts.append(f"\n⚠️ באיחור ({len(overdue)}):")
        for t in overdue:
            days = (today_il - t.due_date).days
            parts.append(f"• {t.title} — {days} ימים")

    return "\n".join(parts)


async def send_daily_reminder(bot_app, session_factory) -> None:
    """Scheduler entry point — sends the daily reminder via Telegram."""
    if settings.telegram_allowed_user_id == -1 or bot_app is None:
        logger.warning("reminder_skipped_no_bot_or_user")
        return

    try:
        today_il = datetime.now(ZoneInfo("Asia/Jerusalem")).date()
        async with session_factory() as session:
            today, overdue = await list_due_reminders(session)

        message = format_reminder_message(today, overdue, today_il)
        if message is None:
            logger.info("reminder_nothing_to_send")
            return

        await bot_app.bot.send_message(
            chat_id=settings.telegram_allowed_user_id,
            text=message,
        )
        logger.info("reminder_sent", today_count=len(today), overdue_count=len(overdue))
    except Exception as exc:
        logger.error("reminder_job_failed", error=str(exc))
