import { useEffect, useState } from "react";
import {
  getFocusTasks,
  getRandomFocusTasks,
  createTask,
  completeTask,
} from "./api";

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSize, setNewSize] = useState("tiny");

  async function loadFocusTasks() {
    try {
      setLoading(true);
      setError("");
      const data = await getFocusTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function loadRandomFocusTasks() {
    try {
      setLoading(true);
      setError("");
      const data = await getRandomFocusTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setLoading(true);
      setError("");
      const created = await createTask({
        title: newTitle.trim(),
        size: newSize,
        category: "general",
        importance: 1,
        due_date: null,
      });
      setTasks((prev) => [...prev, created]);
      setNewTitle("");
    } catch (err) {
      setError(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(id) {
    try {
      setLoading(true);
      setError("");
      const updated = await completeTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== updated.id));
    } catch (err) {
      setError(err.message || "Failed to complete task");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFocusTasks();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "system-ui",
        background: "#0f172a",
        color: "#f9fafb",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "#020617",
          padding: "1.5rem",
          borderRadius: "1rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
          ADHDaily – Focus Tasks
        </h1>
        <p style={{ marginBottom: "1rem", color: "#9ca3af" }}>
          Tiny tasks to help Future You 💛
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            onClick={loadFocusTasks}
            disabled={loading}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              border: "none",
              background: "#6366f1",
              color: "white",
            }}
          >
            Load focus tasks
          </button>

          <button
            onClick={loadRandomFocusTasks}
            disabled={loading}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              border: "none",
              background: "#22c55e",
              color: "white",
            }}
          >
            Pick 3 random focus tasks
          </button>
        </div>

        {loading && (
          <p style={{ color: "#a5b4fc", marginBottom: "0.75rem" }}>
            Loading…
          </p>
        )}
        {error && (
          <p style={{ color: "#f97373", marginBottom: "0.75rem" }}>
            {error}
          </p>
        )}

        <form
          onSubmit={handleCreateTask}
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="New task…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{
              flex: "1 1 200px",
              padding: "0.5rem 0.75rem",
              borderRadius: "999px",
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#f9fafb",
            }}
          />

          <select
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "999px",
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#f9fafb",
            }}
          >
            <option value="tiny">tiny</option>
            <option value="medium">medium</option>
            <option value="big">big</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              border: "none",
              background: "#ec4899",
              color: "white",
            }}
          >
            Add task
          </button>
        </form>

        <div>
          {tasks.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No tasks yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {tasks.map((task) => (
                <li
                  key={task.id}
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #1f2937",
                    background: "#020617",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{task.title}</div>
                    <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                      size: {task.size} · status: {task.status}
                    </div>
                  </div>

                  {task.status === "pending" && (
                    <button
                      onClick={() => handleComplete(task.id)}
                      disabled={loading}
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        border: "none",
                        background: "#16a34a",
                        color: "white",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      Done
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

