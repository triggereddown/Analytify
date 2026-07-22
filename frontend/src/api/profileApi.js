import API from "./api";

/**
 * Fetch the logged-in user's own profile settings (username + visibility).
 */
export const fetchMyProfile = () => API.get("/profile/me");

/**
 * Claim or change the logged-in user's public username.
 */
export const updateUsername = (username) =>
  API.patch("/profile/username", { username });

/**
 * Toggle whether the logged-in user's heatmap/streak is publicly visible.
 */
export const updateVisibility = (isPublic) =>
  API.patch("/profile/visibility", { isPublic });
