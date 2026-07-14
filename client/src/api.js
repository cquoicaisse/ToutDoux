// ═══ Client API — toutes les tâches vivent dans SQLite côté serveur ═══
const j = (r) => {
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.status === 204 ? null : r.json();
};

export const fetchTasks = () => fetch("/api/tasks").then(j);

export const createTask = (t) =>
  fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(t),
  }).then(j);

export const updateTask = (id, patch) =>
  fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).then(j);

export const deleteTask = (id) =>
  fetch(`/api/tasks/${id}`, { method: "DELETE" }).then(j);

export const fetchGreeting = (ctx) =>
  fetch(`/api/greeting?ctx=${ctx}`).then(j);
