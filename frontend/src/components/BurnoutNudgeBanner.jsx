import React, { useEffect, useState } from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloseIcon from "@mui/icons-material/Close";
import { dismissBurnoutNudge, fetchBurnoutNudge } from "../api/nudgesApi";

/**
 * Prominent, dismissible banner shown above the fold when the server-side
 * burnout detector (calculateBurnoutMetric) reports medium/high risk.
 * Fetches its own state so it can be dropped in anywhere without threading
 * burnout data through useDashboardData.
 *
 * Dismissal is remembered server-side by SCORE, not just a boolean — see
 * nudges.service.ts — so this banner reappears automatically if burnout
 * risk climbs further after being dismissed, rather than being silenced
 * forever after the first dismiss.
 */
const BurnoutNudgeBanner = () => {
  const [nudge, setNudge] = useState(null);
  const [dismissing, setDismissing] = useState(false);
  const [hiddenLocally, setHiddenLocally] = useState(false);

  useEffect(() => {
    fetchBurnoutNudge()
      .then((res) => setNudge(res.data))
      .catch(() => setNudge(null)); // non-critical widget — fail silently
  }, []);

  const handleDismiss = async () => {
    setDismissing(true);
    setHiddenLocally(true); // optimistic — banner disappears immediately
    try {
      await dismissBurnoutNudge();
    } catch {
      setHiddenLocally(false); // roll back if the dismissal didn't actually save
    } finally {
      setDismissing(false);
    }
  };

  if (!nudge?.shouldShow || hiddenLocally) return null;

  const isHigh = nudge.burnout.burnoutRisk === "high";

  return (
    <div
      className={`flex items-start gap-4 rounded-3xl p-6 border ${
        isHigh ? "bg-red-500/10 border-red-500/30" : "bg-yellow-500/10 border-yellow-500/30"
      }`}
    >
      <WarningAmberIcon className={isHigh ? "text-red-400" : "text-yellow-400"} sx={{ fontSize: 28 }} />
      <div className="flex-1">
        <h3 className={`text-sm font-bold uppercase tracking-widest mb-1 ${isHigh ? "text-red-400" : "text-yellow-400"}`}>
          {isHigh ? "High burnout risk detected" : "Signs of burnout building"}
        </h3>
        <p className="text-sm text-gray-300">{nudge.burnout.reasoning[0]}</p>
      </div>
      <button
        onClick={handleDismiss}
        disabled={dismissing}
        className="text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
        aria-label="Dismiss"
      >
        <CloseIcon sx={{ fontSize: 20 }} />
      </button>
    </div>
  );
};

export default BurnoutNudgeBanner;
