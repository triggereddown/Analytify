import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { dismissBurnoutNudgeHandler, getBurnoutNudgeHandler } from "./nudges.controller.js";

const router = express.Router();

router.get("/burnout", authMiddleware, getBurnoutNudgeHandler);
router.post("/burnout/dismiss", authMiddleware, dismissBurnoutNudgeHandler);

export default router;
