import express from "express";
import { getPublicProfileBadgeHandler, getPublicProfileHandler } from "./public.controller.js";

const router = express.Router();

// Intentionally NOT behind authMiddleware — this router only ever exposes
// data the profile owner has explicitly opted into sharing (see
// public.service.ts).
router.get("/:username/badge.svg", getPublicProfileBadgeHandler);
router.get("/:username", getPublicProfileHandler);

export default router;
