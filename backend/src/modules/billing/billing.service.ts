import { getBillingByUserId, updateBilling } from "./billing.repository.js";
import { BadRequestError, NotFoundError } from "../../utils/httpError.js";
import logger from "../../utils/logger.js";
import type { Billing, SubscriptionTier } from "../../generated/prisma/client.js";

// ─── Payment-provider interface (STUB) ─────────────────────────────────────
// No payment provider is wired in yet. These functions define the contract
// the rest of the app (controllers, webhooks) will call against, so that
// dropping in Stripe or Razorpay later means implementing this file only —
// no changes to routes, middleware, or callers.
//
// Intended real implementation, once a provider is chosen:
//   createCheckoutSession(userId, plan) -> provider-hosted checkout URL
//   handleProviderWebhook(rawBody, signature) -> verifies + updates billing
//
// Until then, calling these throws so misuse fails loudly instead of
// silently no-op'ing in production.

const PROVIDER_NOT_CONFIGURED =
  "Payment provider is not configured yet. Billing is currently admin-managed only.";

// TEACHING NOTE — the `_` prefix on unused parameters:
// TypeScript's strict mode doesn't error on unused params by default, but
// naming them `_userId`/`_plan` is a widely-used convention signaling
// "intentionally unused" to both humans and linters (many ESLint configs
// specifically ignore `_`-prefixed names in no-unused-vars rules).
export const createCheckoutSession = async (
  _userId: string,
  _plan: SubscriptionTier,
): Promise<never> => {
  throw new BadRequestError(PROVIDER_NOT_CONFIGURED);
};

export const handleProviderWebhook = async (
  _rawBody: unknown,
  _signature: string,
): Promise<never> => {
  throw new BadRequestError(PROVIDER_NOT_CONFIGURED);
};

// ─── Business logic usable today (no provider required) ───────────────────

export const getMyBilling = async (userId: string): Promise<Billing> => {
  const billing = await getBillingByUserId(userId);
  if (!billing) {
    throw new NotFoundError("User not found");
  }
  return billing;
};

/**
 * Manually sets a user's tier. Not exposed to end users — intended for
 * admin/CLI use (e.g. comping an account, or testing premium features)
 * until real subscription billing is wired in.
 */
export const setTierManually = async (userId: string, tier: string): Promise<Billing> => {
  // TEACHING NOTE — why this check exists even though `tier`'s parameter
  // type could just BE SubscriptionTier: this function receives `tier`
  // from an HTTP request body (see billing.controller.ts), which is
  // untyped `any` at the network boundary — a malicious or buggy client
  // could send any string. Runtime validation here is what actually
  // protects the database; the TS type alone only helps at compile time,
  // for values that originate from OUR code.
  if (tier !== "free" && tier !== "premium") {
    throw new BadRequestError("Invalid tier");
  }

  const billing = await updateBilling(userId, {
    tier,
    subscriptionStatus: tier === "premium" ? "active" : "none",
  });

  logger.info(
    { userId, tier, action: "billing_tier_manual_override" },
    `Tier manually set to "${tier}" for user ${userId}`,
  );

  return billing;
};
