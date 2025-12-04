const API_BASE = "http://127.0.0.1:8000";

export async function getFocusTasks() {
  const res = await fetch(`${API_BASE}/focus-tasks`);
  if (!res.ok) throw new Error("Failed to load focus tasks");
  return res.json();
}

export async function getRandomFocusTasks() {
  const res = await fetch(`${API_BASE}/focus-tasks/random`);
  if (!res.ok) throw new Error("Failed to load random focus tasks");
  return res.json();
}

export async function createTask(task) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function completeTask(id) {
  const res = await fetch(`${API_BASE}/tasks/${id}/complete`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to complete task");
  return res.json();
}
