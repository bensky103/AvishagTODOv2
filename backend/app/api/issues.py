from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.action_item import ActionItemCreate, ActionItemResponse
from app.schemas.issue_report import IssueReportCreate, IssueReportResponse, IssueReportUpdate
from app.services import issue_service

router = APIRouter()


@router.post("/", response_model=IssueReportResponse, status_code=201)
async def create_issue(data: IssueReportCreate, session: AsyncSession = Depends(get_session)):
    return await issue_service.create_issue_report(
        session, supplier_name=data.supplier_name, product_name=data.product_name,
        sku=data.sku, arrival_date=data.arrival_date,
        problem_description=data.problem_description,
        order_number=data.order_number,
        what_we_did=data.what_we_did,
        compensation_required=data.compensation_required,
    )


@router.get("/", response_model=list[IssueReportResponse])
async def list_issues(
    supplier_name: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    return await issue_service.list_issue_reports(
        session, supplier_name=supplier_name, status=status, skip=skip, limit=limit,
    )


@router.get("/{issue_id}", response_model=IssueReportResponse)
async def get_issue(issue_id: int, session: AsyncSession = Depends(get_session)):
    issue = await issue_service.get_issue_report(session, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@router.post("/{issue_id}/resolve", response_model=IssueReportResponse)
async def resolve_issue(issue_id: int, session: AsyncSession = Depends(get_session)):
    issue = await issue_service.get_issue_report(session, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return await issue_service.resolve_issue_report(session, issue_id)


@router.post("/{issue_id}/reopen", response_model=IssueReportResponse)
async def reopen_issue(issue_id: int, session: AsyncSession = Depends(get_session)):
    issue = await issue_service.get_issue_report(session, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return await issue_service.reopen_issue_report(session, issue_id)


@router.patch("/{issue_id}", response_model=IssueReportResponse)
async def update_issue(issue_id: int, data: IssueReportUpdate, session: AsyncSession = Depends(get_session)):
    issue = await issue_service.get_issue_report(session, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return await issue_service.update_issue(session, issue_id, **data.model_dump(exclude_unset=True))


@router.delete("/{issue_id}", status_code=204)
async def delete_issue(issue_id: int, session: AsyncSession = Depends(get_session)):
    issue = await issue_service.get_issue_report(session, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    await issue_service.delete_issue_report(session, issue_id)


@router.post("/{issue_id}/action-items", response_model=ActionItemResponse, status_code=201)
async def add_action_item(
    issue_id: int, data: ActionItemCreate, session: AsyncSession = Depends(get_session),
):
    issue = await issue_service.get_issue_report(session, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return await issue_service.add_action_item(
        session, issue_report_id=issue_id,
        description=data.description, create_task=data.create_task,
    )


@router.post("/action-items/{action_item_id}/complete", response_model=ActionItemResponse)
async def complete_action_item(
    action_item_id: int, session: AsyncSession = Depends(get_session),
):
    try:
        return await issue_service.complete_action_item(session, action_item_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Action item not found")


@router.post("/action-items/{action_item_id}/uncomplete", response_model=ActionItemResponse)
async def uncomplete_action_item(
    action_item_id: int, session: AsyncSession = Depends(get_session),
):
    try:
        return await issue_service.uncomplete_action_item(session, action_item_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Action item not found")
