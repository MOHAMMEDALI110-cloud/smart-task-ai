from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.ai.service import generate_ai_response
from backend.app.ai.task_parser import parse_task_with_ai


router = APIRouter(
    prefix="/api/ai",
    tags=["AI"],
)


# -------------------------------------------------------------------
# AI Assistant
# -------------------------------------------------------------------

class AIRequest(BaseModel):
    prompt: str


class AIResponse(BaseModel):
    response: str


@router.post("/assist", response_model=AIResponse)
def ai_assist(request: AIRequest):
    try:
        response = generate_ai_response(request.prompt)

        return AIResponse(
            response=response
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI assistant failed: {str(e)}",
        )


# -------------------------------------------------------------------
# AI Task Parser
# -------------------------------------------------------------------

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