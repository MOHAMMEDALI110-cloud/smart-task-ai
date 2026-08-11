from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .models import PriorityEnum, StatusEnum


class TaskCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Task title",
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
        description="Optional task description",
    )

    priority: PriorityEnum = Field(
        default=PriorityEnum.MEDIUM,
        description="Task priority",
    )

    category: str | None = Field(
        default=None,
        max_length=50,
        description="Task category",
    )

    due_date: datetime | None = Field(
        default=None,
        description="Optional task deadline",
    )

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Task title cannot be blank.")

        return value


class TaskUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    status: StatusEnum | None = None

    priority: PriorityEnum | None = None

    category: str | None = Field(
        default=None,
        max_length=50,
    )

    due_date: datetime | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError("Task title cannot be blank.")

        return value


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    status: StatusEnum
    priority: PriorityEnum
    category: str | None
    due_date: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)