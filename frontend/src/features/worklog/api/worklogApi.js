import API from "../../../api/api";

export const logWork = (payload) => API.post("/worklog", payload);

export const getWorkLog = (from, to) => API.get("/worklog", { params: { from, to } });

export const updateEntry = (id, payload) => API.patch(`/worklog/${id}`, payload);

export const deleteEntry = (id) => API.delete(`/worklog/${id}`);

export const generateWorkReport = (from, to) => API.get("/ai/report", { params: { from, to } });

