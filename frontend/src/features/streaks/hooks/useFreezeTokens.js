import { useEffect, useState } from "react";
import { fetchFreezeTokens } from "../api/streaksApi";

/**
 * Loads the user's freeze token balance. Non-critical — fails silently so
 * a slow/failed request never blocks the rest of the dashboard.
 */
export const useFreezeTokens = () => {
  const [freezeTokens, setFreezeTokens] = useState(null);

  useEffect(() => {
    fetchFreezeTokens()
      .then((res) => setFreezeTokens(res.data.freezeTokens))
      .catch(() => setFreezeTokens(null));
  }, []);

  return freezeTokens;
};
