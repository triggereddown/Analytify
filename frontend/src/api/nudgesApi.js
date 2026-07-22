import API from "./api";

/** Fetch whether the burnout nudge should currently be shown. */
export const fetchBurnoutNudge = () => API.get("/nudges/burnout");

/** Dismiss the burnout nudge at its current score. */
export const dismissBurnoutNudge = () => API.post("/nudges/burnout/dismiss");
