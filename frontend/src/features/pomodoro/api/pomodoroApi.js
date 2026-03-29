import API from "../../../api/api";

export const startPomodoroSession = () => API.post("/pomodoro/start");

export const completePomodoroSession = ({ sessionId, duration }) =>
  API.post("/pomodoro/complete", { sessionId, duration });

export const abandonPomodoroSession = ({ sessionId, duration }) =>
  API.post("/pomodoro/abandon", { sessionId, duration });

export const fetchPomodoroStats = () => API.get("/pomodoro/stats");

export const fetchPomodoroDailyStats = () => API.get("/pomodoro/dailystats");
