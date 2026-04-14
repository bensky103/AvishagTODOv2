from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.schemas.action_item import ActionItemResponse


class IssueReportCreate(BaseModel):
    supplier_id: int
    product_name: str = Field(..., min_length=1, max_length=500)
    sku: Optional[str] = Field(None, max_length=100)
    arrival_date: date
    problem_description: str = Field(..., min_length=1, max_length=5000)


class IssueReportUpdate(BaseModel):
    product_name: Optional[str] = Field(None, min_length=1, max_length=500)
    sku: Optional[str] = Field(None, max_length=100)
    problem_description: Optional[str] = Field(None, max_length=5000)
    status: Optional[Literal["open", "in_progress", "resolved"]] = None


class IssueReportResponse(BaseModel):
    id: int
    supplier_id: int
    product_name: str
    sku: Optional[str]
    arrival_date: date
    problem_description: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime]
    updated_at: Optional[datetime]
    action_items: list[ActionItemResponse] = []

    model_config = {"from_attributes": True}
