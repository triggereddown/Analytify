import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createCheckoutSession, getMyBilling, setTierManually } from "./billing.service.js";

/**
 * GET /api/billing/me
 * Returns the current user's billing/tier state.
 */
export const getMyBillingHandler = asyncHandler(async (req: Request, res: Response) => {
  const billing = await getMyBilling(req.user!.id);
  res.json(billing);
});

/**
 * POST /api/billing/checkout
 * Will create a provider-hosted checkout session once a payment provider
 * is wired in. Currently throws — see billing.service.ts.
 */
export const createCheckoutSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { plan } = req.body;
  const session = await createCheckoutSession(req.user!.id, plan);
  res.json(session);
});

/**
 * POST /api/billing/admin/set-tier
 * Manual tier override for admin/testing use until real billing exists.
 * Guarded by requireAdmin — see billing.routes.ts.
 */
export const setTierManuallyHandler = asyncHandler(async (req: Request, res: Response) => {
  const { userId, tier } = req.body;
  const billing = await setTierManually(userId, tier);
  res.json(billing);
});
