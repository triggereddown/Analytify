import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import ForumIcon from "@mui/icons-material/Forum";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import GroupIcon from "@mui/icons-material/Group";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import BedtimeIcon from "@mui/icons-material/Bedtime";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { logDistraction } from "../api/distractionsApi";

const CATEGORIES = [
  { value: "phone", label: "Phone", Icon: PhoneIphoneIcon },
  { value: "social_media", label: "Social Media", Icon: ForumIcon },
  { value: "noise", label: "Noise", Icon: VolumeUpIcon },
  { value: "people", label: "People", Icon: GroupIcon },
  { value: "hunger_thirst", label: "Hunger/Thirst", Icon: RestaurantIcon },
  { value: "fatigue", label: "Fatigue", Icon: BedtimeIcon },
  { value: "other", label: "Other", Icon: MoreHorizIcon },
];

/**
 * Optional "what pulled you away?" prompt, shown right after the user
 * clicks Pause or Abandon (see Focus.jsx). Entirely skippable — this is
 * a data-quality nice-to-have, never a blocker on the actual pause/
 * abandon action, which the caller has already triggered before this
 * renders.
 */
const DistractionPrompt = ({ sessionId, onClose }) => {
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePick = async (category) => {
    setSelected(category);
    setSubmitting(true);
    try {
      await logDistraction({ sessionId, category, note: note.trim() || undefined });
    } catch (err) {
      console.error("Failed to log distraction", err);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-[#111] border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
        >
          <h3 className="text-lg font-bold mb-1">What pulled you away?</h3>
          <p className="text-xs text-gray-500 mb-6">Optional — helps you spot patterns over time.</p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {CATEGORIES.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => handlePick(value)}
                disabled={submitting}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl border text-[10px] font-bold uppercase tracking-wide transition-colors disabled:opacity-40 ${
                  selected === value
                    ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                    : "bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                <Icon sx={{ fontSize: 22 }} />
                {label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            maxLength={280}
            className="w-full bg-white/[0.03] border border-white/10 rounded-full px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50 mb-4"
          />

          <button
            onClick={onClose}
            className="w-full text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 py-2 transition-colors"
          >
            Skip
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DistractionPrompt;
