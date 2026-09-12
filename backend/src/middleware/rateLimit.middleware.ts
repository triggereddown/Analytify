import rateLimit from "express-rate-limit";

// Three tiers, not one blanket limit: auth endpoints are the actual
// brute-force/credential-stuffing target so they get the tightest window;
// AI endpoints are the most expensive (real upstream API calls, billed by
// the minute in a paid tier) so they're limited independent of general
// traffic; everything else gets a generous ceiling that only stops actual
// abuse, not normal use.

/** Login/register — tight enough to make credential stuffing impractical. */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

/** AI endpoints — protects the upstream provider quota, not just this server. */
export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many AI requests. Please slow down." },
});

/** Baseline for every other route — generous, just a backstop against abuse. */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again shortly." },
});
