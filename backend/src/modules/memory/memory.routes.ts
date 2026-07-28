import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  archiveMemoryNoteHandler,
  createMemoryNoteHandler,
  deleteMemoryNoteHandler,
  listMemoryNotesHandler,
  searchMemoryHandler,
} from "./memory.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.post("/", createMemoryNoteHandler);
router.get("/", listMemoryNotesHandler);
router.get("/search", searchMemoryHandler);
router.patch("/:id/archive", archiveMemoryNoteHandler);
router.delete("/:id", deleteMemoryNoteHandler);

export default router;
