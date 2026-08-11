import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise RuntimeError("GROQ_API_KEY is not configured")

client = Groq(api_key=api_key)

MODEL = "llama-3.3-70b-versatile"


def generate_ai_response(prompt: str) -> str:
    """Generate a response using the Groq LLM."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Smart Task AI, an intelligent productivity "
                    "assistant. Help users organize, prioritize, and "
                    "manage their tasks. Be concise, practical, and clear."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.3,
        max_tokens=500,
    )

    return response.choices[0].message.content.strip()
def calculate_ai_priority_score(
    title: str,
    description: str = "",
    priority: str = "Medium",
    status: str = "Pending",
    due_date: str | None = None,
) -> int:
    """Calculate an AI-powered priority score from 0 to 100."""

    prompt = f"""
You are a task prioritization engine.

Calculate a priority score from 0 to 100 for this task.

Task title: {title}
Description: {description or "None"}
User priority: {priority}
Status: {status}
Due date: {due_date or "No due date"}

Scoring guidance:
- 90-100: Extremely urgent/critical
- 75-89: Very high priority
- 50-74: Moderate priority
- 25-49: Low priority
- 0-24: Very low priority

Consider:
1. User-provided priority
2. Deadline urgency
3. Whether the task is still pending
4. Potential importance based on the task description

Return ONLY one integer between 0 and 100.
Do not include any explanation.
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an accurate task prioritization engine. "
                    "Return only a numeric priority score."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0,
        max_tokens=10,
    )

    raw_score = response.choices[0].message.content.strip()

    try:
        score = int(raw_score)
    except ValueError:
        # Safely extract a number if the model returns extra text.
        import re

        match = re.search(r"\b(\d{1,3})\b", raw_score)

        if not match:
            raise ValueError("AI returned an invalid priority score")

        score = int(match.group(1))

    return max(0, min(100, score))
def generate_task_breakdown(
    title: str,
    description: str = "",
) -> list[str]:
    """Generate actionable subtasks for a task using the Groq LLM."""

    prompt = f"""
Break down the following task into 4 to 7 practical, actionable subtasks.

Task title:
{title}

Task description:
{description or "No description provided."}

Rules:
- Return only the subtasks.
- Each subtask must be a clear action.
- Keep each subtask short.
- Do not repeat the original task.
- Order the subtasks logically from start to finish.
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Smart Task AI, an intelligent productivity "
                    "assistant. Convert large tasks into practical, "
                    "ordered subtasks."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.2,
        max_tokens=400,
    )

    text = response.choices[0].message.content.strip()

    # Convert numbered/bulleted LLM output into a clean list.
    subtasks = []

    for line in text.splitlines():
        line = line.strip()

        if not line:
            continue

        # Remove common numbering formats such as:
        # 1. Task
        # 1) Task
        # - Task
        # * Task
        import re

        line = re.sub(r"^\s*(?:[-*]|\d+[.)])\s*", "", line).strip()

        if line:
            subtasks.append(line)

    return subtasks[:7]