import json
from datetime import datetime

from backend.app.ai.service import client, MODEL


def parse_task_with_ai(user_input: str) -> dict:
    current_datetime = datetime.now().astimezone().strftime(
        "%Y-%m-%d %H:%M:%S %z"
    )

    prompt = f"""
You are an AI task extraction engine.

Convert the user's natural-language request into a structured task.

CURRENT DATE AND TIME:
{current_datetime}

IMPORTANT DATE RULES:
- Use the CURRENT DATE AND TIME above as the reference point.
- Resolve relative dates such as:
  - today
  - tomorrow
  - the day after tomorrow
  - next Monday
  - next week
  - in 3 days
- Resolve times such as:
  - at 6 PM
  - at 18:00
  - tomorrow morning
  - tomorrow evening
- Never use a date from your training data as the current date.
- Never invent a due date when the user did not provide one.
- If no due date is mentioned, return null.
- Return due_date as an ISO 8601 datetime string.
- Example: 2026-08-12T18:00:00

USER REQUEST:
{user_input}

Return ONLY valid JSON with exactly these fields:

{{
    "title": "short task title",
    "description": "useful task description",
    "priority": "Low | Medium | High",
    "category": "Work | Personal | Study | Project | General",
    "due_date": null
}}

Rules:

- Choose High for urgent, important, or deadline-driven tasks.
- Choose Medium for normal tasks.
- Choose Low for minor tasks.
- If no due date is mentioned, return null.
- Do not invent a date.
- Return JSON only.
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You extract structured task information from natural "
                    "language. Always follow the supplied current date and "
                    "time when resolving relative dates."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0,
        max_tokens=300,
    )

    content = response.choices[0].message.content.strip()

    # Handle accidental markdown code fences.
    if content.startswith("```"):
        content = (
            content.replace("```json", "")
            .replace("```", "")
            .strip()
        )

    return json.loads(content)