import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  createTaskHandler,
  deleteTaskHandler,
  listTasksHandler,
  updateTaskHandler,
} from "./tasks.controller.js";

const router = express.Router();

router.post("/", authMiddleware, createTaskHandler);
router.get("/", authMiddleware, listTasksHandler); // optional ?status= filter
router.patch("/:taskId", authMiddleware, updateTaskHandler);
router.delete("/:taskId", authMiddleware, deleteTaskHandler);

export default router;
