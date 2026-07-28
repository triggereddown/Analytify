import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  captureNote,
  chat,
  checkIn,
  clearChatHistoryHandler,
  context,
  createLearningPath,
  recall,
  report,
  weeklyReview,
} from "./ai.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/context", context);
router.get("/report", report);
router.post("/chat", chat);
router.delete("/chat", clearChatHistoryHandler);
router.post("/memory/capture", captureNote);
router.get("/memory/recall", recall);
router.post("/learning-paths", createLearningPath);
router.get("/check-in", checkIn);
router.get("/weekly-review", weeklyReview);

export default router;
