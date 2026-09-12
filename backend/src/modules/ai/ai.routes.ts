import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  approve,
  captureNote,
  chat,
  checkIn,
  cleanCommand,
  clearChatHistoryHandler,
  context,
  createLearningPath,
  recall,
  report,
  weeklyReview,
} from "./ai.controller.js";
import { approveSchema, captureNoteSchema, chatSchema, cleanCommandSchema, createLearningPathSchema } from "./ai.schema.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/context", context);
router.get("/report", report);
router.post("/chat", validate(chatSchema), chat);
router.post("/chat/approve", validate(approveSchema), approve);
router.delete("/chat", clearChatHistoryHandler);
router.post("/memory/capture", validate(captureNoteSchema), captureNote);
router.post("/clean-command", validate(cleanCommandSchema), cleanCommand);
router.get("/memory/recall", recall);
router.post("/learning-paths", validate(createLearningPathSchema), createLearningPath);
router.get("/check-in", checkIn);
router.get("/weekly-review", weeklyReview);

export default router;
