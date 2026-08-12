from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routers.ai import router as ai_router

from . import models
from .database import Base, engine
from .routers import tasks


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Smart Task AI",
    description=(
        "AI-powered task management system "
        "for the ADROSONIC Application Services assessment."
    ),
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://smart-task-ai-frontend.onrender.com",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(ai_router)


@app.get("/")
def root():
    return {
        "message": "Smart Task AI backend is running!",
        "status": "healthy",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }