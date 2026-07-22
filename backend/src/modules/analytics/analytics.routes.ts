import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  getDashboardAnalytics,
  getHeatmap,
  getBurnout,
  getPeakHours,
  getDeepWorkScore,
} from "./analytics.controller.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, getDashboardAnalytics);
router.get("/heatmap", authMiddleware, getHeatmap);
router.get("/burnout", authMiddleware, getBurnout);
router.get("/peak-hours", authMiddleware, getPeakHours);
router.get("/deep-work-score", authMiddleware, getDeepWorkScore);

export default router;
