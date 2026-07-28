import { prisma } from "../../config/prisma.js";
import type { MemoryNote, MemoryNoteCategory } from "../../generated/prisma/client.js";

// This file only knows how to read/write memory_notes rows. Categorization
// and tag assignment happen in the AI layer before create() is ever called.

type CreateMemoryNoteInput = {
  userId: string;
  content: string;
  category: MemoryNoteCategory;
  tags: string[];
  sourceContext?: string | null;
};

export const createMemoryNote = (input: CreateMemoryNoteInput): Promise<MemoryNote> =>
  prisma.memoryNote.create({ data: input });

export const findMemoryNoteById = (id: string, userId: string): Promise<MemoryNote | null> =>
  prisma.memoryNote.findFirst({ where: { id, userId } });

/**
 * Active (non-archived) notes, newest first. This is the default view for
 * the memory sidebar — archived notes are hidden but never deleted, since
 * the whole point of a second brain is that nothing is truly thrown away.
 */
export const findActiveMemoryNotes = (
  userId: string,
  filters: { category?: MemoryNoteCategory; tag?: string } = {},
  limit = 50,
): Promise<MemoryNote[]> =>
  prisma.memoryNote.findMany({
    where: {
      userId,
      archivedAt: null,
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.tag ? { tags: { has: filters.tag } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

/**
 * Plain substring search over note content. This is intentionally simple
 * (ILIKE, not embeddings/pgvector) — good enough for one user's note volume,
 * and avoids standing up a vector extension before it's proven necessary.
 */
export const searchMemoryNotes = (userId: string, query: string, limit = 20): Promise<MemoryNote[]> =>
  prisma.memoryNote.findMany({
    where: {
      userId,
      archivedAt: null,
      content: { contains: query, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

export const archiveMemoryNote = (id: string): Promise<MemoryNote> =>
  prisma.memoryNote.update({ where: { id }, data: { archivedAt: new Date() } });

export const deleteMemoryNote = (id: string): Promise<MemoryNote> =>
  prisma.memoryNote.delete({ where: { id } });
