from datetime import UTC, date, datetime
from typing import Optional

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.action_item import ActionItem
from app.models.issue_report import IssueReport
from app.models.task import Task

logger = structlog.get_logger("issue_service")


def _null_if_blank(value: Optional[str]) -> Optional[str]:
    """Return None if value is None or empty/whitespace, else return stripped value."""
    if value is None:
        return None
    stripped = value.strip()
    return stripped if stripped else None


async def create_issue_report(
    session: AsyncSession,
    supplier_name: str,
    product_name: str,
    arrival_date: date,
    problem_description: str,
    sku: Optional[str] = None,
    order_number: Optional[str] = None,
    what_we_did: Optional[str] = None,
    compensation_required: Optional[str] = None,
) -> IssueReport:
    issue = IssueReport(
        supplier_name=supplier_name,
        product_name=product_name,
        sku=_null_if_blank(sku),
        arrival_date=arrival_date,
        problem_description=problem_description,
        order_number=_null_if_blank(order_number),
        what_we_did=_null_if_blank(what_we_did),
        compensation_required=_null_if_blank(compensation_required),
    )
    session.add(issue)
    await session.commit()
    logger.info("issue_created", issue_id=issue.id)
    return await get_issue_report(session, issue.id)


async def get_issue_report(session: AsyncSession, issue_id: int) -> Optional[IssueReport]:
    stmt = (
        select(IssueReport)
        .where(IssueReport.id == issue_id)
        .options(selectinload(IssueReport.action_items).selectinload(ActionItem.task))
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_issue_reports(
    session: AsyncSession,
    supplier_name: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> list[IssueReport]:
    stmt = select(IssueReport).options(selectinload(IssueReport.action_items).selectinload(ActionItem.task))
    if supplier_name:
        stmt = stmt.where(IssueReport.supplier_name.ilike(f"%{supplier_name}%"))
    if status:
        stmt = stmt.where(IssueReport.status == status)
    stmt = stmt.order_by(IssueReport.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def resolve_issue_report(session: AsyncSession, issue_id: int) -> IssueReport:
    issue = await session.get(IssueReport, issue_id)
    if not issue:
        raise ValueError(f"Issue {issue_id} not found")
    issue.status = "resolved"
    issue.resolved_at = datetime.now(UTC)
    await session.commit()
    logger.info("issue_resolved", issue_id=issue_id)
    return await get_issue_report(session, issue_id)


_UPDATABLE_FIELDS = {"product_name", "sku", "arrival_date", "problem_description", "status", "order_number", "what_we_did", "compensation_required"}


_NULLABLE_TEXT_FIELDS = {"order_number", "what_we_did", "compensation_required", "sku"}


async def update_issue(session: AsyncSession, issue_id: int, **kwargs) -> IssueReport:
    issue = await session.get(IssueReport, issue_id)
    if not issue:
        raise ValueError(f"Issue {issue_id} not found")
    for key, value in kwargs.items():
        if key not in _UPDATABLE_FIELDS:
            raise ValueError(f"Cannot update field: {key}")
        if key in _NULLABLE_TEXT_FIELDS:
            value = _null_if_blank(value)
        setattr(issue, key, value)
    await session.commit()
    logger.info("issue_updated", issue_id=issue_id)
    return await get_issue_report(session, issue_id)


async def reopen_issue_report(session: AsyncSession, issue_id: int) -> IssueReport:
    issue = await session.get(IssueReport, issue_id)
    if not issue:
        raise ValueError(f"Issue {issue_id} not found")
    issue.status = "open"
    issue.resolved_at = None
    await session.commit()
    logger.info("issue_reopened", issue_id=issue_id)
    return await get_issue_report(session, issue_id)


async def delete_issue_report(session: AsyncSession, issue_id: int) -> None:
    issue = await session.get(IssueReport, issue_id)
    if not issue:
        raise ValueError(f"Issue {issue_id} not found")
    await session.delete(issue)
    await session.commit()
    logger.info("issue_deleted", issue_id=issue_id)


async def add_action_item(
    session: AsyncSession,
    issue_report_id: int,
    description: str,
    create_task: bool = False,
    task_description: str = "",
    urgency: str = "medium",
    due_date=None,
) -> ActionItem:
    task_id = None
    if create_task:
        task = Task(title=description, description=task_description or None, urgency=urgency, due_date=due_date)
        session.add(task)
        await session.flush()
        task_id = task.id

    action = ActionItem(
        issue_report_id=issue_report_id,
        description=description,
        task_id=task_id,
    )
    session.add(action)
    await session.commit()
    await session.refresh(action)
    return action


async def complete_action_item(session: AsyncSession, action_item_id: int) -> ActionItem:
    action = await session.get(ActionItem, action_item_id)
    if not action:
        raise ValueError(f"ActionItem {action_item_id} not found")
    action.is_completed = True
    if action.task_id:
        task = await session.get(Task, action.task_id)
        if task:
            task.is_completed = True
            task.completed_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(action)
    return action


async def uncomplete_action_item(session: AsyncSession, action_item_id: int) -> ActionItem:
    action = await session.get(ActionItem, action_item_id)
    if not action:
        raise ValueError(f"ActionItem {action_item_id} not found")
    action.is_completed = False
    if action.task_id:
        task = await session.get(Task, action.task_id)
        if task:
            task.is_completed = False
            task.completed_at = None
    await session.commit()
    await session.refresh(action)
    return action
