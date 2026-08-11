import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("");
const [priorityFilter, setPriorityFilter] = useState("");
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
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
const [smartSort, setSmartSort] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "",
    due_date: "",
  });
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

    setTaskBreakdowns((prev) => ({
      ...prev,
      [task.id]: data.subtasks || [],
    }));
  } catch (err) {
    console.error("Failed to generate task breakdown:", err);
    setError("AI could not break down this task.");
  } finally {
    setBreakdownTaskId(null);
  }
};
  const calculatePriorityScore = async (task) => {
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
};

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/tasks`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

setTasks(data);
setError(null);

// Calculate AI priority scores for all tasks
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
      setError("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const createTask = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      return;
    }

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
        const details = await response.text();
        throw new Error(details);
      }

      setForm({
        title: "",
        description: "",
        priority: "Medium",
        category: "",
        due_date: "",
      });

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

  if (!confirmed) {
    return;
  }

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

  if (!editingTask.title.trim()) {
    return;
  }

  try {
    setUpdating(true);
    setError(null);

    const payload = {
      title: editingTask.title.trim(),
      description: editingTask.description?.trim() || null,
      priority: editingTask.priority,
      category: editingTask.category?.trim() || null,
      due_date: editingTask.due_date || null,
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
const parseTaskWithAI = async () => {
  if (!aiTaskText.trim()) {
    return;
  }

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

    // If AI didn't return a due date, handle common natural-language dates.
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

    // Create the task directly in the backend.
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

    // Clear AI input.
    setAiTaskText("");

    // Close the normal task form if it was open.
    setShowForm(false);

    // Refresh tasks from the database.
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
      `- ${task.title} | Status: ${task.status} | Priority: ${task.priority} | Category: ${task.category || "General"} | Due: ${
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
      body: JSON.stringify({
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    setAiResponse(data.response);
  } catch (err) {
    console.error(err);
    setError("AI Assistant could not connect to the AI service.");
  } finally {
    setAiLoading(false);
  }
};
  const filteredTasks = tasks
  .filter((task) => {
    const matchesSearch =
      !search ||
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      !statusFilter || task.status === statusFilter;

    const matchesPriority =
      !priorityFilter || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  })
  .sort((a, b) => {
    if (!smartSort) {
      return 0;
    }

    // Keep completed tasks at the bottom.
    if (a.status === "Completed" && b.status !== "Completed") {
      return 1;
    }

    if (a.status !== "Completed" && b.status === "Completed") {
      return -1;
    }

    // Higher AI score first.
    const scoreA = priorityScores[a.id] ?? -1;
    const scoreB = priorityScores[b.id] ?? -1;

    return scoreB - scoreA;
  });

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>Smart Task AI</h1>
          <p>AI-powered task management for smarter productivity.</p>
        </div>
      </header>

      <main className="container">
        <section className="stats">
          <div className="stat-card">
            <span>Total Tasks</span>
            <strong>{tasks.length}</strong>
          </div>

          <div className="stat-card">
            <span>Pending</span>
            <strong>
              {tasks.filter((task) => task.status === "Pending").length}
            </strong>
          </div>

          <div className="stat-card">
            <span>Completed</span>
            <strong>
              {tasks.filter((task) => task.status === "Completed").length}
            </strong>
          </div>

          <div className="stat-card">
            <span>High Priority</span>
            <strong>
              {tasks.filter((task) => task.priority === "High").length}
            </strong>
          </div>
        </section>

        <section className="tasks-section">
          <div className="section-header">
            <div>
              <h2>Your Tasks</h2>
              <p>Manage and prioritize your work.</p>
            </div>

            <div>
  <button onClick={fetchTasks}>↻ Refresh</button>

  <button
    onClick={() => setShowForm((previous) => !previous)}
    style={{ marginLeft: "10px" }}
  >
    + New Task
  </button>

  <button
    onClick={() => {
      setAiOpen((previous) => !previous);
      if (!aiOpen) {
        askAI();
      }
    }}
    style={{ marginLeft: "10px" }}
  >
    ✨ AI Assistant
  </button> 
</div>
          </div>
                    <div className="ai-task-creator">
            <div className="ai-task-header">
              <div>
                <h3>✨ Create Task with AI</h3>
                <p>
                  Describe your task naturally and let AI extract the details.
                </p>
              </div>
            </div>

            <div className="ai-task-input">
              <input
                type="text"
                value={aiTaskText}
                onChange={(event) => setAiTaskText(event.target.value)}
                placeholder="e.g. Prepare ADROSONIC demo tomorrow, high priority, work"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    parseTaskWithAI();
                  }
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

          
                    <div className="filter-bar">
                      {aiOpen && (
  <div className="ai-panel">
    <h3>✨ Smart Task AI Assistant</h3>

    {aiLoading ? (
      <p>Analyzing your tasks...</p>
    ) : (
      <p style={{ whiteSpace: "pre-wrap" }}>
        {aiResponse || "Click the AI Assistant button to analyze your tasks."}
      </p>
    )}

    <button
      type="button"
      onClick={askAI}
      disabled={aiLoading}
    >
      {aiLoading ? "Analyzing..." : "↻ Analyze Again"}
    </button>
  </div>
)}
            <input
              type="text"
              placeholder="🔎 Search tasks..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

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

            {(search || statusFilter || priorityFilter) && (
  <button
    type="button"
    onClick={() => {
      setSearch("");
      setStatusFilter("");
      setPriorityFilter("");
    }}
  >
    Clear Filters
  </button>
)}

