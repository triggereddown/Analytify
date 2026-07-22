import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireTier } from "../../middleware/tier.middleware.js";
import { exportSessionsCsvHandler } from "./export.controller.js";

const router = express.Router();

// Premium-only — matches the original roadmap's "Export (CSV/PDF)" being
// a Phase 1 premium-tier item.
router.get("/sessions.csv", authMiddleware, requireTier("premium"), exportSessionsCsvHandler);

export default router;
