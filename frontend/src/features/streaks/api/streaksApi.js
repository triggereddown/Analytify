import API from "../../../api/api";

/** Fetch the logged-in user's current freeze token balance. */
export const fetchFreezeTokens = () => API.get("/streaks/freeze-tokens");
