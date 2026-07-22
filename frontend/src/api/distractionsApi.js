import API from "./api";

/** Logs a distraction against a specific session. */
export const logDistraction = ({ sessionId, category, note }) =>
  API.post("/distractions", { sessionId, category, note });

/** Fetch the last-7-days "top distraction triggers" report. */
export const fetchWeeklyDistractionReport = () => API.get("/distractions/weekly-report");
