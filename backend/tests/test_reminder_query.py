"""Tests for reminder_service.list_due_reminders (requires DB session)."""

import pytest
from datetime import date, timedelta

from app.models.task import Task
from app.services.reminder_service import list_due_reminders


TODAY = date.today()
YESTERDAY = TODAY - timedelta(days=1)
TOMORROW = TODAY + timedelta(days=1)


@pytest.mark.asyncio
async def test_returns_reminder_enabled_due_today(session):
    task = Task(title="Due today", urgency="medium", due_date=TODAY, reminder_enabled=True)
    session.add(task)
    await session.commit()

    today_tasks, overdue_tasks = await list_due_reminders(session)
    titles = [t.title for t in today_tasks]
    assert "Due today" in titles
    assert overdue_tasks == []


@pytest.mark.asyncio
async def test_returns_overdue_task(session):
    task = Task(title="Overdue task", urgency="high", due_date=YESTERDAY, reminder_enabled=True)
    session.add(task)
    await session.commit()

    today_tasks, overdue_tasks = await list_due_reminders(session)
    assert today_tasks == []
    assert any(t.title == "Overdue task" for t in overdue_tasks)


@pytest.mark.asyncio
async def test_future_due_date_excluded(session):
    task = Task(title="Future task", urgency="low", due_date=TOMORROW, reminder_enabled=True)
    session.add(task)
    await session.commit()

    today_tasks, overdue_tasks = await list_due_reminders(session)
    all_titles = [t.title for t in today_tasks + overdue_tasks]
    assert "Future task" not in all_titles


@pytest.mark.asyncio
async def test_completed_today_excluded(session):
    task = Task(title="Completed today", urgency="medium", due_date=TODAY, reminder_enabled=True, is_completed=True)
    session.add(task)
    await session.commit()

    today_tasks, overdue_tasks = await list_due_reminders(session)
    all_titles = [t.title for t in today_tasks + overdue_tasks]
    assert "Completed today" not in all_titles


@pytest.mark.asyncio
async def test_reminder_off_excluded_even_if_overdue(session):
    task = Task(title="No reminder overdue", urgency="critical", due_date=YESTERDAY, reminder_enabled=False)
    session.add(task)
    await session.commit()

    today_tasks, overdue_tasks = await list_due_reminders(session)
    all_titles = [t.title for t in today_tasks + overdue_tasks]
    assert "No reminder overdue" not in all_titles


@pytest.mark.asyncio
async def test_today_tasks_sorted_by_urgency(session):
    """Critical appears before low in today bucket."""
    session.add(Task(title="Low today", urgency="low", due_date=TODAY, reminder_enabled=True))
    session.add(Task(title="Critical today", urgency="critical", due_date=TODAY, reminder_enabled=True))
    await session.commit()

    today_tasks, _ = await list_due_reminders(session)
    titles = [t.title for t in today_tasks]
    assert titles.index("Critical today") < titles.index("Low today")


@pytest.mark.asyncio
async def test_overdue_tasks_sorted_oldest_first(session):
    """Oldest overdue due_date appears first."""
    session.add(Task(title="Older overdue", urgency="medium", due_date=TODAY - timedelta(days=3), reminder_enabled=True))
    session.add(Task(title="Newer overdue", urgency="medium", due_date=YESTERDAY, reminder_enabled=True))
    await session.commit()

    _, overdue_tasks = await list_due_reminders(session)
    titles = [t.title for t in overdue_tasks]
    assert titles.index("Older overdue") < titles.index("Newer overdue")
