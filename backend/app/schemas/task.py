from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    due_date: Optional[date] = None
    urgency: Literal["low", "medium", "high", "critical"] = "medium"
    reminder_enabled: bool = False
    category: Literal["work", "vaad", "personal"] = "work"


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    due_date: Optional[date] = None
    urgency: Optional[Literal["low", "medium", "high", "critical"]] = None
    reminder_enabled: Optional[bool] = None
    category: Optional[Literal["work", "vaad", "personal"]] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[date]
    urgency: Literal["low", "medium", "high", "critical"]
    is_completed: bool
    reminder_enabled: bool
    category: Literal["work", "vaad", "personal"]
    created_at: datetime
    completed_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
