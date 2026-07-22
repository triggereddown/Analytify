import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireAdmin } from "../../middleware/admin.middleware.js";
import {
  createCheckoutSessionHandler,
  getMyBillingHandler,
  setTierManuallyHandler,
} from "./billing.controller.js";

const router = express.Router();

router.get("/me", authMiddleware, getMyBillingHandler);
router.post("/checkout", authMiddleware, createCheckoutSessionHandler);

// Admin-only manual override — stand-in for real billing until a payment
// provider is integrated (see billing.service.ts).
router.post("/admin/set-tier", authMiddleware, requireAdmin, setTierManuallyHandler);

export default router;
