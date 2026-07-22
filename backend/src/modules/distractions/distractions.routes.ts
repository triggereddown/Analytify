import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getWeeklyDistractionReportHandler, logDistractionHandler } from "./distractions.controller.js";

const router = express.Router();

router.post("/", authMiddleware, logDistractionHandler);
router.get("/weekly-report", authMiddleware, getWeeklyDistractionReportHandler);

export default router;
