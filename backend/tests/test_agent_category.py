"""Tests for task-category agent tools."""
import pytest

from app.agent.tools import get_agent_tools
from app.models.task import Task
from app.services import task_service


@pytest.mark.asyncio
async def test_create_task_without_category_asks(session):
    """When category is not provided the tool returns a prompt asking for it."""
    tools = get_agent_tools(session)
    create = next(t for t in tools if t.name == "create_task")

    result = await create.ainvoke({
        "title": "לסדר את המקרר",
        "urgency": "medium",
        "category": "",
    })
    assert "קטגוריה" in result or "כובע" in result


@pytest.mark.asyncio
async def test_create_task_with_personal_category(session):
    """When category=personal the task is created with that category."""
    tools = get_agent_tools(session)
    create = next(t for t in tools if t.name == "create_task")

    result = await create.ainvoke({
        "title": "לסדר את המקרר",
        "urgency": "medium",
        "category": "personal",
    })
    assert "נוצרה" in result
    assert "personal" in result

    # Verify DB
    tasks = await task_service.list_tasks(session, category="personal")
    assert any(t.title == "לסדר את המקרר" for t in tasks)


@pytest.mark.asyncio
async def test_list_tasks_by_vaad_category(session):
    """list_tasks(category='vaad') returns only vaad tasks."""
    # Seed tasks
    t1 = Task(title="ועד גנרטור", urgency="high", category="vaad")
    t2 = Task(title="עבודה משרד", urgency="low", category="work")
    session.add_all([t1, t2])
    await session.commit()

    tools = get_agent_tools(session)
    list_tool = next(t for t in tools if t.name == "list_tasks")

    result = await list_tool.ainvoke({"category": "vaad"})
    assert "ועד גנרטור" in result
    assert "עבודה משרד" not in result


@pytest.mark.asyncio
async def test_update_task_category_tool(session):
    """update_task_category fuzzy-matches and updates."""
    task = Task(title="לתקן מזגן", urgency="medium", category="work")
    session.add(task)
    await session.commit()

    tools = get_agent_tools(session)
    update_cat = next(t for t in tools if t.name == "update_task_category")

    result = await update_cat.ainvoke({"task_name": "מזגן", "category": "personal"})
    assert "אישי" in result

    updated = await task_service.get_task(session, task.id)
    assert updated.category == "personal"


@pytest.mark.asyncio
async def test_update_task_category_invalid(session):
    task = Task(title="משימה", urgency="low", category="work")
    session.add(task)
    await session.commit()

    tools = get_agent_tools(session)
    update_cat = next(t for t in tools if t.name == "update_task_category")

    result = await update_cat.ainvoke({"task_name": "משימה", "category": "badval"})
    assert "שגיאה" in result
