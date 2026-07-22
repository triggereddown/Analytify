import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { getFreezeTokensHandler } from "./streaks.controller.js";

const router = express.Router();

router.get("/freeze-tokens", authMiddleware, getFreezeTokensHandler);

export default router;
