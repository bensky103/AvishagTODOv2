from datetime import UTC, date, datetime
from typing import Optional

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.action_item import ActionItem
from app.models.task import Task

logger = structlog.get_logger("task_service")


async def create_task(
    session: AsyncSession,
    title: str,
    description: Optional[str] = None,
    due_date: Optional[date] = None,
    urgency: str = "medium",
) -> Task:
    task = Task(
        title=title,
        description=description,
        due_date=due_date,
        urgency=urgency,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    logger.info("task_created", task_id=task.id)
    return task


async def get_task(session: AsyncSession, task_id: int) -> Optional[Task]:
    return await session.get(Task, task_id)


async def list_tasks(
    session: AsyncSession,
    status: Optional[str] = None,
    urgency: Optional[str] = None,
    due_before: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Task]:
    stmt = select(Task)
    if status == "open":
        stmt = stmt.where(Task.is_completed == False)  # noqa: E712
    elif status == "completed":
        stmt = stmt.where(Task.is_completed == True)  # noqa: E712
    if urgency:
        stmt = stmt.where(Task.urgency == urgency)
    if due_before:
        stmt = stmt.where(Task.due_date <= due_before)
    stmt = stmt.order_by(Task.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def complete_task(session: AsyncSession, task_id: int) -> Task:
    task = await session.get(Task, task_id)
    if not task:
        raise ValueError(f"Task {task_id} not found")
    task.is_completed = True
    task.completed_at = datetime.now(UTC)
    # Sync linked action items
    stmt = select(ActionItem).where(ActionItem.task_id == task_id)
    result = await session.execute(stmt)
    for action in result.scalars().all():
        action.is_completed = True
    await session.commit()
    await session.refresh(task)
    logger.info("task_completed", task_id=task_id)
    return task


async def reopen_task(session: AsyncSession, task_id: int) -> Task:
    task = await session.get(Task, task_id)
    if not task:
        raise ValueError(f"Task {task_id} not found")
    task.is_completed = False
    task.completed_at = None
    # Sync linked action items
    stmt = select(ActionItem).where(ActionItem.task_id == task_id)
    result = await session.execute(stmt)
    for action in result.scalars().all():
        action.is_completed = False
    await session.commit()
    await session.refresh(task)
    logger.info("task_reopened", task_id=task_id)
    return task


async def update_task(session: AsyncSession, task_id: int, **kwargs) -> Task:
    task = await session.get(Task, task_id)
    if not task:
        raise ValueError(f"Task {task_id} not found")
    for key, value in kwargs.items():
        setattr(task, key, value)
    await session.commit()
    await session.refresh(task)
    logger.info("task_updated", task_id=task_id)
    return task


async def delete_task(session: AsyncSession, task_id: int) -> None:
    task = await session.get(Task, task_id)
    if not task:
        raise ValueError(f"Task {task_id} not found")
    await session.delete(task)
    await session.commit()
    logger.info("task_deleted", task_id=task_id)
