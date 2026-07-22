import { prisma } from "../../config/prisma.js";
import type { User, Billing } from "../../generated/prisma/client.js";

// ─── Data-access layer ──────────────────────────────────────────────────────
// Keeps Prisma/query concerns out of auth.service.ts so the service reads
// as pure business logic (matches the pattern in pomodoro.repository.ts).

interface CreateUserInput {
  name?: string | null;
  email: string;
  password: string;
}

// TEACHING NOTE — `User & { billing: Billing | null }`:
// This is an "intersection type" — it describes an object that has ALL of
// User's fields PLUS a `billing` field. Prisma's generated `User` type
// does NOT include relations by default (billing lives in a separate
// table), so when a query uses `include: { billing: true }`, the RETURN
// TYPE needs to reflect that extra field manually like this. Prisma can
// also generate this shape for you automatically via `Prisma.UserGetPayload`,
// but a hand-written intersection is easier to read while learning.
export type UserWithBilling = User & { billing: Billing | null };

export const findUserByEmail = (email: string): Promise<UserWithBilling | null> =>
  prisma.user.findUnique({ where: { email }, include: { billing: true } });

export const findUserById = (id: string): Promise<User | null> =>
  prisma.user.findUnique({ where: { id } });

/**
 * Creates a user AND its Billing row together, atomically.
 *
 * TEACHING NOTE — why this is needed at all (Mongo vs. Postgres):
 * In the old Mongoose schema, `billing` was a nested sub-document with a
 * schema-level default, so a bare `User.create(...)` always produced a
 * user with billing attached "for free." In Postgres, Billing is its OWN
 * TABLE with a foreign key back to User — nothing creates that second row
 * automatically. Prisma's nested `create` (billing: { create: {} }) does
 * both inserts in a single transaction, so a user can never exist without
 * a billing row (avoids ever having to null-check `user.billing` downstream).
 */
export const createUser = ({ name, email, password }: CreateUserInput): Promise<User> =>
  prisma.user.create({
    data: {
      name,
      email,
      password,
      billing: { create: {} }, // defaults to tier: "free", subscriptionStatus: "none"
    },
  });

export const incrementLoginCount = (userId: string): Promise<User> =>
  prisma.user.update({
    where: { id: userId },
    data: { loginCount: { increment: 1 } },
  });
