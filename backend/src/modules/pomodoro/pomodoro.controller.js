import {
  abandonUserSession,
  completeUserSession,
  getUserAnalytics,
  getUserDailyStats,
  getUserStats,
  startUserSession,
} from "./pomodoro.service.js";

export const startSession = async (req, res) => {
  const session = await startUserSession(req.user.id);
  res.json(session);
};

export const completeSession = async (req, res) => {
  const { sessionId, duration } = req.body;
  try {
    await completeUserSession({ sessionId, duration, userId: req.user.id });
    res.json({ success: true });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to complete session" });
  }
};

export const abandonSession = async (req, res) => {
  const { sessionId, duration } = req.body;
  try {
    await abandonUserSession({ sessionId, duration, userId: req.user.id });
    res.json({ success: true });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to abandon session" });
  }
};

export const getStats = async (req, res) => {
  const stats = await getUserStats(req.user.id);
  res.json(stats);
};

export const getAnalytics = async (req, res) => {
  const analytics = await getUserAnalytics(req.user.id);
  res.json(analytics);
};

export const getDailyStats = async (req, res) => {
  const dailyStats = await getUserDailyStats(req.user.id);
  res.json(dailyStats);
};
