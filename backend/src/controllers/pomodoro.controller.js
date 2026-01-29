import PomodoroSession from "../models/PomodoroSession.js";
import mongoose from "mongoose";

export const startSession = async (req, res) => {
  const userId = req.user.id;

  // remove any previous running session
  await PomodoroSession.updateMany(
    { userId, status: "running" },
    { status: "abandoned", endTime: new Date() },
  );

  // creating new session

  const session = await PomodoroSession.create({
    userId,
    startTime: new Date(),
  });

  res.json(session);
};

export const completeSession = async (req, res) => {
  const { sessionId, duration } = req.body;

  const session = await PomodoroSession.findById(sessionId);
  if (!session || session.userId.toString() !== req.user.id) {
    return res.status(404).json({ message: "Session not found" });
  }

  session.status = "completed";
  session.endTime = new Date();
  session.duration = duration;

  await session.save();

  res.json({ success: true });
};

//abandon
export const abandonSession = async (req, res) => {
  const { sessionId, duration } = req.body;

  const session = await PomodoroSession.findById(sessionId);

  // session existence + ownership check
  if (!session || session.userId.toString() !== req.user.id) {
    return res.status(404).json({ message: "Session not found" });
  }

  // prevent double updates
  if (session.status !== "running") {
    return res.status(400).json({
      message: "Only running sessions can be abandoned",
    });
  }

  session.status = "abandoned";
  session.endTime = new Date();

  // duration is optional but useful
  if (duration !== undefined) {
    session.duration = duration;
  }

  await session.save();

  res.json({ success: true });
};

//analytics
export const getStats = async (req, res) => {
  const userId = req.user.id;

  const totalSessions = await PomodoroSession.countDocuments({ userId });
  const completed = await PomodoroSession.countDocuments({
    userId,
    status: "completed",
  });
  const abandoned = await PomodoroSession.countDocuments({
    userId,
    status: "abandoned",
  });

  res.json({
    totalSessions,
    completed,
    abandoned,
  });
};

//analytuics graph

export const getAnalytics = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  //starting an aggregation pipeline
  const stats = await PomodoroSession.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
  //Shaping backend data to frontend friendly data
  const formatted = stats.map((item) => ({
    status: item._id,
    count: item.count,
  }));

  res.json(formatted);
};

//daily stats for graph
export const getDailyStats = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const data = await PomodoroSession.aggregate([
    { $match: { userId, status: "completed" } },
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
  //shapingstats data to frontend friendly data
  const formatted = data.map((d) => ({
    date: `${d._id.year}-${String(d._id.month).padStart(2, "0")}-${String(
      d._id.day,
    ).padStart(2, "0")}`,
    sessions: d.sessions,
    focusTime: d.focusTime,
  }));

  res.json(formatted);
};
