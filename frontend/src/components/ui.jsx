import React from "react";

// Shared identity primitives — same system as Landing.jsx/Dashboard.jsx:
// black canvas, one elevated surface, hairline borders, italic serif for
// headings, mono chrome for labels/metadata, orange kept strictly as accent
// punctuation (icons, borders, chart color) — never a button fill. Centralized
// here once every page needed the same pattern, instead of re-copying the
// class strings into every file.

export const CARD = "rounded-[18px] border border-white/10 bg-[#0d0d0d]";

export const Card = ({ className = "", children, ...props }) => (
  <div className={`${CARD} ${className}`} {...props}>
    {children}
  </div>
);

/** Mono uppercase tag — "metadata, not copy" marker for eyebrows, nav, captions. */
export const MonoLabel = ({ children, className = "" }) => (
  <span className={`font-dm-mono text-[11px] uppercase tracking-[0.08em] text-gray-500 ${className}`}>
    {children}
  </span>
);

/** Small bordered accent pill — orange text/border only, never a filled background. */
export const Eyebrow = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-orange-500/60 px-3 py-1 font-dm-mono text-[11px] uppercase tracking-[0.08em] text-orange-500">
    {children}
  </span>
);

/** Italic serif section heading — the one recurring editorial signature. */
export const SectionHeading = ({ children, className = "" }) => (
  <h2 className={`font-serif text-xl italic tracking-tight text-white ${className}`}>{children}</h2>
);

/** Primary action — white pill, black text. The sole "physically weighted" control per view. */
export const PrimaryButton = ({ className = "", children, ...props }) => (
  <button
    className={`inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-dm-mono text-[12px] uppercase tracking-[0.08em] text-black hover:bg-gray-200 transition-all disabled:opacity-40 ${className}`}
    {...props}
  >
    {children}
  </button>
);

/** Secondary action — ghost outline, never filled, never a second accent color. */
export const GhostButton = ({ className = "", children, ...props }) => (
  <button
    className={`inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 font-dm-mono text-[12px] uppercase tracking-[0.08em] text-white hover:border-white/40 transition-all disabled:opacity-40 ${className}`}
    {...props}
  >
    {children}
  </button>
);

/** Plain text input matching the card system — hairline border, no rounded-2xl translucency tricks. */
export const FieldInput = (props) => (
  <input
    {...props}
    className={`w-full rounded-[5px] border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/40 ${props.className ?? ""}`}
  />
);

export const FieldTextarea = (props) => (
  <textarea
    {...props}
    className={`w-full rounded-[5px] border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/40 ${props.className ?? ""}`}
  />
);
