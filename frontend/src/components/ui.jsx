import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

// Shared identity primitives — matches Landing.jsx's cream/cinematic system:
// black canvas, hairline borders, Almarai as the base face, Instrument
// Serif italic reserved for accent phrases, cream (#DEDBC8) as the single
// accent color. Centralized here once every page needed the same pattern,
// instead of re-copying the class strings into every file.

export const CARD = "rounded-2xl border border-white/10 bg-[#101010] font-almarai";

export const Card = ({ className = "", children, ...props }) => (
  <div className={`${CARD} ${className}`} {...props}>
    {children}
  </div>
);

/** Small uppercase tag — the "metadata, not copy" marker for eyebrows, nav, captions. */
export const MonoLabel = ({ children, className = "" }) => (
  <span className={`font-almarai text-[11px] uppercase tracking-[0.08em] text-gray-500 ${className}`}>
    {children}
  </span>
);

/** Small bordered accent pill — cream text/border only, never a filled background. */
export const Eyebrow = ({ children }) => (
  <span className="font-almarai inline-flex items-center rounded-full border border-cream/40 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-cream">
    {children}
  </span>
);

/** Italic serif section heading — the one recurring editorial signature, matching the About section. */
export const SectionHeading = ({ children, className = "" }) => (
  <h2 className={`font-instrument text-xl italic tracking-tight text-cream ${className}`}>{children}</h2>
);

/** Primary action — cream pill, black text. The sole "physically weighted" control per view. */
export const PrimaryButton = ({ className = "", children, ...props }) => (
  <button
    className={`font-almarai inline-flex items-center gap-2 rounded-full bg-cream px-5 py-2.5 text-sm font-medium text-black transition-all hover:bg-white disabled:opacity-40 ${className}`}
    {...props}
  >
    {children}
  </button>
);

/** Secondary action — ghost outline, never filled, never a second accent color. */
export const GhostButton = ({ className = "", children, ...props }) => (
  <button
    className={`font-almarai inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm text-cream transition-all hover:border-cream/40 disabled:opacity-40 ${className}`}
    {...props}
  >
    {children}
  </button>
);

/** Plain text input matching the card system — hairline border, no rounded-2xl translucency tricks. */
export const FieldInput = (props) => (
  <input
    {...props}
    className={`font-almarai w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-cream outline-none focus:border-cream/40 ${props.className ?? ""}`}
  />
);

export const FieldTextarea = (props) => (
  <textarea
    {...props}
    className={`font-almarai w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-cream outline-none focus:border-cream/40 ${props.className ?? ""}`}
  />
);

/**
 * Turns an axios error into one readable line — falls back through the
 * backend's { message } body, then a generic network-vs-server guess,
 * since a raw "Request failed with status code 400" means nothing to a user.
 */
export const getErrorMessage = (err, fallback = "Something went wrong. Please try again.") => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.request && !err?.response) return "Can't reach the server — check your connection.";
  return fallback;
};

/**
 * Brief bottom-center confirmation toast for actions that otherwise happen
 * silently (a form that just clears itself, or a failed request that only
 * logged to the console). Call `showToast(message)` for success or
 * `showToast(message, "error")` for a failure — it self-dismisses after
 * ~2.2s (errors linger a bit longer so they're actually readable).
 */
export const useToast = () => {
  const [toast, setToast] = useState(null); // { message, tone }

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), toast.tone === "error" ? 3200 : 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, tone = "success") => setToast({ message, tone });

  const Toast = () => (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className={`fixed bottom-6 left-1/2 z-50 flex max-w-sm -translate-x-1/2 items-center gap-2 rounded-full border px-5 py-3 font-almarai text-sm shadow-2xl ${
            toast.tone === "error"
              ? "border-red-400/30 bg-[#1a1010] text-red-200"
              : "border-emerald-400/30 bg-[#111] text-emerald-200"
          }`}
        >
          {toast.tone === "error" ? (
            <ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} />
          ) : (
            <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />
          )}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { showToast, Toast };
};
