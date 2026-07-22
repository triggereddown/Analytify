import {
  findProfileFieldsById,
  findUserByUsername,
  updateProfile,
  type ProfileFields,
} from "./profile.repository.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/httpError.js";

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

/**
 * Returns the current user's own profile settings (username + visibility).
 * Used to populate the settings form — distinct from the public-facing
 * profile view in the `public` module, which only exposes safe fields.
 */
export const getMyProfile = async (userId: string): Promise<ProfileFields> => {
  const user = await findProfileFieldsById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};

/**
 * Claims/changes the caller's public username.
 * Validated against the same pattern as the Prisma schema's expectations
 * so we can return a clean 400 instead of surfacing a raw Postgres
 * unique-constraint violation.
 */
export const setUsername = async (userId: string, rawUsername: unknown): Promise<ProfileFields> => {
  const username = String(rawUsername ?? "").trim().toLowerCase();

  if (!USERNAME_PATTERN.test(username)) {
    throw new BadRequestError(
      "Username must be 3-24 characters and contain only lowercase letters, numbers, and underscores",
    );
  }

  // TEACHING NOTE — id is now a string, not an ObjectId:
  // Mongo's `_id` required `String(existing._id) !== String(userId)` to
  // compare safely (ObjectId isn't a plain string). Postgres/Prisma's `id`
  // (a UUID) IS already a plain string, so a direct !== works — one of the
  // small correctness simplifications that fall out of the migration.
  const existing = await findUserByUsername(username);
  if (existing && existing.id !== userId) {
    throw new ConflictError("That username is already taken");
  }

  return updateProfile(userId, { username });
};

/**
 * Toggles whether the caller's heatmap/streak data is visible at
 * /u/:username without authentication.
 */
export const setProfileVisibility = async (userId: string, isPublic: unknown): Promise<ProfileFields> => {
  const user = await findProfileFieldsById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  if (isPublic && !user.username) {
    throw new BadRequestError("Set a username before making your profile public");
  }

  return updateProfile(userId, { isPublic: Boolean(isPublic) });
};
