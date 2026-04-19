from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services import task_service

router = APIRouter()


@router.post("/", response_model=TaskResponse, status_code=201)
async def create_task(data: TaskCreate, session: AsyncSession = Depends(get_session)):
    return await task_service.create_task(
        session, title=data.title, description=data.description,
        due_date=data.due_date, urgency=data.urgency,
        reminder_enabled=data.reminder_enabled,
        is_recurring_monthly=data.is_recurring_monthly,
        category=data.category,
    )


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    status: Optional[str] = None,
    urgency: Optional[str] = None,
    due_before: Optional[date] = None,
    category: Optional[str] = None,
    is_recurring_monthly: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    return await task_service.list_tasks(
        session, status=status, urgency=urgency, due_before=due_before,
        category=category, is_recurring_monthly=is_recurring_monthly,
        skip=skip, limit=limit,
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, session: AsyncSession = Depends(get_session)):
    task = await task_service.get_task(session, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(task_id: int, session: AsyncSession = Depends(get_session)):
    task = await task_service.get_task(session, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return await task_service.complete_task(session, task_id)


@router.post("/{task_id}/reopen", response_model=TaskResponse)
async def reopen_task(task_id: int, session: AsyncSession = Depends(get_session)):
    task = await task_service.get_task(session, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return await task_service.reopen_task(session, task_id)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, data: TaskUpdate, session: AsyncSession = Depends(get_session)):
    task = await task_service.get_task(session, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return await task_service.update_task(session, task_id, **data.model_dump(exclude_unset=True))


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: int, session: AsyncSession = Depends(get_session)):
    task = await task_service.get_task(session, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await task_service.delete_task(session, task_id)
