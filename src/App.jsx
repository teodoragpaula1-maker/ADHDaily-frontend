import { useEffect, useState } from "react";
import {
  getFocusTasks,
  createTask,
  completeTask,
  getCompletedTasks,
  deleteTask,
  loginUser,
  registerUser,
} from "./api";

// ---------- THEME DEFINITIONS ----------

const THEMES = {
  lavender: {
    pageBg: "#d6d1f4",
    pageText: "#111827",

    cardBg: "#f0ecff",
    cardBorder: "#b8a8ff",
    shadow: "0 18px 34px rgba(88, 96, 160, 0.28)",

    subText: "#374151",
    accentText: "#5b4bb0",

    routineBorder: "#d9c65e",
    routineText: "#5b4bb0",

    listBg: "#e7e3ff",
    listBorder: "#b8a8ff",

    inputBg: "#ebe5ff",
    inputBorder: "#b09eff",

    surfaceSoft: "#cfc5ff",
  },

  mint: {
    pageBg: "#cff4ea",
    pageText: "#052e2b",

    cardBg: "#ecfffa",
    cardBorder: "#aeead8",
    shadow: "0 18px 34px rgba(64, 133, 120, 0.28)",

    subText: "#134e4a",
    accentText: "#137c68",

    routineBorder: "#d6c95b",
    routineText: "#137c68",

    listBg: "#ddfbf3",
    listBorder: "#aeead8",

    inputBg: "#e6fff7",
    inputBorder: "#a1e2d0",

    surfaceSoft: "#c3efe0",
  },

  neutral: {
    pageBg: "#e5e7eb",
    pageText: "#111827",

    cardBg: "#f9fafb",
    cardBorder: "#d1d5db",
    shadow: "0 18px 34px rgba(148, 163, 184, 0.28)",

    subText: "#4b5563",
    accentText: "#6d5bb6",

    routineBorder: "#d9c856",
    routineText: "#6d5bb6",

    listBg: "#eef0f4",
    listBorder: "#d1d5db",

    inputBg: "#f3f4f6",
    inputBorder: "#c4c8d2",

    surfaceSoft: "#e2e5f0",
  },

  blue: {
    pageBg: "#d7e4ff",
    pageText: "#102a43",

    cardBg: "#eef3ff",
    cardBorder: "#a8c2ff",
    shadow: "0 18px 34px rgba(59, 130, 246, 0.28)",

    subText: "#1f2937",
    accentText: "#2952b3",

    routineBorder: "#ecc94b",
    routineText: "#2952b3",

    listBg: "#e1ebff",
    listBorder: "#a8c2ff",

    inputBg: "#e8f0ff",
    inputBorder: "#96b5ff",

    surfaceSoft: "#d0dcff",
  },

  peach: {
    pageBg: "#ffe0cf",
    pageText: "#2b1813",

    cardBg: "#fff3e8",
    cardBorder: "#fec7a8",
    shadow: "0 18px 34px rgba(248, 153, 112, 0.28)",

    subText: "#5b4038",
    accentText: "#dd5c35",

    routineBorder: "#f1c94f",
    routineText: "#dd5c35",

    listBg: "#ffe7d8",
    listBorder: "#fec7a8",

    inputBg: "#ffecdf",
    inputBorder: "#fbbf9a",

    surfaceSoft: "#ffd8c0",
  },

  coffee: {
    pageBg: "#eadfd0",
    pageText: "#1f130b",

    cardBg: "#f6eee3",
    cardBorder: "#d9c8b4",
    shadow: "0 18px 34px rgba(148, 116, 86, 0.28)",

    subText: "#4b3b2c",
    accentText: "#8b5a2b",

    routineBorder: "#d6c25c",
    routineText: "#8b5a2b",

    listBg: "#efe1d2",
    listBorder: "#d9c8b4",

    inputBg: "#f4e9dc",
    inputBorder: "#d2c0aa",

    surfaceSoft: "#e4d4c3",
  },

  dark: {
    pageBg: "#050816",
    pageText: "#f8fafc",

    cardBg: "#101427",
    cardBorder: "#1e253b",
    shadow: "0 18px 34px rgba(0, 0, 0, 0.7)",

    subText: "#cbd5e1",
    accentText: "#a5b4fc",

    routineBorder: "#facc15",
    routineText: "#a5b4fc",

    listBg: "#151a30",
    listBorder: "#1e253b",

    inputBg: "#181e36",
    inputBorder: "#273352",

    surfaceSoft: "#181e34",
  },
};

