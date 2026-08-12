## 🚀 Live Demo

- **Live Application:** https://smart-task-ai-frontend.onrender.com
- **Backend API:** https://smart-task-ai-backend.onrender.com
- **API Documentation (Swagger):** https://smart-task-ai-backend.onrender.com/docs
- **GitHub Repository:** https://github.com/MOHAMMEDALI110-cloud/smart-task-ai

---






# 🧠 Smart Task AI

An AI-powered task management system that combines traditional task management with intelligent task understanding, AI-assisted prioritization, natural-language task creation, task breakdown, and productivity assistance.

## 🚀 Overview

Smart Task AI helps users create, organize, prioritize, and manage tasks while using AI to understand natural-language requests and provide intelligent productivity recommendations.

Unlike a traditional CRUD-based task manager, Smart Task AI uses task context such as priority, status, deadlines, and AI-generated priority scores to help users identify and focus on the most important work.

## ✨ Key Features

### 📋 Core Task Management

- Create tasks
- Edit tasks
- Complete tasks
- Delete tasks
- Search tasks
- Filter by status
- Filter by priority
- Persistent task storage using SQLite

### 🤖 AI-Powered Features

#### Natural-Language Task Creation

Convert natural-language instructions into structured tasks.

The AI extracts:

- Title
- Description
- Priority
- Category
- Due date

**Example:**

> Prepare the ADROSONIC final demo tomorrow at 6 PM, make it high priority and categorize it as work.

The system converts the request into a structured task with the appropriate deadline, priority, and category.

#### 🧠 AI Priority Scoring

Each task can receive an AI-assisted priority score from 0–100.

The scoring system considers task information such as:

- Priority
- Status
- Description
- Due date
- Urgency

These scores are used by Smart Sort to help prioritize active work.

#### 🧠 Smart Sort

Smart Sort automatically orders tasks using AI priority scores.

The system:

1. Keeps pending tasks above completed tasks.
2. Orders active tasks using their AI priority scores.
3. Helps users focus on the most important work first.

#### ✨ AI Productivity Assistant

The AI Assistant analyzes the user's current workload and provides practical recommendations.

It can:

- Identify the task that should be prioritized first.
- Detect overdue or deadline-sensitive tasks.
- Identify high-priority pending work.
- Recommend ways to improve workload management.

The assistant uses the actual task context rather than generating generic productivity advice.

#### 🧩 AI Task Breakdown

Complex tasks can be analyzed and converted into smaller actionable steps.

This helps users transform large tasks into manageable pieces of work.

#### 📅 Natural-Language Date Understanding

The AI parser understands relative dates such as:

- Today
- Tomorrow
- The day after tomorrow
- Next Monday
- Next week
- In 3 days

It also understands natural-language times such as:

- At 6 PM
- At 18:00
- Tomorrow evening

Relative dates are resolved using the current date and time supplied to the AI parser.

If no deadline is mentioned, the system does not invent one.

## 🏗️ Architecture

```text
                         ┌─────────────────────┐
                         │     React / Vite    │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │
                             REST API / HTTP
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       FastAPI       │
                         │       Backend       │
                         └──────────┬──────────┘
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
                   ▼                ▼                ▼
            ┌────────────┐   ┌──────────────┐   ┌─────────────┐
            │   SQLite   │   │  AI Services │   │ Task / CRUD │
            │  Database  │   │              │   │    Logic    │
            └────────────┘   └──────┬───────┘   └─────────────┘
                                    │
                                    ▼
                              ┌─────────────┐
                              │  Groq LLM   │
                              └─────────────┘
```

### 🔄 AI Workflow

```text
                  Natural Language Request
                            │
                            ▼
                     ┌──────────────┐
                     │  AI Parser   │
                     └──────┬───────┘
                            │
                            ▼
                   Structured Task Data
                            │
                            ▼
                     ┌──────────────┐
                     │   FastAPI    │
                     └──────┬───────┘
                            │
                            ▼
                         SQLite DB
                            │
                            ▼
                   AI Priority Scoring
                            │
                            ▼
                       Smart Sort
                            │
                            ▼
                  Productivity Assistant
```

