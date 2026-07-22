import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateSessionsCsv } from "./export.service.js";

/**
 * GET /api/export/sessions.csv
 * Gated behind requireTier("premium") — see export.routes.ts.
 * Streams the CSV as a file download rather than a JSON response.
 */
export const exportSessionsCsvHandler = asyncHandler(async (req: Request, res: Response) => {
  const csv = await generateSessionsCsv(req.user!.id);
  const filename = `analytify-sessions-${new Date().toISOString().split("T")[0]}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
});
