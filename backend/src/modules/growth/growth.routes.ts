import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  checkInHandler,
  createGrowthAreaHandler,
  deleteGrowthAreaHandler,
  getTodaysGrowthHandler,
} from "./growth.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/today", getTodaysGrowthHandler);
router.post("/", createGrowthAreaHandler);
router.delete("/:id", deleteGrowthAreaHandler);
router.post("/:id/check-in", checkInHandler);

export default router;
