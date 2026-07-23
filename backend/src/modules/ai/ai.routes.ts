import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { chat, context, report } from "./ai.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/context", context);
router.get("/report", report);
router.post("/chat", chat);

export default router;
