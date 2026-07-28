import { BadRequestError, NotFoundError } from "../../utils/httpError.js";
import {
  archiveMemoryNote,
  createMemoryNote,
  deleteMemoryNote,
  findActiveMemoryNotes,
  findMemoryNoteById,
  searchMemoryNotes,
} from "./memory.repository.js";
import type { MemoryNote, MemoryNoteCategory } from "../../generated/prisma/client.js";

const VALID_CATEGORIES = ["idea", "fact", "task", "reflection", "resource"] as const;

export const isValidMemoryCategory = (value: string): value is MemoryNoteCategory =>
  (VALID_CATEGORIES as readonly string[]).includes(value);

/**
 * Direct manual capture (no AI categorization) — kept available so the
 * feature still works if the AI provider is down or the user wants to
 * explicitly set the category/tags themselves instead of trusting the model.
 */
export const addMemoryNote = async ({
  userId,
  content,
  category,
  tags,
  sourceContext,
}: {
  userId: string;
  content: unknown;
  category: unknown;
  tags?: unknown;
  sourceContext?: unknown;
}): Promise<MemoryNote> => {
  const trimmedContent = String(content ?? "").trim();
  if (!trimmedContent) {
    throw new BadRequestError("Content is required");
  }

  if (typeof category !== "string" || !isValidMemoryCategory(category)) {
    throw new BadRequestError(`Invalid memory category: ${String(category)}`);
  }

  const normalizedTags = Array.isArray(tags)
    ? tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0).map((tag) => tag.trim())
    : [];

  return createMemoryNote({
    userId,
    content: trimmedContent,
    category,
    tags: normalizedTags,
    sourceContext: typeof sourceContext === "string" ? sourceContext.trim() || null : null,
  });
};

export const listMemoryNotes = async (
  userId: string,
  categoryFilter?: unknown,
  tagFilter?: unknown,
): Promise<MemoryNote[]> => {
  const category =
    categoryFilter === undefined
      ? undefined
      : (() => {
          if (typeof categoryFilter !== "string" || !isValidMemoryCategory(categoryFilter)) {
            throw new BadRequestError(`Invalid memory category filter: ${String(categoryFilter)}`);
          }
          return categoryFilter;
        })();

  const tag = typeof tagFilter === "string" && tagFilter.trim() ? tagFilter.trim() : undefined;

  return findActiveMemoryNotes(userId, { category, tag });
};

export const searchMemory = async (userId: string, query: unknown): Promise<MemoryNote[]> => {
  const trimmedQuery = String(query ?? "").trim();
  if (!trimmedQuery) {
    throw new BadRequestError("Search query is required");
  }
  return searchMemoryNotes(userId, trimmedQuery);
};

export const removeMemoryNote = async (userId: string, noteId: string): Promise<{ success: true }> => {
  const existing = await findMemoryNoteById(noteId, userId);
  if (!existing) {
    throw new NotFoundError("Memory note not found");
  }
  await deleteMemoryNote(noteId);
  return { success: true };
};

export const archiveMemory = async (userId: string, noteId: string): Promise<MemoryNote> => {
  const existing = await findMemoryNoteById(noteId, userId);
  if (!existing) {
    throw new NotFoundError("Memory note not found");
  }
  return archiveMemoryNote(noteId);
};
