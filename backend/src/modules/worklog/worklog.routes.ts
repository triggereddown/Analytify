import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  createWorkLogHandler,
  deleteWorkLogHandler,
  listWorkLogHandler,
  updateWorkLogHandler,
} from "./worklog.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.post("/", createWorkLogHandler);
router.get("/", listWorkLogHandler);
router.patch("/:id", updateWorkLogHandler);
router.delete("/:id", deleteWorkLogHandler);

export default router;

