from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..database import get_db


router = APIRouter(
    prefix="/api/tasks",
    tags=["Tasks"],
)


@router.post(
    "",
    response_model=schemas.TaskResponse,
    status_code=201,
)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
):
    return crud.create_task(db, task)


@router.get(
    "",
    response_model=list[schemas.TaskResponse],
)
def list_tasks(
    status: models.StatusEnum | None = None,
    priority: models.PriorityEnum | None = None,
    category: str | None = None,
    search: str | None = Query(
        default=None,
        description="Search title and description",
    ),
    db: Session = Depends(get_db),
):
    return crud.get_tasks(
        db=db,
        status=status,
        priority=priority,
        category=category,
        search=search,
    )


@router.get(
    "/{task_id}",
    response_model=schemas.TaskResponse,
)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
):
    task = crud.get_task(db, task_id)

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return task


@router.put(
    "/{task_id}",
    response_model=schemas.TaskResponse,
)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db),
):
    task = crud.update_task(
        db,
        task_id,
        task_update,
    )

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return task


@router.delete(
    "/{task_id}",
    status_code=204,
)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
):
    deleted = crud.delete_task(db, task_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return None