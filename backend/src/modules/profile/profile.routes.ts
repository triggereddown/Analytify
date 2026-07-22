import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  getMyProfileHandler,
  setUsernameHandler,
  setVisibilityHandler,
} from "./profile.controller.js";

const router = express.Router();

router.get("/me", authMiddleware, getMyProfileHandler);
router.patch("/username", authMiddleware, setUsernameHandler);
router.patch("/visibility", authMiddleware, setVisibilityHandler);

export default router;
