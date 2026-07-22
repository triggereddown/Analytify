import API from "./api";

/**
 * Fetch all advanced behavioral dashboard analytics (consistency, streaks, burnout, peak hours, heatmap).
 */
export const fetchDashboardAnalytics = () => API.get("/analytics/dashboard");

/**
 * Fetch Focus Heatmap data.
 */
export const fetchHeatmapData = () => API.get("/analytics/heatmap");

/**
 * Fetch Burnout Metrics.
 */
export const fetchBurnoutMetrics = () => API.get("/analytics/burnout");

/**
 * Fetch Peak productivity hours.
 */
export const fetchProductivityHours = () => API.get("/analytics/peak-hours");

/**
 * Fetch Deep Work Score (weighted blend of session length, interruption
 * rate, and consistency over the last 30 days).
 */
export const fetchDeepWorkScore = () => API.get("/analytics/deep-work-score");
