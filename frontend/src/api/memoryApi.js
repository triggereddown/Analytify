import API from "./api";

/**
 * Manual CRUD against /api/memory (explicit category/tags, no AI involved).
 */
export const listMemoryNotes = (params = {}) => API.get("/memory", { params });

export const searchMemoryNotes = (q) => API.get("/memory/search", { params: { q } });

export const createMemoryNote = (payload) => API.post("/memory", payload);

export const archiveMemoryNote = (id) => API.patch(`/memory/${id}/archive`);

export const deleteMemoryNote = (id) => API.delete(`/memory/${id}`);

/**
 * AI-assisted capture/recall against /api/ai/memory/* — the model infers
 * category/tags from raw free-text content instead of the user picking them.
 */
export const captureMemoryNoteWithAi = (payload) => API.post("/ai/memory/capture", payload);

export const recallMemoryWithAi = (q) => API.get("/ai/memory/recall", { params: { q } });