## 🛠️ Tech Stack

### Frontend

- React 19
- React DOM
- Vite
- JavaScript
- CSS

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- SQLAlchemy
- SQLite

### AI

- Groq API
- LLM-based task extraction
- AI priority scoring
- AI productivity assistance
- AI task breakdown
- Natural-language date interpretation

### Development

- Git
- GitHub
- REST APIs
- ESLint

## 📁 Project Structure

```text
smart-task-ai/
│
├── backend/
│   ├── requirements.txt
│   │
│   └── app/
│       ├── ai/
│       │   ├── __init__.py
│       │   ├── router.py
│       │   ├── service.py
│       │   └── task_parser.py
│       │
│       ├── routers/
│       │   ├── __init__.py
│       │   ├── ai.py
│       │   └── tasks.py
│       │
│       ├── crud.py
│       ├── database.py
│       ├── main.py
│       ├── models.py
│       └── schemas.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites

Make sure the following are installed:

- Python
- Node.js
- npm
- Git
- A Groq API key

### 1. Clone the repository

```bash
git clone https://github.com/MOHAMMEDALI110-cloud/smart-task-ai.git
cd smart-task-ai
```

### 2. Backend Setup

Create the Python virtual environment:

```powershell
python -m venv backend\.venv
```

Activate it:

```powershell
.\backend\.venv\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
pip install -r backend\requirements.txt
```

### 3. Configure the Groq API Key

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
```

> **Important:** Do not commit this file to GitHub.

The `.env` file is excluded through `.gitignore`.

### 4. Start the Backend

From the project root:

```bash
uvicorn backend.app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

### 5. Frontend Setup

Open a second terminal.

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## 🔌 API Endpoints

### Task Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Retrieve all tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/{task_id}` | Update a task |
| DELETE | `/api/tasks/{task_id}` | Delete a task |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/assist` | Analyze current tasks and provide productivity recommendations |
| POST | `/api/ai/parse-task` | Convert natural language into structured task data |
| POST | `/api/ai/priority-score` | Generate an AI-assisted task priority score |
| POST | `/api/ai/breakdown-task` | Break complex tasks into actionable steps |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Backend health check |

## 🎯 Example AI Interaction

### User Input

> Prepare the ADROSONIC final demo tomorrow at 6 PM, make it high priority and categorize it as work.

### AI-Generated Task

- **Title:** ADROSONIC Final Demo
- **Priority:** High
- **Category:** Work
- **Due Date:** Tomorrow at 6 PM

The task is then persisted through the FastAPI backend and can receive an AI priority score.

## 🧠 Example Productivity Flow

```text
User creates tasks
        │
        ▼
AI understands task context
        │
        ▼
AI generates priority scores
        │
        ▼
Smart Sort prioritizes active work
        │
        ▼
AI Assistant analyzes workload
        │
        ▼
User receives actionable recommendations
```

## 🔐 Security

- API credentials are stored in environment variables.
- `.env` is excluded from version control.
- Local database files are excluded from version control.
- Python virtual environments are excluded from version control.
- Generated Python cache files are excluded from version control.

> **Never commit API keys or other secrets to GitHub.**

## 🧪 Validation

The following workflows have been manually validated during development:

- Task creation
- Task editing
- Task completion
- Task deletion
- Task persistence after browser refresh
- Search
- Status filtering
- Priority filtering
- Smart Sort
- AI task parsing
- AI priority scoring
- AI task breakdown
- AI productivity assistant
- Natural-language relative date parsing
- Handling requests with no due date
- Backend health check
- Frontend-to-backend API communication

## 🔮 Future Improvements

Potential production enhancements include:

- User authentication and authorization
- PostgreSQL for production database workloads
- Background AI processing
- Task notifications and reminders
- Calendar integration
- AI-generated daily planning
- Productivity analytics dashboard
- Docker-based deployment
- Cloud deployment
- Automated testing and CI/CD

## 👨‍💻 Project

Smart Task AI demonstrates practical full-stack software engineering combined with AI/LLM integration.

The project focuses on turning natural-language task descriptions into structured, persistent tasks and using AI-driven context to improve prioritization and productivity.
