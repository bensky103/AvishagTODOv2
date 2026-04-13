from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    due_date: Optional[date] = None
    urgency: Literal["low", "medium", "high", "critical"] = "medium"


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    due_date: Optional[date] = None
    urgency: Optional[Literal["low", "medium", "high", "critical"]] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[date]
    urgency: str
    is_completed: bool
    created_at: datetime
    completed_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
