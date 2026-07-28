import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  getLearningPathHandler,
  listLearningPathsHandler,
  setLearningTaskDoneHandler,
  updateLearningPathStatusHandler,
} from "./learningPath.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/", listLearningPathsHandler);
router.get("/:id", getLearningPathHandler);
router.patch("/:id/status", updateLearningPathStatusHandler);
router.patch("/tasks/:taskId", setLearningTaskDoneHandler);

export default router;
