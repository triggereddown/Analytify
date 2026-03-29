import mongoose from "mongoose";
import PomodoroSession from "../../models/PomodoroSession.js";

export const abandonRunningSessionsByUser = (userId) =>
  PomodoroSession.updateMany(
    { userId, status: "running" },
    { status: "abandoned", endTime: new Date() },
  );

export const createSession = (userId) =>
  PomodoroSession.create({
    userId,
    startTime: new Date(),
  });

export const findSessionById = (sessionId) => PomodoroSession.findById(sessionId);

export const countByFilter = (filter) => PomodoroSession.countDocuments(filter);

export const aggregateByStatus = (userId) =>
  PomodoroSession.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

export const aggregateDailyCompletedStats = (userId) =>
  PomodoroSession.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: "completed",
      },
    },
    {
      $group: {
        _id: {
          day: { $dayOfMonth: "$startTime" },
          month: { $month: "$startTime" },
          year: { $year: "$startTime" },
        },
        sessions: { $sum: 1 },
        focusTime: { $sum: "$duration" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);
