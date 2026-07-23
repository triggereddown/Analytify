import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  createGoalHandler,
  getGoalWithProgressHandler,
  listGoalsHandler,
  updateGoalStatusHandler,
} from "./goals.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.post("/", createGoalHandler);
router.get("/", listGoalsHandler);
router.patch("/:id/status", updateGoalStatusHandler);
router.get("/:id", getGoalWithProgressHandler);

export default router;
