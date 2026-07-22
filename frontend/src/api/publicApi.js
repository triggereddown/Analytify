import axios from "axios";

// Deliberately a bare axios instance, not the shared `API` client — this
// endpoint is unauthenticated by design and must not depend on (or be
// confused with) the token-attaching interceptor used elsewhere.
const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

/**
 * Fetch a user's public profile (heatmap, streak, consistency score).
 * Throws a 404 if the username doesn't exist or the profile is private.
 */
export const fetchPublicProfile = (username) =>
  publicClient.get(`/public/${username}`);
