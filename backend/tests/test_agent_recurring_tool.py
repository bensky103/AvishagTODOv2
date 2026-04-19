"""Tests for toggle_task_recurring agent tool."""

import pytest
from datetime import date

from app.agent.tools import get_agent_tools
from app.models.task import Task
from app.services import task_service


TODAY = date.today()


@pytest.mark.asyncio
async def test_toggle_recurring_on_task_with_due_date(session):
    task = Task(title="Monthly report", urgency="medium", due_date=TODAY, is_recurring_monthly=False)
    session.add(task)
    await session.commit()

    tools = get_agent_tools(session)
    toggle = next(t for t in tools if t.name == "toggle_task_recurring")

    result = await toggle.ainvoke({"task_name": "Monthly report", "enabled": True})
    assert "סומנה כקבועה" in result
    assert "Monthly report" in result

    updated = await task_service.get_task(session, task.id)
    assert updated.is_recurring_monthly is True
    assert updated.due_date == TODAY  # due_date unchanged


@pytest.mark.asyncio
async def test_toggle_recurring_on_task_without_due_date_returns_error(session):
    task = Task(title="No date task", urgency="medium", due_date=None, is_recurring_monthly=False)
    session.add(task)
    await session.commit()

    tools = get_agent_tools(session)
    toggle = next(t for t in tools if t.name == "toggle_task_recurring")

    result = await toggle.ainvoke({"task_name": "No date task", "enabled": True})
    assert "לא ניתן להגדיר משימה קבועה ללא תאריך יעד" in result

    # Row is unchanged
    unchanged = await task_service.get_task(session, task.id)
    assert unchanged.is_recurring_monthly is False


@pytest.mark.asyncio
async def test_toggle_recurring_off(session):
    task = Task(title="Was recurring", urgency="high", due_date=TODAY, is_recurring_monthly=True)
    session.add(task)
    await session.commit()

    tools = get_agent_tools(session)
    toggle = next(t for t in tools if t.name == "toggle_task_recurring")

    result = await toggle.ainvoke({"task_name": "Was recurring", "enabled": False})
    assert "כבר אינה קבועה" in result

    updated = await task_service.get_task(session, task.id)
    assert updated.is_recurring_monthly is False
    assert updated.due_date == TODAY  # due_date unchanged
