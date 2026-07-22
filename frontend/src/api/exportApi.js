import API from "./api";

/**
 * Fetches the CSV export as a Blob (not JSON) so it can be saved as a file.
 * Premium-only on the backend — callers should handle a 403 response by
 * prompting the user to upgrade rather than treating it as a generic error.
 */
export const fetchSessionsCsv = () =>
  API.get("/export/sessions.csv", { responseType: "blob" });
