import { getSessionsForExport } from "../pomodoro/pomodoro.repository.js";

const CSV_HEADERS = ["Session ID", "Task", "Status", "Start Time", "End Time", "Duration (minutes)"];

/**
 * Escapes a single CSV field per RFC 4180: wrap in double quotes and
 * double-up any embedded quotes. Only fields that actually need it get
 * wrapped, to keep the output readable for the common case (no commas/
 * quotes/newlines in the value).
 *
 * TEACHING NOTE — why this matters even though we don't use a CSV library:
 * Task titles are free-text the user typed — a title like `Fix "login" bug, v2`
 * contains both a comma and quotes. Without escaping, that would silently
 * corrupt the CSV's column structure for that row. This is the one part of
 * "just join with commas" that's genuinely unsafe to skip.
 */
const escapeCsvField = (value: string): string => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const toCsvRow = (fields: (string | number | null)[]): string =>
  fields.map((f) => escapeCsvField(f === null ? "" : String(f))).join(",");

/**
 * Builds a CSV export of a user's full pomodoro session history.
 * Returns the raw CSV text — the controller is responsible for setting
 * the download headers and streaming it to the response.
 */
export const generateSessionsCsv = async (userId: string): Promise<string> => {
  const sessions = await getSessionsForExport(userId);

  const rows = sessions.map((s) =>
    toCsvRow([
      s.id,
      s.task?.title ?? "",
      s.status,
      s.startTime ? s.startTime.toISOString() : "",
      s.endTime ? s.endTime.toISOString() : "",
      s.duration ?? "",
    ]),
  );

  // TEACHING NOTE — \r\n, not \n:
  // RFC 4180 (the CSV spec) specifies CRLF line endings. Most tools
  // (Excel, Google Sheets) tolerate bare \n too, but CRLF is the actually
  // correct choice and costs nothing to get right.
  return [toCsvRow(CSV_HEADERS), ...rows].join("\r\n");
};
