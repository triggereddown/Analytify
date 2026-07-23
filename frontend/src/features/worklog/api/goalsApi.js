import API from "../../../api/api";

export const createGoal = (payload) => API.post("/goals", payload);

export const listGoals = (status) => API.get("/goals", { params: status ? { status } : {} });

export const updateGoalStatus = (id, status) => API.patch(`/goals/${id}/status`, { status });

export const getGoal = (id) => API.get(`/goals/${id}`);

