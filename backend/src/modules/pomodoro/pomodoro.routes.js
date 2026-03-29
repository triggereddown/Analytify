import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  abandonSession,
  completeSession,
  getAnalytics,
  getDailyStats,
  getStats,
  startSession,
} from "./pomodoro.controller.js";

const router = express.Router();

router.get("/stats-test", (req, res) => {
  res.json({ ok: true });
});

router.post("/start", authMiddleware, startSession);
router.post("/complete", authMiddleware, completeSession);
router.post("/abandon", authMiddleware, abandonSession);
router.get("/stats", authMiddleware, getStats);
router.get("/analytics", authMiddleware, getAnalytics);
router.get("/dailystats", authMiddleware, getDailyStats);

export default router;
