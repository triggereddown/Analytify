import { findUserByUsername } from "../profile/profile.repository.js";
import {
  calculateFocusHeatmap,
  calculateFocusStreak,
  calculateConsistencyScore,
  type HeatmapDay,
  type FocusStreak,
} from "../analytics/analytics.service.js";
import { cacheGet, cacheSet } from "../../config/redis.js";
import { NotFoundError } from "../../utils/httpError.js";

const publicProfileCacheKey = (username: string): string => `public-profile:${username}`;

export interface PublicProfile {
  username: string | null;
  name: string | null;
  heatmap: HeatmapDay[];
  streak: FocusStreak;
  consistencyScore: number;
}

/**
 * Builds the payload for an unauthenticated /u/:username page.
 *
 * Deliberately reuses the same analytics functions the authenticated
 * dashboard uses (calculateFocusHeatmap etc.) rather than duplicating
 * aggregation logic — this endpoint is a different *view* of the same
 * data, not a different computation.
 *
 * Only non-sensitive fields are ever returned: no email, no session-level
 * detail, no billing/tier info. Throws NotFoundError both when the
 * username doesn't exist and when the profile is private, so an attacker
 * cannot distinguish "no such user" from "user exists but is private".
 */
export const getPublicProfile = async (username: string): Promise<PublicProfile> => {
  const cacheKey = publicProfileCacheKey(username);
  const cached = await cacheGet<PublicProfile>(cacheKey);
  if (cached) return cached;

  const user = await findUserByUsername(username);
  if (!user || !user.isPublic) {
    throw new NotFoundError("Profile not found");
  }

  const [heatmap, streak, consistencyScore] = await Promise.all([
    calculateFocusHeatmap(user.id),
    calculateFocusStreak(user.id),
    calculateConsistencyScore(user.id),
  ]);

  const profile: PublicProfile = {
    username: user.username,
    name: user.name,
    heatmap,
    streak,
    consistencyScore,
  };

  // Short TTL: public profiles don't need to be real-time, and this keeps
  // repeated visits (e.g. a shared link going semi-viral) off the DB.
  await cacheSet(cacheKey, profile, 300);

  return profile;
};
