import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { addMemoryNote, archiveMemory, listMemoryNotes, removeMemoryNote, searchMemory } from "./memory.service.js";

export const createMemoryNoteHandler = asyncHandler(async (req: Request, res: Response) => {
  const note = await addMemoryNote({ userId: req.user!.id, ...req.body });
  res.status(201).json(note);
});

export const listMemoryNotesHandler = asyncHandler(async (req: Request, res: Response) => {
  const notes = await listMemoryNotes(req.user!.id, req.query.category, req.query.tag);
  res.json(notes);
});

export const searchMemoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const notes = await searchMemory(req.user!.id, req.query.q);
  res.json(notes);
});

export const archiveMemoryNoteHandler = asyncHandler(async (req: Request, res: Response) => {
  const note = await archiveMemory(req.user!.id, req.params.id as string);
  res.json(note);
});

export const deleteMemoryNoteHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await removeMemoryNote(req.user!.id, req.params.id as string);
  res.json(result);
});
