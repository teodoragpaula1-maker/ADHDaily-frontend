// src/api.js

// Base URL for the backend
// Set VITE_API_URL in frontend/.env for deployment,
// but default to localhost for dev.
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Helper: generic JSON API call that includes auth token if present
async function apiFetch(path, { method = "GET", body = null, headers = {} } = {}) {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("adhdaily-token")
      : null;

  const finalHeaders = { ...headers };

  // Only set JSON content-type when body is JSON, not when using FormData/string
  const isJsonBody = body && !(body instanceof FormData) && typeof body !== "string";

  if (isJsonBody && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: isJsonBody ? JSON.stringify(body) : body,
  });

  let data = null;

  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
  }

  if (!response.ok) {
    const detail =
      data && typeof data === "object" && data.detail
        ? data.detail
        : `Request failed with status ${response.status}`;
    throw new Error(Array.isArray(detail) ? detail.join(", ") : detail);
  }

  return data;
}

// ---------- Auth API ----------

export async function registerUser(email, password) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: { email, password },
  });
}

export async function loginUser(email, password) {
  // /auth/login expects form data (OAuth2PasswordRequestForm)
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail =
      data && typeof data === "object" && data.detail
        ? data.detail
        : `Login failed with status ${response.status}`;
    throw new Error(detail);
  }

  // expected shape: { access_token, token_type }
  return data;
}

// ---------- Task API ----------

export async function getFocusTasks() {
  return apiFetch("/tasks/focus");
}

export async function getCompletedTasks() {
  return apiFetch("/tasks/completed");
}

export async function createTask(task) {
  return apiFetch("/tasks", {
    method: "POST",
    body: task,
  });
}

export async function completeTask(taskId) {
  return apiFetch(`/tasks/${taskId}/complete`, {
    method: "POST",
  });
}

export async function deleteTask(taskId) {
  return apiFetch(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}
