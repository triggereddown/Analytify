import React, { useState } from "react";

export const Heatmap = ({
  data = [],
  title = "Consistency Heatmap",
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
    <div className="w-full bg-[#111] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-200">{title}</h3>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
        {/* Heatmap Legend */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Less</span>
          <div className="w-3.5 h-3.5 rounded-sm bg-white/[0.02] border border-white/[0.03]" />
          <div className="w-3.5 h-3.5 rounded-sm bg-orange-950/40 border border-orange-500/20" />
          <div className="w-3.5 h-3.5 rounded-sm bg-orange-800/40 border border-orange-500/30" />
          <div className="w-3.5 h-3.5 rounded-sm bg-orange-600/50 border border-orange-500/40" />
          <div className="w-3.5 h-3.5 rounded-sm bg-orange-500" />
          <span>More</span>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Grid Wrapper */}
        <div className="flex gap-3 min-w-[760px]">
          {/* Day of Week Labels */}
          <div className="flex flex-col justify-between text-[10px] text-gray-500 font-semibold pr-2 py-1 select-none">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
            <span>Sun</span>
          </div>

          {/* Heatmap Cells */}
          <div className="grid grid-rows-7 grid-flow-col gap-1.5 flex-1">
            {data.map((day, index) => (
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
            className="fixed z-50 pointer-events-none bg-[#161616] border border-white/10 text-white rounded-xl p-3 shadow-2xl flex flex-col gap-1 text-[11px] min-w-[150px] backdrop-blur-md transition-opacity duration-150 animate-fade-in"
            style={{
              left: `${hoveredDay.x}px`,
              top: `${hoveredDay.y}px`,
            }}
          >
            <span className="font-bold text-gray-400">{formatDate(hoveredDay.date)}</span>
            <span className="text-orange-500 font-black">
              {hoveredDay.completedSessions} completed sessions
            </span>
            <span className="text-gray-400">
              {hoveredDay.focusMinutes} minutes of focus time
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Heatmap;
