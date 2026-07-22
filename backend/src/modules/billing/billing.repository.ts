import { prisma } from "../../config/prisma.js";
import type { Billing, SubscriptionTier, SubscriptionStatus } from "../../generated/prisma/client.js";

// ─── Data-access layer ──────────────────────────────────────────────────────
// Billing is its own table now (see prisma/schema.prisma) instead of a
// nested object on User — this module is the only place allowed to read/
// write it directly, same rule as the old Mongoose version.

// TEACHING NOTE — `Partial<T>`:
// `Partial<Pick<Billing, ...>>` means "an object with SOME (or none) of
// these fields, each optional." updateBilling is used for two different
// partial updates (tier-only via setTierManually, and later a full set of
// fields from a payment webhook) — Partial lets one function signature
// cover both without a union of many specific interfaces.
type BillingUpdateFields = Partial<
  Pick<Billing, "tier" | "subscriptionStatus" | "provider" | "customerId" | "subscriptionId" | "currentPeriodEnd">
>;

export const getBillingByUserId = (userId: string): Promise<Billing | null> =>
  prisma.billing.findUnique({ where: { userId } });

/**
 * Merges the given fields into a user's Billing row.
 * Used by both the (future) webhook handler and admin/manual overrides.
 */
export const updateBilling = (userId: string, fields: BillingUpdateFields): Promise<Billing> =>
  prisma.billing.update({
    where: { userId },
    data: fields,
  });

export type { SubscriptionTier, SubscriptionStatus };