<button
  type="button"
  onClick={() => setSmartSort((previous) => !previous)}
>
  {smartSort ? "🧠 Smart Sort: ON" : "🧠 Smart Sort"}
</button>

</div>

{editingTask && (
  <form className="task-form" onSubmit={updateTask}>
    <h3>Edit task</h3>

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
        type="button"
        onClick={() => setEditingTask(null)}
      >
        Cancel
      </button>

      <button type="submit" disabled={updating}>
        {updating ? "Saving..." : "Save Changes"}
      </button>
    </div>
  </form>
)}

          {showForm && (
            <form className="task-form" onSubmit={createTask}>
              <h3>Create a new task</h3>

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
                  type="button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          )}

          {loading && <p>Loading tasks...</p>}

          {error && <p className="error">{error}</p>}

          {!loading && !error && tasks.length === 0 && (
            <div className="empty-state">
              <h3>No tasks yet</h3>
              <p>Create your first task to get started.</p>
            </div>
          )}

          <div className="task-list">
            {filteredTasks.map((task) => (
              <article className="task-card" key={task.id}>
                <div className="task-main">
                  <h3>{task.title}</h3>

                  {task.description && <p>{task.description}</p>}

                <div className="task-meta">
  <span>{task.category || "General"}</span>
  <span>{task.status}</span>

  {task.due_date && (
    <span>
      Due:{" "}
      {new Date(task.due_date).toLocaleDateString()}
    </span>
  )}

  {task.status !== "Completed" &&
  priorityScores[task.id] !== undefined && (
    <span>
      🧠 AI Score: <strong>{priorityScores[task.id]}/100</strong>
    </span>
  )}
</div>

{taskBreakdowns[task.id]?.length > 0 && (
  <div className="task-breakdown">
    <h4>✨ AI Task Breakdown</h4>

    <ol>
      {taskBreakdowns[task.id].map((subtask, index) => (
        <li key={index}>{subtask}</li>
      ))}
    </ol>
  </div>
)}

</div>

<div className="task-actions">
  <span
    className={`priority ${task.priority.toLowerCase()}`}
  >
    {task.priority}
  </span>

  {task.status !== "Completed" && (
    <button
      className="breakdown-button"
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
    onClick={() =>
      setEditingTask({
        ...task,
        due_date: task.due_date
          ? task.due_date.slice(0, 16)
          : "",
      })
    }
  >
    Edit
  </button>

  {task.status !== "Completed" && (
    <button
      className="complete-button"
      onClick={() => completeTask(task.id)}
    >
      ✓ Complete
    </button>
  )}

  <button
    className="delete-button"
    onClick={() => deleteTask(task.id)}
  >
    Delete
  </button>
</div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;