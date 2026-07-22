import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail, incrementLoginCount } from "./auth.repository.js";
import { BadRequestError, ConflictError, UnauthorizedError } from "../../utils/httpError.js";
import type { User } from "../../generated/prisma/client.js";
import type { SubscriptionTier } from "../../generated/prisma/enums.js";

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "7d";

// TEACHING NOTE — interfaces for function inputs/outputs:
// Naming these shapes (RegisterInput, PublicUser) does two things: (1) it
// documents the function's contract right where it's used, and (2) if a
// caller passes the wrong shape — e.g. forgets `password` — TypeScript
// catches it at the CALL SITE (in auth.controller.ts), not buried inside
// this file. Compare to the old JS version, where a typo'd field name
// would silently become `undefined` and only fail at runtime.
interface RegisterInput {
  name?: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface PublicUser {
  id: string;
  name: string | null;
  email: string;
}

const signToken = (userId: string, tier: SubscriptionTier): string =>
  jwt.sign({ id: userId, tier }, process.env.JWT_SECRET as string, {
    expiresIn: TOKEN_EXPIRY,
  });

// TEACHING NOTE — this accepts a plain `User`, but callers below pass a
// `UserWithBilling` (User + billing relation). That's fine: TypeScript
// uses STRUCTURAL typing, meaning "has at least these fields" is enough —
// a value with EXTRA fields is still assignable where fewer are expected.
const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

/**
 * Registers a new user. Rejects duplicate emails explicitly (rather than
 * letting Postgres's unique-constraint violation bubble up as an opaque 500).
 */
export const registerUser = async ({
  name,
  email,
  password,
}: RegisterInput): Promise<{ success: true; message: string; user: PublicUser }> => {
  if (!name || !email || !password) {
    throw new BadRequestError("Name, email and password are required");
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({ name, email, password: hashedPassword });

  return {
    success: true,
    message: "User registered successfully",
    user: toPublicUser(user),
  };
};

/**
 * Authenticates a user and issues a JWT.
 */
export const loginUser = async ({
  email,
  password,
}: LoginInput): Promise<{ token: string; user: PublicUser & { tier: SubscriptionTier } }> => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid email or password");
  }

  await incrementLoginCount(user.id);

  // Every user is guaranteed a Billing row (created atomically at
  // registration — see auth.repository.ts createUser), so this should
  // never actually be null; the fallback exists only to satisfy TS's
  // strict null-checking, not because it's expected to trigger.
  const tier: SubscriptionTier = user.billing?.tier ?? "free";
  const token = signToken(user.id, tier);

  return {
    token,
    user: { ...toPublicUser(user), tier },
  };
};