const THEME_KEYS = [
  "lavender",
  "mint",
  "neutral",
  "blue",
  "peach",
  "coffee",
  "dark",
];

function getInitialTheme() {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem("adhdaily-theme");
    if (saved && Object.prototype.hasOwnProperty.call(THEMES, saved)) {
      return saved;
    }
  }
  return "lavender";
}

function getInitialToken() {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("adhdaily-token") || "";
  }
  return "";
}

function App() {
  // ---------- Task + UI state ----------
  const [tasks, setTasks] = useState([]);
  const [routineTasks, setRoutineTasks] = useState([]);
  const [historyTasks, setHistoryTasks] = useState([]);

  const [currentScreen, setCurrentScreen] = useState("home"); // home | focus | achievements | settings

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSize, setNewSize] = useState("tiny");
  const [completedThisSession, setCompletedThisSession] = useState(0);

  const [energy, setEnergy] = useState("medium");
  const [points, setPoints] = useState(0);

  const [isRoutine, setIsRoutine] = useState(false);
  const [recurrence, setRecurrence] = useState("daily");

  const [theme, setTheme] = useState(getInitialTheme);

  // ---------- Auth state ----------
  const [token, setToken] = useState(getInitialToken);
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const palette = THEMES[theme] || THEMES.lavender;
  const isDark = theme === "dark";
  const isAuthenticated = Boolean(token);

  // remember theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("adhdaily-theme", theme);
    }
  }, [theme]);

  // remember token
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (token) {
        window.localStorage.setItem("adhdaily-token", token);
      } else {
        window.localStorage.removeItem("adhdaily-token");
      }
    }
  }, [token]);

  // ---------- Helpers ----------

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

    return {
      ...task,
      is_routine: Boolean(isRoutineFlag),
      category: isRoutineFlag
        ? task.category || "routine"
        : task.category || "general",
      recurrence: isRoutineFlag
        ? task.recurrence || "daily"
        : task.recurrence || null,
    };
  }

  async function loadFocusTasks() {
    try {
      setLoading(true);
      setError("");
      const raw = await getFocusTasks();
      const data = raw.map(normalizeTaskFromBackend);

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

    // high
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

  async function loadRandomFocusTasks(forEnergy) {
    const energyLevel = forEnergy || energy;
    try {
      setLoading(true);
      setError("");
      const raw = await getFocusTasks();
      const all = raw.map(normalizeTaskFromBackend);

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

  async function handleEnergyClick(level, goToFocus) {
    setEnergy(level);
    if (goToFocus) setCurrentScreen("focus");
    await loadRandomFocusTasks(level);
  }

  // ---------- Auth handlers ----------

  async function handleAuthSubmit(e) {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      setAuthError("");

      if (authMode === "register") {
        await registerUser(authEmail.trim(), authPassword);
      }

      const data = await loginUser(authEmail.trim(), authPassword);
      if (!data || !data.access_token) {
        throw new Error("Login failed: no token returned");
      }

      setToken(data.access_token);
      setAuthPassword("");
      setAuthError("");
      setCurrentScreen("home");
    } catch (err) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setToken("");
    setTasks([]);
    setRoutineTasks([]);
    setHistoryTasks([]);
    setCompletedThisSession(0);
    setPoints(0);
    setCurrentScreen("home");
  }

  // ---------- Create / complete / convert / delete / starter tasks ----------

  async function handleCreateTask(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setLoading(true);
      setError("");

      const routineCategory = isRoutine ? "routine" : "general";

      const created = await createTask({
        title: newTitle.trim(),
        size: newSize,
        category: routineCategory,
        importance: 1,
        due_date: null,
        recurrence: isRoutine ? recurrence : null,
      });

      const createdTask = normalizeTaskFromBackend({
        ...created,
        category: routineCategory,
        recurrence: isRoutine ? recurrence : null,
      });

      if (createdTask.is_routine) {
        setRoutineTasks((prev) => [...prev, createdTask]);
      } else {
        setTasks((prev) => [...prev, createdTask]);
      }

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

  function handleConvertToRoutine(task, newRecurrence = "daily") {
    const updated = {
      ...task,
      is_routine: true,
      category: "routine",
      recurrence: newRecurrence,
    };

    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setRoutineTasks((prev) => [...prev, updated]);
  }

  async function handleDelete(id) {
    try {
      setLoading(true);
      setError("");

      await deleteTask(id);

      setTasks((prev) => prev.filter((t) => t.id !== id));
      setRoutineTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete task");
    } finally {
      setLoading(false);
    }
  }

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
          recurrence: s.isRoutine ? s.recurrence : null,
        });

        const normalized = normalizeTaskFromBackend({
          ...created,
          category: routineCategory,
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

  // ---------- Achievements ----------

  const totalCompleted = historyTasks.length;
  const totalRoutinesDefined = routineTasks.length;

  const achievements = [
    {
      id: "first",
      label: "First tiny win",
      description: "Complete your first task.",
      unlocked: totalCompleted >= 1,
      emoji: "✨",
    },
    {
      id: "five",
      label: "Getting momentum",
      description: "Complete 5 tasks.",
      unlocked: totalCompleted >= 5,
      emoji: "⚡",
    },
    {
      id: "ten",
      label: "Look at you go",
      description: "Complete 10 tasks.",
      unlocked: totalCompleted >= 10,
      emoji: "🌈",
    },
    {
      id: "routines",
      label: "Routine builder",
      description: "Create 3 or more routines.",
      unlocked: totalRoutinesDefined >= 3,
      emoji: "📆",
    },
    {
      id: "points",
      label: "Points collector",
      description: "Earn 10+ points in one session.",
      unlocked: points >= 10,
      emoji: "🏅",
    },
  ];

  // ---------- Effects ----------

  // Load history when opening Settings or Achievements (achievements use history)
  useEffect(() => {
    if (
      (currentScreen === "settings" || currentScreen === "achievements") &&
      isAuthenticated
    ) {
      loadHistoryTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen, isAuthenticated]);

  // ---------- Render: AUTH GATE ----------

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "2rem",
          fontFamily: "system-ui",
          background: palette.pageBg,
          color: palette.pageText,
          transition:
            "background 0.35s ease, color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease",
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            margin: "0 auto",
            background: palette.cardBg,
            padding: "1.75rem 1.5rem",
            borderRadius: "1.25rem",
            boxShadow: palette.shadow,
            border: `1px solid ${palette.cardBorder}`,
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              padding: "0.2rem 0.7rem",
              borderRadius: "999px",
              background: isDark ? "#111827" : palette.surfaceSoft,
              border: isDark
                ? "1px solid #1f2937"
                : `1px solid ${palette.listBorder}`,
              color: palette.subText,
              marginBottom: "0.75rem",
              display: "inline-block",
            }}
          >
            ADHDaily · beta
          </div>

          <h1 style={{ fontSize: "1.6rem", marginBottom: "0.25rem" }}>
            Welcome back 💛
          </h1>
          <p
            style={{
              marginBottom: "1rem",
              color: palette.subText,
              fontSize: "0.9rem",
            }}
          >
            Tiny, realistic steps — now with your own account so your tasks
            stay private.
          </p>

          <div
            style={{
              display: "flex",
              gap: "0.4rem",
              marginBottom: "1rem",
              fontSize: "0.85rem",
            }}
          >
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              style={{
                flex: 1,
                padding: "0.35rem 0.75rem",
                borderRadius: "999px",
                border:
                  authMode === "login"
                    ? "none"
                    : `1px solid ${palette.listBorder}`,
                background:
                  authMode === "login" ? "#6366f1" : "transparent",
                color:
                  authMode === "login"
                    ? "white"
                    : palette.subText,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("register")}
              style={{
                flex: 1,
                padding: "0.35rem 0.75rem",
                borderRadius: "999px",
                border:
                  authMode === "register"
                    ? "none"
                    : `1px solid ${palette.listBorder}`,
                background:
                  authMode === "register"
                    ? "#22c55e"
                    : "transparent",
                color:
                  authMode === "register"
                    ? "white"
                    : palette.subText,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuthSubmit}>
            <div style={{ marginBottom: "0.75rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  marginBottom: "0.25rem",
                  color: palette.subText,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.75rem",
                  border: `1px solid ${palette.inputBorder}`,
                  background: palette.inputBg,
                  color: isDark ? "#f9fafb" : "#111827",
                }}
              />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  marginBottom: "0.25rem",
                  color: palette.subText,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.75rem",
                  border: `1px solid ${palette.inputBorder}`,
                  background: palette.inputBg,
                  color: isDark ? "#f9fafb" : "#111827",
                }}
              />
            </div>

            {authError && (
              <p
                style={{
                  color: "#f97373",
                  fontSize: "0.8rem",
                  marginBottom: "0.5rem",
                }}
              >
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem",
                borderRadius: "999px",
                border: "none",
                background: authMode === "login" ? "#6366f1" : "#22c55e",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
                marginBottom: "0.5rem",
              }}
            >
              {loading
                ? "Please wait…"
                : authMode === "login"
                ? "Log in"
                : "Create account"}
            </button>
          </form>

          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.8rem",
              color: palette.subText,
            }}
          >
            You can change the color theme later from the app settings 💜
          </p>
        </div>
      </div>
    );
  }

  // ---------- Render: MAIN APP WHEN LOGGED IN ----------

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "system-ui",
        background: palette.pageBg,
        color: palette.pageText,
        transition:
          "background 0.35s ease, color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: palette.cardBg,
          padding: "1.5rem 1.5rem 0.75rem",
          borderRadius: "1.25rem",
          boxShadow: palette.shadow,
          border: `1px solid ${palette.cardBorder}`,
          transition:
            "background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease",
          display: "flex",
          flexDirection: "column",
          minHeight: "70vh",
        }}
      >
        {/* Top row: badge + today points mini pill */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1rem",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              padding: "0.2rem 0.7rem",
              borderRadius: "999px",
              background: isDark ? "#111827" : palette.surfaceSoft,
              border: isDark
                ? "1px solid #1f2937"
                : `1px solid ${palette.listBorder}`,
              color: palette.subText,
              transition: "background 0.35s ease, border-color 0.35s ease",
            }}
          >
            ADHDaily · beta
          </div>

          <div
            style={{
              fontSize: "0.8rem",
              padding: "0.25rem 0.6rem",
              borderRadius: "999px",
              background: isDark ? "#1e293b" : "rgba(56,189,248,0.1)",
              border: isDark ? "1px solid #0ea5e9" : "1px solid #22c55e",
              color: isDark ? "#e0f2fe" : "#15803d",
            }}
          >
            ⭐ Today: {points} pts
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: "0.75rem" }}>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>
            ADHDaily – Focus Tasks
          </h1>
        </div>

        {/* MAIN CONTENT AREA */}
        <div
          style={{
            flex: 1,
            paddingBottom: "0.75rem",
          }}
        >
          {/* HOME SCREEN */}
          {currentScreen === "home" && (
            <>
              <p
                style={{
                  marginBottom: "0.75rem",
                  color: palette.subText,
                }}
              >
                Tiny, realistic steps for overwhelmed brains. No shame, just
                gentle progress.
              </p>

              <div
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "0.75rem",
                  border: `1px solid ${palette.listBorder}`,
                  background: isDark
                    ? "radial-gradient(circle at top left, #1d2437, #020617)"
                    : "radial-gradient(circle at top left, #e9e5ff, #f3f2ff)",
                  marginBottom: "1.5rem",
                  transition: "background 0.35s ease, border-color 0.35s ease",
                }}
              >
                <p
                  style={{
                    marginBottom: "0.75rem",
                    color: isDark ? "#e5e7eb" : "#374151",
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
                      border: `1px solid ${palette.listBorder}`,
                      background:
                        energy === "low" ? "#0ea5e9" : "transparent",
                      color:
                        energy === "low"
                          ? "white"
                          : isDark
                          ? "#e5e7eb"
                          : "#374151",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "background 0.25s ease, color 0.25s ease",
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
                      border: `1px solid ${palette.listBorder}`,
                      background:
                        energy === "medium" ? "#6366f1" : "transparent",
                      color:
                        energy === "medium"
                          ? "white"
                          : isDark
                          ? "#e5e7eb"
                          : "#374151",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "background 0.25s ease, color 0.25s ease",
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
                      border: `1px solid ${palette.listBorder}`,
                      background:
                        energy === "high" ? "#f97316" : "transparent",
                      color:
                        energy === "high"
                          ? "white"
                          : isDark
                          ? "#e5e7eb"
                          : "#374151",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "background 0.25s ease, color 0.25s ease",
                    }}
                  >
                    🔥 High
                  </button>
                </div>

                <p style={{ color: palette.subText, fontSize: "0.85rem" }}>
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
                  onClick={() => setCurrentScreen("achievements")}
                  style={{
                    padding: "0.6rem 1.4rem",
                    borderRadius: "999px",
                    border: `1px solid ${palette.listBorder}`,
                    background: "transparent",
                    color: palette.subText,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  See your achievements & history
                </button>
              </div>
            </>
          )}

          {/* FOCUS SCREEN */}
          {currentScreen === "focus" && (
            <>
              <p style={{ marginBottom: "0.25rem", color: palette.subText }}>
                Tiny tasks to help Future You 💛
              </p>

              <div
                style={{
                  marginBottom: "0.75rem",
                  fontSize: "0.85rem",
                  color: palette.subText,
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
                    border: `1px solid ${palette.listBorder}`,
                    background:
                      energy === "low" ? "#0ea5e9" : "transparent",
                    color:
                      energy === "low"
                        ? "white"
                        : isDark
                        ? "#e5e7eb"
                        : "#374151",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "background 0.25s ease, color 0.25s ease",
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
                    border: `1px solid ${palette.listBorder}`,
                    background:
                      energy === "medium" ? "#6366f1" : "transparent",
                    color:
                      energy === "medium"
                        ? "white"
                        : isDark
                        ? "#e5e7eb"
                        : "#374151",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "background 0.25s ease, color 0.25s ease",
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
                    border: `1px solid ${palette.listBorder}`,
                    background:
                      energy === "high" ? "#f97316" : "transparent",
                    color:
                      energy === "high"
                        ? "white"
                        : isDark
                        ? "#e5e7eb"
                        : "#374151",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "background 0.25s ease, color 0.25s ease",
                  }}
                >
                  🔥 High
                </button>
              </div>

              <p
                style={{
                  marginBottom: "1rem",
                  color: isDark ? "#a5b4fc" : "#818cf8",
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

                {tasks.length === 0 && routineTasks.length === 0 && (
                  <button
                    onClick={handleAddStarterTasks}
                    disabled={loading}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "999px",
                      border: "1px solid #facc15",
                      background: "transparent",
                      color: "#f59e0b",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    Add starter tasks
                  </button>
                )}
              </div>

              {loading && (
                <p
                  style={{
                    color: isDark ? "#a5b4fc" : "#6366f1",
                    marginBottom: "0.75rem",
                  }}
                >
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
                    border: `1px solid ${palette.inputBorder}`,
                    background: palette.inputBg,
                    color: isDark ? "#f9fafb" : "#111827",
                    transition:
                      "background 0.3s ease, border-color 0.3s ease, color 0.3s ease",
                  }}
                />

                <select
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "999px",
                    border: `1px solid ${palette.inputBorder}`,
                    background: palette.inputBg,
                    color: isDark ? "#f9fafb" : "#111827",
                  }}
                >
                  <option value="tiny">tiny</option>
                  <option value="medium">medium</option>
                  <option value="big">big</option>
                </select>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.85rem",
                    color: isDark ? "#e5e7eb" : "#374151",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "999px",
                    border: `1px solid ${palette.inputBorder}`,
                    background: palette.inputBg,
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
                      border: `1px solid ${palette.inputBorder}`,
                      background: palette.inputBg,
                      color: isDark ? "#f9fafb" : "#111827",
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
                      color: palette.routineText,
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
                          border: `1px solid ${palette.routineBorder}`,
                          background: palette.listBg,
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
                              color: palette.routineText,
                            }}
                          >
                            routine · {task.recurrence || "custom"} · size:{" "}
                            {task.size} · status: {task.status}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "0.4rem",
                            alignItems: "center",
                          }}
                        >
                          {task.status === "pending" && (
                            <button
                              onClick={() => handleComplete(task.id)}
                              disabled={loading}
                              aria-label="Mark routine as done"
                              style={{
                                padding: "0.35rem 0.45rem",
                                borderRadius: "999px",
                                border: "none",
                                background: "#16a34a",
                                color: "white",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(task.id)}
                            disabled={loading}
                            aria-label="Delete routine task"
                            style={{
                              padding: "0.35rem 0.45rem",
                              borderRadius: "999px",
                              border: "1px solid #fca5a5",
                              background: "transparent",
                              color: "#fca5a5",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#fca5a5"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* NON‑ROUTINE / ENERGY TASKS */}
              <div>
                <h2
                  style={{
                    fontSize: "1rem",
                    marginBottom: "0.5rem",
                    color: isDark ? "#e5e7eb" : "#374151",
                  }}
                >
                  Energy‑matched tasks
                </h2>
                {tasks.length === 0 ? (
                  <p style={{ color: palette.subText }}>
                    No tasks in this list yet. Try loading all pending tasks,
                    picking 3 for your current energy, or using &quot;Add
                    starter tasks&quot; 💛
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        style={{
                          padding: "0.75rem 1rem",
                          borderRadius: "0.75rem",
                          border: `1px solid ${palette.listBorder}`,
                          background: palette.listBg,
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
                              color: palette.subText,
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
                                color: isDark ? "#facc15" : "#d97706",
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
                              aria-label="Mark task as done"
                              style={{
                                padding: "0.35rem 0.45rem",
                                borderRadius: "999px",
                                border: "none",
                                background: "#16a34a",
                                color: "white",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(task.id)}
                            disabled={loading}
                            aria-label="Delete task"
                            style={{
                              padding: "0.35rem 0.45rem",
                              borderRadius: "999px",
                              border: "1px solid #fca5a5",
                              background: "transparent",
                              color: "#fca5a5",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#fca5a5"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* ACHIEVEMENTS SCREEN */}
          {currentScreen === "achievements" && (
            <div>
              <h2
                style={{
                  fontSize: "1.1rem",
                  marginBottom: "0.4rem",
                  color: isDark ? "#e5e7eb" : "#111827",
                }}
              >
                Achievements
              </h2>
              <p
                style={{
                  marginBottom: "0.7rem",
                  fontSize: "0.85rem",
                  color: palette.subText,
                }}
              >
                Tiny trophies for tiny wins — no pressure, just visual proof
                you&apos;re doing things. Completed tasks: {totalCompleted}.
              </p>

              {loading && (
                <p
                  style={{
                    color: isDark ? "#a5b4fc" : "#6366f1",
                    marginBottom: "0.75rem",
                    fontSize: "0.8rem",
                  }}
                >
                  Loading…
                </p>
              )}
              {error && (
                <p
                  style={{
                    color: "#f97373",
                    marginBottom: "0.75rem",
                    fontSize: "0.8rem",
                  }}
                >
                  {error}
                </p>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    style={{
                      padding: "0.6rem 0.7rem",
                      borderRadius: "0.8rem",
                      border: ach.unlocked
                        ? "1px solid rgba(22,163,74,0.7)"
                        : `1px solid ${palette.listBorder}`,
                      background: ach.unlocked
                        ? (isDark
                            ? "linear-gradient(135deg,#14532d,#022c22)"
                            : "linear-gradient(135deg,#dcfce7,#f0fdf4)")
                        : (isDark ? "#020617" : "#f9fafb"),
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.2rem",
                        }}
                      >
                        {ach.emoji}
                      </span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: ach.unlocked
                            ? (isDark ? "#bbf7d0" : "#166534")
                            : palette.subText,
                        }}
                      >
                        {ach.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: ach.unlocked
                          ? (isDark ? "#dcfce7" : "#14532d")
                          : palette.subText,
                      }}
                    >
                      {ach.description}
                    </span>
                    <span
                      style={{
                        alignSelf: "flex-start",
                        marginTop: "0.1rem",
                        fontSize: "0.7rem",
                        padding: "0.1rem 0.5rem",
                        borderRadius: "999px",
                        border: ach.unlocked
                          ? "none"
                          : "1px solid rgba(156,163,175,0.7)",
                        background: ach.unlocked
                          ? "#22c55e"
                          : "transparent",
                        color: ach.unlocked ? "white" : palette.subText,
                        fontWeight: 500,
                      }}
                    >
                      {ach.unlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: "0.75rem 0.9rem",
                  borderRadius: "0.75rem",
                  border: `1px solid ${palette.listBorder}`,
                  background: palette.listBg,
                  fontSize: "0.8rem",
                  color: palette.subText,
                }}
              >
                <div
                  style={{
                    marginBottom: "0.4rem",
                    fontWeight: 500,
                    color: isDark ? "#e5e7eb" : "#111827",
                  }}
                >
                  Quick history peek
                </div>
                {historyTasks.length === 0 && !loading ? (
                  <p>
                    No completed tasks yet. Finish one tiny thing on the Focus
                    tab and come back 👀
                  </p>
                ) : (
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      maxHeight: "120px",
                      overflowY: "auto",
                    }}
                  >
                    {historyTasks.slice(0, 5).map((task) => (
                      <li
                        key={task.id}
                        style={{
                          padding: "0.45rem 0.55rem",
                          borderRadius: "0.55rem",
                          border: task.is_routine
                            ? `1px solid ${palette.routineBorder}`
                            : `1px solid ${palette.listBorder}`,
                          background: palette.cardBg,
                          marginBottom: "0.3rem",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 500,
                            fontSize: "0.8rem",
                          }}
                        >
                          {task.title}
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: task.is_routine
                              ? palette.routineText
                              : palette.subText,
                          }}
                        >
                          size: {task.size} · status: {task.status}
                          {task.is_routine
                            ? ` · routine: ${
                                task.recurrence || "custom"
                              }`
                            : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS SCREEN: theme + full history + logout */}
          {currentScreen === "settings" && (
            <div>
              <h2
                style={{
                  fontSize: "1.1rem",
                  marginBottom: "0.5rem",
                  color: isDark ? "#e5e7eb" : "#111827",
                }}
              >
                Settings & history
              </h2>

              {/* Theme section */}
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem 0.9rem",
                  borderRadius: "0.75rem",
                  border: `1px solid ${palette.listBorder}`,
                  background: palette.listBg,
                }}
              >
                <div
                  style={{
                    marginBottom: "0.4rem",
                    fontWeight: 500,
                    color: palette.subText,
                    fontSize: "0.9rem",
                  }}
                >
                  Theme
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "0.4rem",
                  }}
                >
                  {THEME_KEYS.map((key) => {
                    const t = THEMES[key];
                    const isSelected = theme === key;
                    const textColor =
                      key === "dark" ? "#f9fafb" : "#111827";
                    const labelMap = {
                      lavender: "Lavender",
                      mint: "Mint",
                      neutral: "Neutral",
                      blue: "Pastel blue",
                      peach: "Sunset peach",
                      coffee: "Coffee cream",
                      dark: "Dark",
                    };
                    const label = labelMap[key] || key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTheme(key)}
                        style={{
                          borderRadius: "0.8rem",
                          padding: "0.4rem 0.6rem",
                          border: isSelected
                            ? `2px solid ${t.accentText}`
                            : `1px solid ${t.listBorder || t.cardBorder}`,
                          background: `linear-gradient(135deg, ${
                            t.pageBg
                          }, ${t.surfaceSoft || t.cardBg})`,
                          cursor: "pointer",
                          textAlign: "left",
                          boxShadow: isSelected
                            ? "0 0 0 2px rgba(15,23,42,0.12)"
                            : "none",
                          transition:
                            "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.2s ease",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: textColor,
                            marginBottom: "0.1rem",
                          }}
                        >
                          {label}
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color:
                              key === "dark"
                                ? "rgba(226,232,240,0.75)"
                                : "rgba(55,65,81,0.7)",
                          }}
                        >
                          Click to switch
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* History section */}
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem 0.9rem",
                  borderRadius: "0.75rem",
                  border: `1px solid ${palette.listBorder}`,
                  background: palette.listBg,
                }}
              >
                <div
                  style={{
                    marginBottom: "0.4rem",
                    fontWeight: 500,
                    color: palette.subText,
                    fontSize: "0.9rem",
                  }}
                >
                  Full history
                </div>
                <p
                  style={{
                    marginBottom: "0.6rem",
                    fontSize: "0.8rem",
                    color: palette.subText,
                  }}
                >
                  Tiny proof you&apos;ve actually done things, even on “bad”
                  days. Total completed: {totalCompleted}.
                </p>

                {loading && (
                  <p
                    style={{
                      color: isDark ? "#a5b4fc" : "#6366f1",
                      marginBottom: "0.75rem",
                      fontSize: "0.8rem",
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
                      fontSize: "0.8rem",
                    }}
                  >
                    {error}
                  </p>
                )}

                {historyTasks.length === 0 && !loading ? (
                  <p
                    style={{
                      color: palette.subText,
                      fontSize: "0.8rem",
                    }}
                  >
                    No completed tasks yet. Tiny wins still count — try finishing
                    one task on the Focus screen first 💛
                  </p>
                ) : (
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      maxHeight: "220px",
                      overflowY: "auto",
                    }}
                  >
                    {historyTasks.map((task) => (
                      <li
                        key={task.id}
                        style={{
                          padding: "0.6rem 0.7rem",
                          borderRadius: "0.6rem",
                          border: task.is_routine
                            ? `1px solid ${palette.routineBorder}`
                            : `1px solid ${palette.listBorder}`,
                          background: palette.cardBg,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.4rem",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: "0.85rem",
                            }}
                          >
                            {task.title}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: task.is_routine
                                ? palette.routineText
                                : palette.subText,
                            }}
                          >
                            size: {task.size} · status: {task.status}
                            {task.is_routine
                              ? ` · routine: ${
                                  task.recurrence || "custom"
                                }`
                              : ""}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  marginTop: "0.3rem",
                  width: "100%",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "999px",
                  border: "1px solid #fecaca",
                  background: "transparent",
                  color: "#b91c1c",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM NAV BAR WITH ICONS (Home / Focus / Achievements / Settings) */}
        <div
          style={{
            borderTop: `1px solid ${palette.listBorder}`,
            paddingTop: "0.5rem",
            marginTop: "0.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              gap: "0.75rem",
            }}
          >
            {/* HOME ICON */}
            <button
              type="button"
              aria-label="Home"
              onClick={() => setCurrentScreen("home")}
              style={{
                flex: 1,
                borderRadius: "999px",
                padding: "0.3rem 0.4rem",
                border:
                  currentScreen === "home"
                    ? `1px solid ${palette.accentText}`
                    : "1px solid transparent",
                background:
                  currentScreen === "home"
                    ? (isDark ? "#1e293b" : "rgba(148,163,184,0.12)")
                    : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={
                  currentScreen === "home"
                    ? palette.accentText
                    : palette.subText
                }
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 11L12 3l9 8" />
                <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
              </svg>
            </button>

            {/* FOCUS ICON */}
            <button
              type="button"
              aria-label="Focus"
              onClick={() => setCurrentScreen("focus")}
              style={{
                flex: 1,
                borderRadius: "999px",
                padding: "0.3rem 0.4rem",
                border:
                  currentScreen === "focus"
                    ? `1px solid ${palette.accentText}`
                    : "1px solid transparent",
                background:
                  currentScreen === "focus"
                    ? (isDark ? "#1e293b" : "rgba(148,163,184,0.12)")
                    : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={
                  currentScreen === "focus"
                    ? "#6366f1"
                    : palette.subText
                }
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="2.5" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
              </svg>
            </button>

            {/* ACHIEVEMENTS ICON */}
            <button
              type="button"
              aria-label="Achievements"
              onClick={() => setCurrentScreen("achievements")}
              style={{
                flex: 1,
                borderRadius: "999px",
                padding: "0.3rem 0.4rem",
                border:
                  currentScreen === "achievements"
                    ? `1px solid ${palette.accentText}`
                    : "1px solid transparent",
                background:
                  currentScreen === "achievements"
                    ? (isDark ? "#1e293b" : "rgba(148,163,184,0.12)")
                    : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={
                  currentScreen === "achievements"
                    ? "#22c55e"
                    : palette.subText
                }
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 21l4-2 4 2" />
                <path d="M12 3l3.09 6.26L22 10.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 15.14l-5-4.87 6-1.01Z" />
              </svg>
            </button>

            {/* SETTINGS ICON */}
            <button
              type="button"
              aria-label="Settings"
              onClick={() => setCurrentScreen("settings")}
              style={{
                flex: 1,
                borderRadius: "999px",
                padding: "0.3rem 0.4rem",
                border:
                  currentScreen === "settings"
                    ? `1px solid ${palette.accentText}`
                    : "1px solid transparent",
                background:
                  currentScreen === "settings"
                    ? (isDark ? "#1e293b" : "rgba(148,163,184,0.12)")
                    : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={
                  currentScreen === "settings"
                    ? "#22c55e"
                    : palette.subText
                }
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82V22a2 2 0 0 1-4 0v-.18a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.82-.33H2a2 2 0 0 1 0-4h.18a1.65 1.65 0 0 0 1.82-.33 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82L4.21 5.5a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1.82V2a2 2 0 0 1 4 0v.18a1.65 1.65 0 0 0 .33 1.82 1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 .6 1 1.65 1.65 0 0 0 1.82.33H22a2 2 0 0 1 0 4h-.18a1.65 1.65 0 0 0-1.82.33 1.65 1.65 0 0 0-.6 1z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
