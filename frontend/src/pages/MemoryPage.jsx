import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  archiveMemoryNote,
  captureMemoryNoteWithAi,
  deleteMemoryNote,
  listMemoryNotes,
  searchMemoryNotes,
} from "../api/memoryApi";
import { Card, FieldTextarea, MonoLabel, PrimaryButton, SectionHeading } from "../components/ui";

// Category is a genuine semantic distinction (not decorative), so it keeps
// its own hue per category — but as thin border+text only, matching the
// "accent never fills a background" rule used everywhere else.
const CATEGORY_PILL = {
  idea: "border-purple-400/40 text-purple-300",
  fact: "border-sky-400/40 text-sky-300",
  task: "border-orange-400/40 text-orange-300",
  reflection: "border-pink-400/40 text-pink-300",
  resource: "border-emerald-400/40 text-emerald-300",
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
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <MonoLabel>Second brain</MonoLabel>
          <h1 className="mt-4 font-serif text-4xl italic tracking-tight text-white md:text-5xl">Memory</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-gray-400">
            Ideas, facts, and reflections captured in passing — searchable later instead of lost in a chat scrollback.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="h-fit space-y-6">
            <Card className="p-6">
              <MonoLabel className="block">AI capture</MonoLabel>
              <form onSubmit={handleAiCapture} className="mt-4 space-y-3">
                <FieldTextarea
                  value={aiContent}
                  onChange={(e) => setAiContent(e.target.value)}
                  rows={4}
                  placeholder="Paste any thought, fact, or idea — the AI will categorize and tag it..."
                />
                <PrimaryButton type="submit" disabled={capturing || !aiContent.trim()} className="w-full justify-center">
                  {capturing ? "Capturing..." : "Capture Note"}
                </PrimaryButton>
              </form>
            </Card>

            <Card className="p-6">
              <MonoLabel className="block">Search</MonoLabel>
              <form onSubmit={handleSearch} className="mt-4 flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your memory..."
                  className="flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500/40"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-gray-300 hover:text-white"
                >
                  <SearchRoundedIcon sx={{ fontSize: 18 }} />
                </button>
              </form>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <PsychologyRoundedIcon sx={{ fontSize: 18 }} className="text-orange-500" />
                <SectionHeading>Captured notes</SectionHeading>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-400">Loading notes...</p>
                ) : notes.length === 0 ? (
                  <p className="rounded-[5px] border border-dashed border-white/10 p-6 text-center text-sm text-gray-400">
                    No notes yet — capture your first thought.
                  </p>
                ) : (
                  notes.map((note) => (
                    <article key={note.id} className="rounded-[12px] border border-white/10 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className={`rounded-full border px-3 py-1 font-dm-mono text-[10px] uppercase tracking-[0.08em] ${CATEGORY_PILL[note.category] || CATEGORY_PILL.fact}`}>
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
                            <span key={tag} className="rounded-full border border-white/10 px-2.5 py-0.5 font-dm-mono text-[10px] text-gray-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MemoryPage;
