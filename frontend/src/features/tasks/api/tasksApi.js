import API from "../../../api/api";

/** Creates a new task. */
export const createTask = (title) => API.post("/tasks", { title });

/** Lists the logged-in user's tasks. Pass status to filter (active|completed|archived). */
export const fetchTasks = (status) =>
  API.get("/tasks", { params: status ? { status } : {} });

/** Updates a task's title and/or status. */
export const updateTask = (taskId, fields) => API.patch(`/tasks/${taskId}`, fields);

/** Deletes a task. */
export const deleteTask = (taskId) => API.delete(`/tasks/${taskId}`);
