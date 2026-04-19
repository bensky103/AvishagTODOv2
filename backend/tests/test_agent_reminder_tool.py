"""Tests for toggle_task_reminder agent tool."""

import pytest
from datetime import date

from app.agent.tools import get_agent_tools
from app.models.task import Task
from app.services import task_service


TODAY = date.today()


@pytest.mark.asyncio
async def test_toggle_reminder_on_task_with_due_date(session):
    task = Task(title="Test task with date", urgency="medium", due_date=TODAY, reminder_enabled=False)
    session.add(task)
    await session.commit()

    tools = get_agent_tools(session)
    toggle = next(t for t in tools if t.name == "toggle_task_reminder")

    result = await toggle.ainvoke({"task_name": "Test task with date", "enabled": True})
    assert "תזכורת הופעלה למשימה" in result
    assert "Test task with date" in result

    updated = await task_service.get_task(session, task.id)
    assert updated.reminder_enabled is True


@pytest.mark.asyncio
async def test_toggle_reminder_on_task_without_due_date_returns_error(session):
    task = Task(title="Test task no date", urgency="medium", due_date=None, reminder_enabled=False)
    session.add(task)
    await session.commit()

    tools = get_agent_tools(session)
    toggle = next(t for t in tools if t.name == "toggle_task_reminder")

    result = await toggle.ainvoke({"task_name": "Test task no date", "enabled": True})
    assert "לא ניתן להפעיל תזכורת ללא תאריך יעד" in result

    # Row is unchanged
    unchanged = await task_service.get_task(session, task.id)
    assert unchanged.reminder_enabled is False


@pytest.mark.asyncio
async def test_toggle_reminder_off(session):
    task = Task(title="Test task to disable", urgency="high", due_date=TODAY, reminder_enabled=True)
    session.add(task)
    await session.commit()

    tools = get_agent_tools(session)
    toggle = next(t for t in tools if t.name == "toggle_task_reminder")

    result = await toggle.ainvoke({"task_name": "Test task to disable", "enabled": False})
    assert "תזכורת בוטלה למשימה" in result

    updated = await task_service.get_task(session, task.id)
    assert updated.reminder_enabled is False
