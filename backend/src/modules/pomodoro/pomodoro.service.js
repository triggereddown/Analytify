import { createHttpError } from "../../utils/httpError.js";
import {
  abandonRunningSessionsByUser,
  aggregateByStatus,
  aggregateDailyCompletedStats,
  countByFilter,
  createSession,
  findSessionById,
} from "./pomodoro.repository.js";

export const startUserSession = async (userId) => {
  await abandonRunningSessionsByUser(userId);
  return createSession(userId);
};

const getOwnedSession = async (sessionId, userId) => {
  const session = await findSessionById(sessionId);
  if (!session || session.userId.toString() !== userId) {
    throw createHttpError(404, "Session not found");
  }
  return session;
};

export const completeUserSession = async ({ sessionId, duration, userId }) => {
  const session = await getOwnedSession(sessionId, userId);
  session.status = "completed";
  session.endTime = new Date();
  session.duration = duration;
  await session.save();
};

export const abandonUserSession = async ({ sessionId, duration, userId }) => {
  const session = await getOwnedSession(sessionId, userId);
  if (session.status !== "running") {
    throw createHttpError(400, "Only running sessions can be abandoned");
  }

  session.status = "abandoned";
  session.endTime = new Date();
  if (duration !== undefined) {
    session.duration = duration;
  }
  await session.save();
};

export const getUserStats = async (userId) => {
  const totalSessions = await countByFilter({ userId });
  const completed = await countByFilter({ userId, status: "completed" });
  const abandoned = await countByFilter({ userId, status: "abandoned" });

  return { totalSessions, completed, abandoned };
};

export const getUserAnalytics = async (userId) => {
  const stats = await aggregateByStatus(userId);
  return stats.map((item) => ({
    status: item._id,
    count: item.count,
  }));
};

export const getUserDailyStats = async (userId) => {
  const data = await aggregateDailyCompletedStats(userId);
  return data.map((d) => ({
    date: `${d._id.year}-${String(d._id.month).padStart(2, "0")}-${String(
      d._id.day,
    ).padStart(2, "0")}`,
    sessions: d.sessions,
    focusTime: d.focusTime,
  }));
};
