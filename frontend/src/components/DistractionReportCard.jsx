import React, { useEffect, useState } from "react";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import ForumIcon from "@mui/icons-material/Forum";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import GroupIcon from "@mui/icons-material/Group";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import BedtimeIcon from "@mui/icons-material/Bedtime";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { fetchWeeklyDistractionReport } from "../api/distractionsApi";

const CATEGORY_META = {
  phone: { label: "Phone", Icon: PhoneIphoneIcon },
  social_media: { label: "Social Media", Icon: ForumIcon },
  noise: { label: "Noise", Icon: VolumeUpIcon },
  people: { label: "People", Icon: GroupIcon },
  hunger_thirst: { label: "Hunger/Thirst", Icon: RestaurantIcon },
  fatigue: { label: "Fatigue", Icon: BedtimeIcon },
  other: { label: "Other", Icon: MoreHorizIcon },
};

/**
 * Shows the user's top distraction triggers from the last 7 days.
 * Self-contained (fetches its own data) so it can be dropped anywhere.
 * Renders nothing if there's no data yet — an empty report isn't useful
 * to show, and this avoids cluttering the dashboard for new users.
 */
const DistractionReportCard = () => {
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchWeeklyDistractionReport()
      .then((res) => setReport(res.data))
      .catch(() => setReport(null));
  }, []);

  if (!report || report.totalCount === 0) return null;

  return (
    <div className="bg-[#111] border border-white/5 rounded-3xl p-6 shadow-lg">
      <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
        Top Distractions (Last 7 Days)
      </span>
      <div className="mt-4 flex flex-col gap-3">
        {report.topCategories.slice(0, 5).map(({ category, count }) => {
          const meta = CATEGORY_META[category] ?? CATEGORY_META.other;
          const Icon = meta.Icon;
          const pct = Math.round((count / report.totalCount) * 100);
          return (
            <div key={category} className="flex items-center gap-3">
              <Icon className="text-orange-500 shrink-0" sx={{ fontSize: 18 }} />
              <span className="text-xs text-gray-300 w-28 shrink-0">{meta.label}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right shrink-0">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DistractionReportCard;
