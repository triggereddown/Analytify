import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  archiveMemoryNote,
  captureMemoryNoteWithAi,
  deleteMemoryNote,
  listMemoryNotes,
  searchMemoryNotes,
} from "../api/memoryApi";

const CATEGORY_PILL = {
  idea: "border-purple-400/20 bg-purple-500/10 text-purple-200",
  fact: "border-sky-400/20 bg-sky-500/10 text-sky-200",
  task: "border-orange-400/20 bg-orange-500/10 text-orange-200",
  reflection: "border-pink-400/20 bg-pink-500/10 text-pink-200",
  resource: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
};

/**
 * Memory notes page. Two capture paths, mirroring the backend split:
 *  - AI capture (/api/ai/memory/capture): paste raw text, model infers
 *    category + tags.
 *  - Manual capture (/api/memory): explicit category set by the user.
 * Search hits /api/ai/memory/recall for semantic recall when a query is
 * present, otherwise falls back to the plain list.
 */
const MemoryPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const [aiContent, setAiContent] = useState("");
  const [capturing, setCapturing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listMemoryNotes();
      setNotes(res.data);
    } catch (err) {
      console.error("Failed to load memory notes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      return load();
    }
    setSearching(true);
    try {
      const res = await searchMemoryNotes(query.trim());
      setNotes(res.data);
    } catch (err) {
      console.error("Failed to search memory", err);
    } finally {
      setSearching(false);
    }
  };

  const handleAiCapture = async (e) => {
    e.preventDefault();
    if (!aiContent.trim()) return;
    setCapturing(true);
    try {
      await captureMemoryNoteWithAi({ content: aiContent.trim() });
      setAiContent("");
      await load();
    } catch (err) {
      console.error("Failed to capture memory note", err);
    } finally {
      setCapturing(false);
    }
  };

  const handleArchive = async (id) => {
    try {
      await archiveMemoryNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to archive note", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMemoryNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-3 py-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-orange-500">Second Brain</span>
        </div>
        <h1 className="mt-5 text-5xl font-medium tracking-tight md:text-6xl">Memory</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-400/80">
          Ideas, facts, and reflections captured in passing — searchable later instead of lost in a chat scrollback.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-fit space-y-6"
        >
          <div className="rounded-[2rem] border border-white/7 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex items-center gap-2">
              <AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} className="text-orange-300" />
              <p className="text-[10px] uppercase tracking-[0.28em] text-orange-200/70">AI Capture</p>
            </div>
            <form onSubmit={handleAiCapture} className="space-y-3">
              <textarea
                value={aiContent}
                onChange={(e) => setAiContent(e.target.value)}
                rows={4}
                placeholder="Paste any thought, fact, or idea — the AI will categorize and tag it..."
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400/40"
              />
              <button
                type="submit"
                disabled={capturing || !aiContent.trim()}
                className="w-full rounded-full bg-orange-600 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 disabled:opacity-50"
              >
                {capturing ? "Capturing..." : "Capture Note"}
              </button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-white/7 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-orange-200/70">Search</p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your memory..."
                className="flex-1 rounded-full border border-white/10 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-orange-400/40"
              />
              <button
                type="submit"
                disabled={searching}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-gray-300 hover:text-white"
              >
                <SearchRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </form>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-[2rem] border border-white/7 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
        >
          <div className="mb-5 flex items-center gap-3">
            <PsychologyRoundedIcon sx={{ fontSize: 18 }} className="text-orange-300" />
            <h2 className="text-xl font-semibold tracking-tight">Captured notes</h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-400">Loading notes...</p>
            ) : notes.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-gray-400">
                No notes yet — capture your first thought.
              </p>
            ) : (
              notes.map((note) => (
                <article key={note.id} className="rounded-[1.6rem] border border-white/7 bg-black/20 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${CATEGORY_PILL[note.category] || CATEGORY_PILL.fact}`}>
                      {note.category}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleArchive(note.id)}
                        title="Archive"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gray-400 hover:text-white"
                      >
                        <ArchiveRoundedIcon sx={{ fontSize: 15 }} />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        title="Delete"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gray-400 hover:text-red-400"
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-gray-200">{note.content}</p>
                  {note.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {note.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-gray-500">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default MemoryPage;
