import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "Medium",
  category: "",
  due_date: "",
};

function formatDueDate(value) {
  if (!value) return "No deadline";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toLocalDateTimeInput(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (number) => String(number).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}

function getDueState(task) {
  if (!task.due_date || task.status === "Completed") {
    return "normal";
  }

  const due = new Date(task.due_date);
  if (Number.isNaN(due.getTime())) return "normal";

  const now = new Date();
  const diff = due.getTime() - now.getTime();

  if (diff < 0) return "overdue";
  if (diff <= 48 * 60 * 60 * 1000) return "soon";

  return "normal";
}

function getDueLabel(task) {
  if (!task.due_date) return "No deadline";

  const state = getDueState(task);

  if (state === "overdue") return `Overdue · ${formatDueDate(task.due_date)}`;
  if (state === "soon") return `Due soon · ${formatDueDate(task.due_date)}`;

  return `Due · ${formatDueDate(task.due_date)}`;
}

function getScoreLabel(score) {
  if (score >= 90) return "Critical";
  if (score >= 75) return "High";
  if (score >= 50) return "Moderate";
  return "Low";
}

function cleanAIText(text) {
  return (text || "")
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .trim();
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [editingTask, setEditingTask] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  const [aiTaskText, setAiTaskText] = useState("");
  const [aiParsing, setAiParsing] = useState(false);

  const [priorityScores, setPriorityScores] = useState({});
  const [breakdownTaskId, setBreakdownTaskId] = useState(null);
  const [taskBreakdowns, setTaskBreakdowns] = useState({});
  const [smartSort, setSmartSort] = useState(true);

  const calculatePriorityScore = useCallback(async (task) => {
    try {
      const response = await fetch(`${API_URL}/api/ai/priority-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          status: task.status,
          due_date: task.due_date || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      return data.score;
    } catch (err) {
      console.error("Failed to calculate AI priority score:", err);
      return null;
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/tasks`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setTasks(data);

      const scores = {};

      await Promise.all(
        data
          .filter((task) => task.status !== "Completed")
          .map(async (task) => {
            const score = await calculatePriorityScore(task);

            if (score !== null) {
              scores[task.id] = score;
            }
          })
      );

      setPriorityScores(scores);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the backend. Make sure FastAPI is running.");
    } finally {
      setLoading(false);
    }
  }, [calculatePriorityScore]);

  useEffect(() => {
  // Initial data synchronization with the backend.
  // fetchTasks updates local React state from the external API.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchTasks();
}, [fetchTasks]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const createTask = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) return;

    try {
      setCreating(true);
      setError(null);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        category: form.category.trim() || null,
        due_date: form.due_date
          ? new Date(form.due_date).toISOString()
          : null,
      };

      const response = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setForm(EMPTY_FORM);
      setShowForm(false);
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError("Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  const completeTask = async (taskId) => {
    try {
      setError(null);

      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Completed",
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError("Failed to complete task.");
    }
  };

  const deleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      setError(null);

      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError("Failed to delete task.");
    }
  };

  const updateTask = async (event) => {
    event.preventDefault();

    if (!editingTask?.title?.trim()) return;

    try {
      setUpdating(true);
      setError(null);

      const payload = {
        title: editingTask.title.trim(),
        description: editingTask.description?.trim() || null,
        priority: editingTask.priority,
        category: editingTask.category?.trim() || null,
        due_date: editingTask.due_date
          ? new Date(editingTask.due_date).toISOString()
          : null,
      };

      const response = await fetch(
        `${API_URL}/api/tasks/${editingTask.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setEditingTask(null);
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError("Failed to update task.");
    } finally {
      setUpdating(false);
    }
  };

  const breakdownTaskWithAI = async (task) => {
    try {
      setBreakdownTaskId(task.id);
      setError(null);

      const response = await fetch(`${API_URL}/api/ai/breakdown-task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description || "",
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      setTaskBreakdowns((previous) => ({
        ...previous,
        [task.id]: data.subtasks || [],
      }));
    } catch (err) {
      console.error("Failed to generate task breakdown:", err);
      setError("AI could not break down this task.");
    } finally {
      setBreakdownTaskId(null);
    }
  };

  const parseTaskWithAI = async () => {
    if (!aiTaskText.trim()) return;

    try {
      setAiParsing(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/ai/parse-task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: aiTaskText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      const task = data.task || data;

      let dueDate = task.due_date || null;
      const lowerText = aiTaskText.toLowerCase();

      if (!dueDate && lowerText.includes("tomorrow")) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 0, 0);
        dueDate = tomorrow.toISOString();
      }

      if (!dueDate && lowerText.includes("today")) {
        const today = new Date();
        today.setHours(23, 59, 0, 0);
        dueDate = today.toISOString();
      }

      const payload = {
        title: task.title || "Untitled Task",
        description: task.description || null,
        priority: task.priority || "Medium",
        category: task.category || null,
        due_date: dueDate,
      };

      const createResponse = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!createResponse.ok) {
        throw new Error(await createResponse.text());
      }

      setAiTaskText("");
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError("AI could not create the task.");
    } finally {
      setAiParsing(false);
    }
  };

  const askAI = async () => {
    try {
      setAiLoading(true);
      setAiResponse("");
      setError(null);

      if (tasks.length === 0) {
        setAiResponse("You don't have any tasks yet. Create a task first.");
        return;
      }

      const taskContext = tasks
        .map(
          (task) =>
            `- ${task.title} | Status: ${task.status} | Priority: ${
              task.priority
            } | Category: ${
              task.category || "General"
            } | Due: ${
              task.due_date
                ? new Date(task.due_date).toLocaleString()
                : "No deadline"
            } | Description: ${task.description || "None"}`
        )
        .join("\n");

      const prompt = `
You are the AI productivity assistant inside Smart Task AI.

Analyze the user's current tasks and act as an intelligent productivity manager.

Consider:
- Priority
- Current status
- Due dates
- Overdue tasks
- Tasks due soon
- Project importance
- Potential risk of missing deadlines

Current tasks:
${taskContext}

Provide:

1. The single task that should be prioritized first and explain why.
2. Identify any overdue or deadline-sensitive tasks.
3. Identify any high-priority tasks that are still pending.
4. Give one practical recommendation for improving the user's workload.

Do not simply rank tasks by priority.
Use deadlines and task status to determine urgency.

Keep the response concise, practical, and actionable.
`;

      const response = await fetch(`${API_URL}/api/ai/assist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setAiResponse(data.response || "No recommendation was returned.");
    } catch (err) {
      console.error(err);
      setError("AI Assistant could not connect to the AI service.");
    } finally {
      setAiLoading(false);
    }
  };

  const stats = useMemo(() => {
    const pending = tasks.filter((task) => task.status === "Pending");
    const completed = tasks.filter((task) => task.status === "Completed");
    const highPriority = tasks.filter((task) => task.priority === "High");
    const overdue = pending.filter((task) => getDueState(task) === "overdue");
    const dueSoon = pending.filter((task) => getDueState(task) === "soon");

    return {
      total: tasks.length,
      pending: pending.length,
      completed: completed.length,
      highPriority: highPriority.length,
      overdue: overdue.length,
      dueSoon: dueSoon.length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        (task.description || "").toLowerCase().includes(query) ||
        (task.category || "").toLowerCase().includes(query);

      const matchesStatus =
        !statusFilter || task.status === statusFilter;

      const matchesPriority =
        !priorityFilter || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    if (!smartSort) return result;

    return [...result].sort((a, b) => {
      if (a.status === "Completed" && b.status !== "Completed") return 1;
      if (a.status !== "Completed" && b.status === "Completed") return -1;

      const dueA = getDueState(a);
      const dueB = getDueState(b);

      const urgency = {
        overdue: 3,
        soon: 2,
        normal: 1,
      };

      if (urgency[dueA] !== urgency[dueB]) {
        return urgency[dueB] - urgency[dueA];
      }

      const scoreA = priorityScores[a.id] ?? -1;
      const scoreB = priorityScores[b.id] ?? -1;

      return scoreB - scoreA;
    });
  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
    smartSort,
    priorityScores,
  ]);

  const hasFilters = search || statusFilter || priorityFilter;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
  };

  const openEdit = (task) => {
    setEditingTask({
      ...task,
      due_date: toLocalDateTimeInput(task.due_date),
    });
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-glow header-glow-one" />
        <div className="header-glow header-glow-two" />

        <div className="header-content">
          <div className="brand-row">
            <div className="brand-mark">✦</div>
            <span className="eyebrow">AI PRODUCTIVITY WORKSPACE</span>
          </div>

          <h1>Smart Task AI</h1>
          <p>
            AI-powered task management that understands urgency, deadlines,
            and workload context.
          </p>

          <div className="header-badges">
            <span>⚡ AI prioritization</span>
            <span>◈ Natural language</span>
            <span>✓ Smart workflow</span>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon">▦</div>
            <span>Total Tasks</span>
            <strong>{stats.total}</strong>
            <small>Your complete workload</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon">◷</div>
            <span>Pending</span>
            <strong>{stats.pending}</strong>
            <small>Still requiring action</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✓</div>
            <span>Completed</span>
            <strong>{stats.completed}</strong>
            <small>Work already finished</small>
          </div>

          <div className={`stat-card ${stats.overdue > 0 ? "stat-danger" : ""}`}>
            <div className="stat-icon">!</div>
            <span>High Priority</span>
            <strong>{stats.highPriority}</strong>
            <small>
              {stats.overdue > 0
                ? `${stats.overdue} overdue · ${stats.dueSoon} due soon`
                : `${stats.dueSoon} deadline-sensitive`}
            </small>
          </div>
        </section>

        <section className="tasks-section">
          <div className="section-header">
            <div>
              <span className="section-kicker">WORKSPACE</span>
              <h2>Your Tasks</h2>
              <p>Manage work, then let AI help you decide what matters next.</p>
            </div>

            <div className="header-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={fetchTasks}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "↻ Refresh"}
              </button>

              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setShowForm((previous) => !previous);
                  setEditingTask(null);
                }}
              >
                + New Task
              </button>

              <button
                className={`ai-button ${aiOpen ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setAiOpen((previous) => !previous);
                  if (!aiOpen) askAI();
                }}
              >
                ✨ AI Assistant
              </button>
            </div>
          </div>

          <div className="ai-task-creator">
            <div className="ai-task-copy">
              <div className="ai-orb">✦</div>
              <div>
                <span className="section-kicker">AI TASK CREATION</span>
                <h3>Create a task naturally</h3>
                <p>
                  Describe what you need to do. AI extracts the task details
                  for you.
                </p>
              </div>
            </div>

            <div className="ai-task-input">
              <input
                type="text"
                value={aiTaskText}
                onChange={(event) => setAiTaskText(event.target.value)}
                placeholder="e.g. Prepare ADROSONIC demo tomorrow at 6 PM, high priority, work"
                onKeyDown={(event) => {
                  if (event.key === "Enter") parseTaskWithAI();
                }}
              />

              <button
                type="button"
                onClick={parseTaskWithAI}
                disabled={aiParsing || !aiTaskText.trim()}
              >
                {aiParsing ? "✨ Creating..." : "✨ Create with AI"}
              </button>
            </div>
          </div>

          {aiOpen && (
            <div className="ai-panel">
              <div className="ai-panel-header">
                <div>
                  <span className="section-kicker">INTELLIGENT INSIGHTS</span>
                  <h3>🧠 Productivity Assistant</h3>
                  <p>AI analysis of your current workload.</p>
                </div>

                <div className="ai-status">
                  <span className="status-dot" />
                  AI Ready
                </div>
              </div>

              {aiLoading ? (
                <div className="ai-loading">
                  <div className="loading-orb">✦</div>
                  <div>
                    <strong>Analyzing your workload...</strong>
                    <p>Checking deadlines, priority, status, and risk.</p>
                  </div>
                </div>
              ) : (
                <div className="ai-response">
                  {cleanAIText(aiResponse)
                    .split("\n")
                    .filter(Boolean)
                    .map((line, index) => (
                      <p key={`${line}-${index}`}>{line}</p>
                    ))}
                </div>
              )}

              <button
                className="secondary-button"
                type="button"
                onClick={askAI}
                disabled={aiLoading}
              >
                {aiLoading ? "Analyzing..." : "↻ Analyze Again"}
              </button>
            </div>
          )}

          <div className="filter-bar">
            <div className="search-wrapper">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search tasks, descriptions or categories..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            {hasFilters && (
              <button
                className="clear-button"
                type="button"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}

            <button
              className={`smart-sort-button ${smartSort ? "active" : ""}`}
              type="button"
              onClick={() => setSmartSort((previous) => !previous)}
            >
              🧠 Smart Sort {smartSort ? "ON" : ""}
            </button>
          </div>

          {editingTask && (
            <form className="task-form" onSubmit={updateTask}>
              <div className="form-heading">
                <div>
                  <span className="section-kicker">TASK EDITOR</span>
                  <h3>Edit task</h3>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setEditingTask(null)}
                  aria-label="Close edit form"
                >
                  ×
                </button>
              </div>

              <label>
                Title *
                <input
                  value={editingTask.title}
                  onChange={(event) =>
                    setEditingTask({
                      ...editingTask,
                      title: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={editingTask.description || ""}
                  onChange={(event) =>
                    setEditingTask({
                      ...editingTask,
                      description: event.target.value,
                    })
                  }
                  rows="3"
                />
              </label>

              <div className="form-row">
                <label>
                  Priority
                  <select
                    value={editingTask.priority}
                    onChange={(event) =>
                      setEditingTask({
                        ...editingTask,
                        priority: event.target.value,
                      })
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>

                <label>
                  Category
                  <input
                    value={editingTask.category || ""}
                    onChange={(event) =>
                      setEditingTask({
                        ...editingTask,
                        category: event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label>
                Due date
                <input
                  type="datetime-local"
                  value={editingTask.due_date || ""}
                  onChange={(event) =>
                    setEditingTask({
                      ...editingTask,
                      due_date: event.target.value,
                    })
                  }
                />
              </label>

              <div className="form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>

                <button className="primary-button" type="submit" disabled={updating}>
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {showForm && (
            <form className="task-form" onSubmit={createTask}>
              <div className="form-heading">
                <div>
                  <span className="section-kicker">TASK CREATION</span>
                  <h3>Create a new task</h3>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setShowForm(false)}
                  aria-label="Close task form"
                >
                  ×
                </button>
              </div>

              <label>
                Title *
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Prepare project presentation"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe what needs to be done..."
                  rows="3"
                />
              </label>

              <div className="form-row">
                <label>
                  Priority
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>

                <label>
                  Category
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="Work"
                  />
                </label>
              </div>

              <label>
                Due date
                <input
                  type="datetime-local"
                  name="due_date"
                  value={form.due_date}
                  onChange={handleChange}
                />
              </label>

              <div className="form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button className="primary-button" type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="error-banner">
              <span>!</span>
              <div>
                <strong>Something went wrong</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <h3>Loading your workspace</h3>
              <p>Fetching tasks and calculating AI priorities...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <h3>No tasks yet</h3>
              <p>
                Create your first task manually or describe it above and let
                AI build it for you.
              </p>
              <button
                className="primary-button"
                type="button"
                onClick={() => setShowForm(true)}
              >
                + Create First Task
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state compact">
              <div className="empty-icon">⌕</div>
              <h3>No matching tasks</h3>
              <p>Try changing your search or filters.</p>
              <button
                className="secondary-button"
                type="button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="task-list">
              {filteredTasks.map((task) => {
                const dueState = getDueState(task);
                const score = priorityScores[task.id];

                return (
                  <article
                    className={`task-card task-${dueState} ${
                      task.status === "Completed" ? "task-completed" : ""
                    }`}
                    key={task.id}
                  >
                    <div className="task-accent" />

                    <div className="task-main">
                      <div className="task-title-row">
                        <div>
                          <div className="task-eyebrow">
                            {task.category || "General"}
                          </div>
                          <h3>{task.title}</h3>
                        </div>

                        <span
                          className={`priority ${task.priority.toLowerCase()}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {task.description && <p>{task.description}</p>}

                      <div className="task-meta">
                        <span
                          className={
                            task.status === "Completed"
                              ? "meta-completed"
                              : ""
                          }
                        >
                          {task.status === "Completed" ? "✓ " : "◷ "}
                          {task.status}
                        </span>

                        {task.due_date && (
                          <span className={`due-${dueState}`}>
                            {dueState === "overdue"
                              ? "⚠ "
                              : dueState === "soon"
                              ? "⏱ "
                              : "◷ "}
                            {getDueLabel(task)}
                          </span>
                        )}

                        {score !== undefined && task.status !== "Completed" && (
                          <span className="ai-score">
                            ✦ AI Score <strong>{score}/100</strong>
                            <small>{getScoreLabel(score)}</small>
                          </span>
                        )}
                      </div>

                      {taskBreakdowns[task.id]?.length > 0 && (
                        <div className="task-breakdown">
                          <div className="breakdown-header">
                            <h4>✨ AI Task Breakdown</h4>
                            <span>
                              {taskBreakdowns[task.id].length} steps
                            </span>
                          </div>

                          <ol>
                            {taskBreakdowns[task.id].map((subtask, index) => (
                              <li key={`${task.id}-${index}`}>{subtask}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>

                    <div className="task-actions">
                      {task.status !== "Completed" && (
                        <button
                          className="breakdown-button"
                          type="button"
                          onClick={() => breakdownTaskWithAI(task)}
                          disabled={breakdownTaskId === task.id}
                        >
                          {breakdownTaskId === task.id
                            ? "✨ Thinking..."
                            : "✨ Break Down"}
                        </button>
                      )}

                      <button
                        className="edit-button"
                        type="button"
                        onClick={() => openEdit(task)}
                      >
                        Edit
                      </button>

                      {task.status !== "Completed" && (
                        <button
                          className="complete-button"
                          type="button"
                          onClick={() => completeTask(task.id)}
                        >
                          ✓ Complete
                        </button>
                      )}

                      <button
                        className="delete-button"
                        type="button"
                        onClick={() => deleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <span>Smart Task AI</span>
        <span>AI-powered productivity workspace</span>
      </footer>
    </div>
  );
}

export default App;