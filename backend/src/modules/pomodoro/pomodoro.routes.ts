import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  abandonSession,
  beginSession,
  completeSession,
  getActiveSessionHandler,
  pauseSession,
  startSession,
} from "./pomodoro.controller.js";
import { getAnalytics, getDailyStats, getStats } from "../analytics/analytics.controller.js";

const router = express.Router();

// ─── Health check ───────────────────────────────────────────────────────────
router.get("/stats-test", (_req, res) => {
  res.json({ ok: true });
});

// ─── Lifecycle routes ───────────────────────────────────────────────────────
router.post("/start", authMiddleware, startSession); // creates session → status:"created"
router.post("/complete", authMiddleware, completeSession); // marks completed, computes active focus time
router.post("/abandon", authMiddleware, abandonSession); // abandons from created|running|paused
router.post("/begin", authMiddleware, beginSession); // created|paused → running
router.post("/pause", authMiddleware, pauseSession); // running → paused
router.get("/active-session", authMiddleware, getActiveSessionHandler); // recovery endpoint

// ─── Analytics routes ───────────────────────────────────────────────────────
router.get("/stats", authMiddleware, getStats);
router.get("/analytics", authMiddleware, getAnalytics);
router.get("/dailystats", authMiddleware, getDailyStats);

export default router;
