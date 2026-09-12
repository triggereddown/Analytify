import API from "./api";

export const fetchTodaysGrowth = () => API.get("/growth/today");
export const createGrowthArea = (name) => API.post("/growth", { name });
export const deleteGrowthArea = (id) => API.delete(`/growth/${id}`);
export const checkInGrowthArea = (id, { done, minutes, note }) =>
  API.post(`/growth/${id}/check-in`, { done, minutes, note });
