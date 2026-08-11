from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.ai.service import (
    generate_ai_response,
    calculate_ai_priority_score,
    generate_task_breakdown,
)

from backend.app.ai.task_parser import parse_task_with_ai


router = APIRouter(prefix="/api/ai", tags=["AI"])


# =========================
# AI ASSISTANT
# =========================

class AIRequest(BaseModel):
    prompt: str


class AIResponse(BaseModel):
    response: str


@router.post("/assist", response_model=AIResponse)
def ai_assist(request: AIRequest):
    response = generate_ai_response(request.prompt)
    return AIResponse(response=response)


# =========================
# AI PRIORITY SCORE
# =========================

class AIPriorityRequest(BaseModel):
    title: str
    description: str = ""
    priority: str = "Medium"
    status: str = "Pending"
    due_date: str | None = None


class AIPriorityResponse(BaseModel):
    score: int


@router.post("/priority-score", response_model=AIPriorityResponse)
def ai_priority_score(request: AIPriorityRequest):
    try:
        score = calculate_ai_priority_score(
            title=request.title,
            description=request.description,
            priority=request.priority,
            status=request.status,
            due_date=request.due_date,
        )

        return AIPriorityResponse(score=score)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI priority scoring failed: {str(e)}",
        )


# =========================
# AI TASK PARSER
# =========================

class AITaskRequest(BaseModel):
    text: str


@router.post("/parse-task")
def parse_task(request: AITaskRequest):
    try:
        result = parse_task_with_ai(request.text)

        return {
            "success": True,
            "task": result,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI task parsing failed: {str(e)}",
        )
class AIBreakdownRequest(BaseModel):
    title: str
    description: str = ""


class AIBreakdownResponse(BaseModel):
    subtasks: list[str]


@router.post("/breakdown-task", response_model=AIBreakdownResponse)
def breakdown_task(request: AIBreakdownRequest):
    try:
        subtasks = generate_task_breakdown(
            request.title,
            request.description,
        )

        return AIBreakdownResponse(subtasks=subtasks)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI task breakdown failed: {str(e)}",
        )