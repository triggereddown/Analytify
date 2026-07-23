import React, { useState } from "react";
import { motion } from "framer-motion";

export const Heatmap = ({
  data = [],
  title = "Training Grid",
  subtitle = "Completed focus sessions over the past 365 days.",
}) => {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Group intensity levels
  const getIntensityClass = (count) => {
    if (count === 0) return "bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.08]";
    if (count === 1) return "bg-orange-950/40 border border-orange-500/20 hover:bg-orange-950/60";
    if (count === 2) return "bg-orange-800/40 border border-orange-500/30 hover:bg-orange-800/60";
    if (count === 3) return "bg-orange-600/50 border border-orange-500/40 hover:bg-orange-600/70";
    return "bg-orange-500 border border-orange-400/50 hover:bg-orange-400";
  };

  // Quick helper to format date strings for readability in tooltip
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative w-full overflow-hidden rounded-[2.5rem] border border-white/7 bg-[#0b0f17] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-100/70">Archive Map</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-100">{title}</h3>
          <p className="text-sm text-gray-400 mt-2">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Less</span>
          <div className="w-3.5 h-3.5 rounded-sm bg-white/[0.02] border border-white/[0.03]" />
          <div className="w-3.5 h-3.5 rounded-sm bg-cyan-950/60 border border-cyan-500/20" />
          <div className="w-3.5 h-3.5 rounded-sm bg-sky-800/50 border border-sky-400/30" />
          <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500/55 border border-cyan-300/40" />
          <div className="w-3.5 h-3.5 rounded-sm bg-amber-400" />
          <span>More</span>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="flex gap-3 min-w-[760px]">
          <div className="flex flex-col justify-between text-[10px] text-gray-500 font-semibold pr-2 py-1 select-none">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>

          <div className="grid grid-rows-7 grid-flow-col gap-1.5 flex-1">
            {data.map((day) => (
              <div
                key={day.date}
                className={`w-3.5 h-3.5 rounded-[3px] transition-all duration-200 cursor-pointer ${getIntensityClass(
                  day.completedSessions
                )}`}
                onMouseEnter={(e) => {
                  const rect = e.target.getBoundingClientRect();
                  setHoveredDay({
                    ...day,
                    x: rect.left + window.scrollX - 70,
                    y: rect.top + window.scrollY - 85,
                  });
                }}
                onMouseLeave={() => setHoveredDay(null)}
              />
            ))}
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredDay && (
          <div
            className="fixed z-50 pointer-events-none min-w-[160px] rounded-xl border border-cyan-300/18 bg-[#08111d]/96 p-3 text-[11px] text-white shadow-2xl backdrop-blur-md transition-opacity duration-150"
            style={{
              left: `${hoveredDay.x}px`,
              top: `${hoveredDay.y}px`,
            }}
          >
            <span className="font-bold text-gray-400">{formatDate(hoveredDay.date)}</span>
            <span className="font-black text-cyan-200">
              {hoveredDay.completedSessions} session clears
            </span>
            <span className="text-gray-400">
              {hoveredDay.focusMinutes} focus minutes banked
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Heatmap;
