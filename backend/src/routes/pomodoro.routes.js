import express from "express";
import {
  startSession,
  completeSession,
  getStats,
  getDailyStats,
  getAnalytics,
  abandonSession,
} from "../controllers/pomodoro.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

console.log("✅ Pomodoro routes file loaded");

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
