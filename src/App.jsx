import { useEffect, useState } from "react";
import {
  getFocusTasks,
  createTask,
  completeTask,
  getCompletedTasks,
} from "./api";

function App() {
  // non-routine tasks shown in “Energy‑matched tasks”
  const [tasks, setTasks] = useState([]);
  // pinned routines shown in their own section
  const [routineTasks, setRoutineTasks] = useState([]);
  const [historyTasks, setHistoryTasks] = useState([]);

  // screens: "home" | "focus" | "history"
  const [currentScreen, setCurrentScreen] = useState("home");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSize, setNewSize] = useState("tiny");
  const [completedThisSession, setCompletedThisSession] = useState(0);

  // energy / mood: low, medium, high
  const [energy, setEnergy] = useState("medium");

  // points system
  const [points, setPoints] = useState(0);

  // routine fields for new tasks
  const [isRoutine, setIsRoutine] = useState(false);
  const [recurrence, setRecurrence] = useState("daily"); // "daily" | "weekly" | "monthly"

  // ─────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────

  // Heuristic: guess if a task is a routine even if backend didn’t store it
  function normalizeTaskFromBackend(task) {
    const title = (task.title || "").toLowerCase();

    const looksRoutineByTitle = [
      "brush teeth",
      "brush my teeth",
      "load the dish washer",
      "load the dishwasher",
      "unload the dishwasher",
      "dishes",
      "laundry",
      "make bed",
      "make the bed",
      "wipe counters",
      "put baby clothes in the hamper",
      "baby clothes",
      "sort documents for 10 minutes",
      "sort documents",
      "brain dump for 5 minutes",
      "brain dump",
    ].some((pattern) => title.includes(pattern));

    const isRoutineFlag =
      task.is_routine || task.category === "routine" || looksRoutineByTitle;

    const normalized = {
      ...task,
      is_routine: Boolean(isRoutineFlag),
      category: isRoutineFlag
        ? task.category || "routine"
        : task.category || "general",
      recurrence: isRoutineFlag
        ? task.recurrence || "daily"
        : task.recurrence || null,
    };

    return normalized;
  }

  // Load ALL pending tasks, then split into routines + non‑routines
  async function loadFocusTasks() {
    try {
      setLoading(true);
      setError("");
      const raw = await getFocusTasks();
      const data = raw.map(normalizeTaskFromBackend); // automatic migration

      const routines = data.filter((t) => t.is_routine);
      const nonRoutines = data.filter((t) => !t.is_routine);

      setRoutineTasks(routines);
      setTasks(nonRoutines);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // pick tasks based on energy level (from non‑routine pool)
  function pickTasksForEnergy(allTasks, energyLevel) {
    const tiny = allTasks.filter((t) => t.size === "tiny");
    const medium = allTasks.filter((t) => t.size === "medium");
    const big = allTasks.filter((t) => t.size === "big");

    const firstN = (arr, n, excludeIds = []) =>
      arr.filter((t) => !excludeIds.includes(t.id)).slice(0, n);

    if (allTasks.length === 0) return [];

    if (energyLevel === "low") {
      if (tiny.length > 0) return tiny.slice(0, 3);
      return allTasks.slice(0, 3);
    }

    if (energyLevel === "medium") {
      const selected = [];
      if (medium.length > 0) selected.push(medium[0]);

      const remainingTiny = firstN(
        tiny,
        3 - selected.length,
        selected.map((t) => t.id)
      );
      selected.push(...remainingTiny);

      if (selected.length === 0) return allTasks.slice(0, 3);
      return selected.slice(0, 3);
    }

    // high energy
    const selected = [];
    if (tiny.length > 0) selected.push(tiny[0]);
    if (medium.length > 0) selected.push(medium[0]);
    if (big.length > 0) selected.push(big[0]);

    if (selected.length < 3) {
      const usedIds = selected.map((t) => t.id);
      const filler = firstN(allTasks, 3 - selected.length, usedIds);
      selected.push(...filler);
    }

    if (selected.length === 0) return allTasks.slice(0, 3);
    return selected.slice(0, 3);
  }

  // Load 3 non‑routine tasks for a given energy, keep routines pinned
  async function loadRandomFocusTasks(forEnergy) {
    const energyLevel = forEnergy || energy;
    try {
      setLoading(true);
      setError("");
      const raw = await getFocusTasks();
      const all = raw.map(normalizeTaskFromBackend); // automatic migration

      const routines = all.filter((t) => t.is_routine);
      const nonRoutines = all.filter((t) => !t.is_routine);

      const picked = pickTasksForEnergy(nonRoutines, energyLevel);

      setRoutineTasks(routines);
      setTasks(picked);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnergyClick(level, goToFocus) {
    setEnergy(level);
    if (goToFocus) {
      setCurrentScreen("focus");
    }
    await loadRandomFocusTasks(level);
  }

  async function loadHistoryTasks() {
    try {
      setLoading(true);
      setError("");
      const raw = await getCompletedTasks();
      const data = raw.map(normalizeTaskFromBackend);
      setHistoryTasks(data);
    } catch (err) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────
  // CREATE & COMPLETE & CONVERT & STARTERS
  // ─────────────────────────────────────

  async function handleCreateTask(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setLoading(true);
      setError("");

      const routineCategory = isRoutine ? "routine" : "general";

      // send to backend
      const created = await createTask({
        title: newTitle.trim(),
        size: newSize,
        category: routineCategory,
        importance: 1,
        due_date: null,
        is_routine: isRoutine,
        recurrence: isRoutine ? recurrence : null,
      });

      // ensure frontend has full flags
      const createdTask = normalizeTaskFromBackend({
        ...created,
        category: routineCategory,
        is_routine: isRoutine,
        recurrence: isRoutine ? recurrence : null,
      });

      if (createdTask.is_routine) {
        setRoutineTasks((prev) => [...prev, createdTask]);
      } else {
        setTasks((prev) => [...prev, createdTask]);
      }

      setNewTitle("");
      // optional:
      // setIsRoutine(false);
      // setRecurrence("daily");
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

      const target =
        tasks.find((t) => t.id === id) ||
        routineTasks.find((t) => t.id === id);

      const updated = await completeTask(id);

      setTasks((prev) => prev.filter((t) => t.id !== updated.id));
      setRoutineTasks((prev) => prev.filter((t) => t.id !== updated.id));

      setCompletedThisSession((count) => count + 1);

      let delta = 1;
      if (target?.size === "medium") delta = 2;
      else if (target?.size === "big") delta = 3;

      setPoints((prev) => prev + delta);
    } catch (err) {
      setError(err.message || "Failed to complete task");
    } finally {
      setLoading(false);
    }
  }

  // “Convert to routine” button (frontend only for now)
  function handleConvertToRoutine(task, newRecurrence = "daily") {
    const updated = {
      ...task,
      is_routine: true,
      category: "routine",
      recurrence: newRecurrence,
    };

    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setRoutineTasks((prev) => [...prev, updated]);

    // NOTE: this is UI‑only for now; later we can add a PATCH endpoint
  }

  // NEW: Add starter tasks (preset pack)
  async function handleAddStarterTasks() {
    try {
      setLoading(true);
      setError("");

      const starters = [
        {
          title: "Brush teeth",
          size: "tiny",
          isRoutine: true,
          recurrence: "daily",
        },
        {
          title: "Load the dishwasher",
          size: "tiny",
          isRoutine: true,
          recurrence: "daily",
        },
        {
          title: "Wipe counters",
          size: "tiny",
          isRoutine: true,
          recurrence: "daily",
        },
        {
          title: "Brain dump for 5 minutes",
          size: "tiny",
          isRoutine: false,
          recurrence: null,
        },
        {
          title: "Sort documents for 10 minutes",
          size: "medium",
          isRoutine: false,
          recurrence: null,
        },
        {
          title: "Reply to one important email",
          size: "tiny",
          isRoutine: false,
          recurrence: null,
        },
      ];

      const createdNormalized = [];

      for (const s of starters) {
        const routineCategory = s.isRoutine ? "routine" : "general";

        const created = await createTask({
          title: s.title,
          size: s.size,
          category: routineCategory,
          importance: 1,
          due_date: null,
          is_routine: s.isRoutine,
          recurrence: s.isRoutine ? s.recurrence : null,
        });

        const normalized = normalizeTaskFromBackend({
          ...created,
          category: routineCategory,
          is_routine: s.isRoutine,
          recurrence: s.isRoutine ? s.recurrence : null,
        });

        createdNormalized.push(normalized);
      }

      const newRoutines = createdNormalized.filter((t) => t.is_routine);
      const newNonRoutines = createdNormalized.filter((t) => !t.is_routine);

      setRoutineTasks((prev) => [...prev, ...newRoutines]);
      setTasks((prev) => [...prev, ...newNonRoutines]);
    } catch (err) {
      setError(err.message || "Failed to add starter tasks");
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────

  useEffect(() => {
    if (currentScreen === "history") {
      loadHistoryTasks();
    }
  }, [currentScreen]);

  // ─────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────

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
        {/* top nav */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1rem",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => setCurrentScreen("home")}
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              border: "none",
              fontSize: "0.8rem",
              background:
                currentScreen === "home" ? "#0ea5e9" : "transparent",
              color: currentScreen === "home" ? "white" : "#9ca3af",
              cursor: "pointer",
            }}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentScreen("focus")}
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              border: "none",
              fontSize: "0.8rem",
              background:
                currentScreen === "focus" ? "#6366f1" : "transparent",
              color: currentScreen === "focus" ? "white" : "#9ca3af",
              cursor: "pointer",
            }}
          >
            Focus
          </button>
          <button
            onClick={() => setCurrentScreen("history")}
            style={{
              padding: "0.25rem 0.75rem",
              borderRadius: "999px",
              border: "none",
              fontSize: "0.8rem",
              background:
                currentScreen === "history" ? "#22c55e" : "transparent",
              color: currentScreen === "history" ? "white" : "#9ca3af",
              cursor: "pointer",
            }}
          >
            History
          </button>
        </div>

        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>
          ADHDaily – Focus Tasks
        </h1>

        <p
          style={{
            marginBottom: "0.75rem",
            color: "#fde68a",
            fontSize: "0.9rem",
          }}
        >
          ⭐ Points today: {points}
        </p>

        {/* HOME SCREEN */}
        {currentScreen === "home" && (
          <>
            <p style={{ marginBottom: "0.75rem", color: "#9ca3af" }}>
              Tiny, realistic steps for overwhelmed brains. No shame, just
              gentle progress.
            </p>

            <div
              style={{
                padding: "1rem 1.25rem",
                borderRadius: "0.75rem",
                border: "1px solid #1f2937",
                background:
                  "radial-gradient(circle at top left, #1d2437, #020617)",
                marginBottom: "1.5rem",
              }}
            >
              <p
                style={{
                  marginBottom: "0.75rem",
                  color: "#e5e7eb",
                  fontSize: "0.95rem",
                }}
              >
                How&apos;s your energy right now?
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleEnergyClick("low", true)}
                  style={{
                    padding: "0.35rem 0.9rem",
                    borderRadius: "999px",
                    border: "1px solid #1f2937",
                    background:
                      energy === "low" ? "#0ea5e9" : "transparent",
                    color: energy === "low" ? "white" : "#e5e7eb",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  🧊 Low
                </button>
                <button
                  type="button"
                  onClick={() => handleEnergyClick("medium", true)}
                  style={{
                    padding: "0.35rem 0.9rem",
                    borderRadius: "999px",
                    border: "1px solid #1f2937",
                    background:
                      energy === "medium" ? "#6366f1" : "transparent",
                    color: energy === "medium" ? "white" : "#e5e7eb",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  🙂 Medium
                </button>
                <button
                  type="button"
                  onClick={() => handleEnergyClick("high", true)}
                  style={{
                    padding: "0.35rem 0.9rem",
                    borderRadius: "999px",
                    border: "1px solid #1f2937",
                    background:
                      energy === "high" ? "#f97316" : "transparent",
                    color: energy === "high" ? "white" : "#e5e7eb",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  🔥 High
                </button>
              </div>

              <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                We&apos;ll jump straight into 3 tasks that match this energy,
                so you don&apos;t have to choose.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setCurrentScreen("history")}
                style={{
                  padding: "0.6rem 1.4rem",
                  borderRadius: "999px",
                  border: "1px solid #1f2937",
                  background: "transparent",
                  color: "#e5e7eb",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                See what you&apos;ve already done
              </button>
            </div>
          </>
        )}

        {/* FOCUS SCREEN */}
        {currentScreen === "focus" && (
          <>
            <p style={{ marginBottom: "0.25rem", color: "#9ca3af" }}>
              Tiny tasks to help Future You 💛
            </p>

            <div
              style={{
                marginBottom: "0.75rem",
                fontSize: "0.85rem",
                color: "#9ca3af",
              }}
            >
              How&apos;s your energy right now?
            </div>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => handleEnergyClick("low", false)}
                style={{
                  padding: "0.35rem 0.9rem",
                  borderRadius: "999px",
                  border: "1px solid #1f2937",
                  background:
                    energy === "low" ? "#0ea5e9" : "transparent",
                  color: energy === "low" ? "white" : "#e5e7eb",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                🧊 Low
              </button>
              <button
                type="button"
                onClick={() => handleEnergyClick("medium", false)}
                style={{
                  padding: "0.35rem 0.9rem",
                  borderRadius: "999px",
                  border: "1px solid #1f2937",
                  background:
                    energy === "medium" ? "#6366f1" : "transparent",
                  color: energy === "medium" ? "white" : "#e5e7eb",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                🙂 Medium
              </button>
              <button
                type="button"
                onClick={() => handleEnergyClick("high", false)}
                style={{
                  padding: "0.35rem 0.9rem",
                  borderRadius: "999px",
                  border: "1px solid #1f2937",
                  background:
                    energy === "high" ? "#f97316" : "transparent",
                  color: energy === "high" ? "white" : "#e5e7eb",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                🔥 High
              </button>
            </div>

            <p
              style={{
                marginBottom: "1rem",
                color: "#a5b4fc",
                fontSize: "0.9rem",
              }}
            >
              Showing {tasks.length} energy task
              {tasks.length === 1 ? "" : "s"} · Pinned routines:{" "}
              {routineTasks.length} · Completed this session:{" "}
              {completedThisSession}
            </p>

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={loadFocusTasks}
                disabled={loading}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "999px",
                  border: "none",
                  background: "#6366f1",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Load all pending tasks
              </button>

              <button
                onClick={() => loadRandomFocusTasks()}
                disabled={loading}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "999px",
                  border: "none",
                  background: "#22c55e",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Pick 3 new tasks for this energy
              </button>

              {/* Show starter pack button only if no tasks yet */}
              {tasks.length === 0 && routineTasks.length === 0 && (
                <button
                  onClick={handleAddStarterTasks}
                  disabled={loading}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "999px",
                    border: "1px solid #facc15",
                    background: "transparent",
                    color: "#facc15",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Add starter tasks
                </button>
              )}
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

            {/* ADD TASK FORM */}
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

              {/* Routine toggle */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.85rem",
                  color: "#e5e7eb",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "999px",
                  border: "1px solid #1f2937",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isRoutine}
                  onChange={(e) => setIsRoutine(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                Routine task
              </label>

              {isRoutine && (
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "999px",
                    border: "1px solid #1f2937",
                    background: "#020617",
                    color: "#f9fafb",
                  }}
                >
                  <option value="daily">daily</option>
                  <option value="weekly">weekly</option>
                  <option value="monthly">monthly</option>
                </select>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "999px",
                  border: "none",
                  background: "#ec4899",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Add task
              </button>
            </form>

            {/* ROUTINE SECTION */}
            {routineTasks.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <h2
                  style={{
                    fontSize: "1rem",
                    marginBottom: "0.5rem",
                    color: "#facc15",
                  }}
                >
                  Daily / weekly routines
                </h2>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {routineTasks.map((task) => (
                    <li
                      key={task.id}
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "0.75rem",
                        border: "1px solid #facc15",
                        background: "#020617",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{task.title}</div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#facc15",
                          }}
                        >
                          routine · {task.recurrence || "custom"} · size:{" "}
                          {task.size} · status: {task.status}
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
              </div>
            )}

            {/* NON-ROUTINE / ENERGY TASKS SECTION */}
            <div>
              <h2
                style={{
                  fontSize: "1rem",
                  marginBottom: "0.5rem",
                  color: "#e5e7eb",
                }}
              >
                Energy‑matched tasks
              </h2>
              {tasks.length === 0 ? (
                <p style={{ color: "#9ca3af" }}>
                  No tasks in this list yet. Try loading all pending tasks,
                  picking 3 for your current energy, or using &quot;Add starter
                  tasks&quot; 💛
                </p>
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
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#9ca3af",
                          }}
                        >
                          size: {task.size} · status: {task.status}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "0.4rem",
                          alignItems: "center",
                        }}
                      >
                        {!task.is_routine && (
                          <button
                            type="button"
                            onClick={() =>
                              handleConvertToRoutine(task, "daily")
                            }
                            disabled={loading}
                            style={{
                              padding: "0.25rem 0.7rem",
                              borderRadius: "999px",
                              border: "1px solid #facc15",
                              background: "transparent",
                              color: "#facc15",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            Make routine
                          </button>
                        )}

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
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* HISTORY SCREEN */}
        {currentScreen === "history" && (
          <div>
            <p style={{ marginBottom: "0.5rem", color: "#9ca3af" }}>
              Tiny proof you&apos;ve actually done things, even on “bad” days.
            </p>

            {loading && (
              <p
                style={{
                  color: "#a5b4fc",
                  marginBottom: "0.75rem",
                }}
              >
                Loading history…
              </p>
            )}
            {error && (
              <p
                style={{
                  color: "#f97373",
                  marginBottom: "0.75rem",
                }}
              >
                {error}
              </p>
            )}

            {historyTasks.length === 0 && !loading ? (
              <p style={{ color: "#9ca3af" }}>
                No completed tasks yet. Tiny wins still count — try finishing
                one task on the Focus screen first 💛
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {historyTasks.map((task) => (
                  <li
                    key={task.id}
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "0.75rem",
                      border: task.is_routine
                        ? "1px solid #facc15"
                        : "1px solid #1f2937",
                      background: "#020617",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{task.title}</div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: task.is_routine ? "#facc15" : "#9ca3af",
                        }}
                      >
                        size: {task.size} · status: {task.status}
                        {task.is_routine
                          ? ` · routine: ${task.recurrence || "custom"}`
                          : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
