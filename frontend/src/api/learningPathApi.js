import API from "./api";

export const listLearningPaths = (status) =>
  API.get("/learning-paths", { params: status ? { status } : {} });

export const getLearningPath = (id) => API.get(`/learning-paths/${id}`);

export const updateLearningPathStatus = (id, status) =>
  API.patch(`/learning-paths/${id}/status`, { status });

export const setLearningTaskDone = (taskId, isDone) =>
  API.patch(`/learning-paths/tasks/${taskId}`, { isDone });

/**
 * Kicks off AI generation of a brand-new day-by-day curriculum. This is the
 * only way new learning paths get created (no plain POST /learning-paths).
 */
export const generateLearningPath = (payload) => API.post("/ai/learning-paths", payload);
