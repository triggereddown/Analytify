import { prisma } from "../../config/prisma.js";
import type { User } from "../../generated/prisma/client.js";

// ─── Data-access layer ──────────────────────────────────────────────────────

export const findUserByUsername = (username: string): Promise<User | null> =>
  prisma.user.findUnique({ where: { username } });

// TEACHING NOTE — this narrower return type documents intent:
// The Prisma `select` below only fetches 4 columns, but Prisma's own
// inferred return type would already reflect that automatically. Naming
// it `ProfileFields` here is purely for READABILITY at call sites in
// profile.service.ts — it's optional, not required for correctness.
export type ProfileFields = Pick<User, "id" | "name" | "username" | "isPublic">;

export const findProfileFieldsById = (userId: string): Promise<ProfileFields | null> =>
  prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, isPublic: true },
  });

// TEACHING NOTE — `Partial<Pick<...>>` again, same pattern as billing.repository.ts:
// setUsername only ever updates `username`; setProfileVisibility only ever
// updates `isPublic`. Rather than two near-identical repository functions,
// one flexible update function with a partial-fields type covers both.
type ProfileUpdateFields = Partial<Pick<User, "username" | "isPublic">>;

export const updateProfile = (userId: string, fields: ProfileUpdateFields): Promise<ProfileFields> =>
  prisma.user.update({
    where: { id: userId },
    data: fields,
    select: { id: true, name: true, username: true, isPublic: true },
  });
