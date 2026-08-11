from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import Session

from . import models, schemas


def create_task(
    db: Session,
    task: schemas.TaskCreate,
) -> models.Task:
    db_task = models.Task(
        title=task.title,
        description=task.description,
        priority=task.priority,
        category=task.category,
        due_date=task.due_date,
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return db_task


def get_task(
    db: Session,
    task_id: int,
) -> models.Task | None:
    return (
        db.query(models.Task)
        .filter(models.Task.id == task_id)
        .first()
    )


def get_tasks(
    db: Session,
    status: models.StatusEnum | None = None,
    priority: models.PriorityEnum | None = None,
    category: str | None = None,
    search: str | None = None,
) -> list[models.Task]:

    query = db.query(models.Task)

    if status is not None:
        query = query.filter(models.Task.status == status)

    if priority is not None:
        query = query.filter(models.Task.priority == priority)

    if category:
        query = query.filter(
            models.Task.category.ilike(f"%{category}%")
        )

    if search:
        search_pattern = f"%{search}%"

        query = query.filter(
            or_(
                models.Task.title.ilike(search_pattern),
                models.Task.description.ilike(search_pattern),
            )
        )

    return (
        query
        .order_by(models.Task.created_at.desc())
        .all()
    )


def update_task(
    db: Session,
    task_id: int,
    task_update: schemas.TaskUpdate,
) -> models.Task | None:

    db_task = get_task(db, task_id)

    if db_task is None:
        return None

    update_data = task_update.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(db_task, field, value)

    db_task.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_task)

    return db_task


def delete_task(
    db: Session,
    task_id: int,
) -> bool:

    db_task = get_task(db, task_id)

    if db_task is None:
        return False

    db.delete(db_task)
    db.commit()

    return True