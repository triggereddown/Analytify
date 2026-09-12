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
  totalFocusHours: number;
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

  const totalFocusMinutes = heatmap.reduce((sum, day) => sum + day.focusMinutes, 0);

  const profile: PublicProfile = {
    username: user.username,
    name: user.name,
    heatmap,
    streak,
    consistencyScore,
    totalFocusHours: Math.round(totalFocusMinutes / 60),
  };

  // Short TTL: public profiles don't need to be real-time, and this keeps
  // repeated visits (e.g. a shared link going semi-viral) off the DB.
  await cacheSet(cacheKey, profile, 300);

  return profile;
};

/**
 * Renders a Shields.io-style SVG badge for embedding in a README, e.g.
 * ![focus](https://.../api/public/:username/badge.svg) — mirrors the
 * Wakatime/CodeTime badge pattern devs already expect on GitHub profiles.
 */
export const getPublicProfileBadgeSvg = async (username: string): Promise<string> => {
  const profile = await getPublicProfile(username);

  const label = "focus streak";
  const value = `${profile.streak.currentStreak} days · ${profile.totalFocusHours}h`;

  const labelWidth = 70 + label.length * 5.2;
  const valueWidth = 70 + value.length * 6.2;
  const totalWidth = Math.round(labelWidth + valueWidth);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#333"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="#f97316"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
};
