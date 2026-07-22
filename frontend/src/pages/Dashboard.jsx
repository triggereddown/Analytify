import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthActions } from "../features/auth/hooks/useAuthActions";
import { useDashboardData } from "../features/pomodoro/hooks/useDashboardData";
import Heatmap from "../components/Heatmap";
import ShareProfileCard from "../components/ShareProfileCard";
import ExportButton from "../components/ExportButton";
import BurnoutNudgeBanner from "../components/BurnoutNudgeBanner";
import DistractionReportCard from "../components/DistractionReportCard";
import { useFreezeTokens } from "../features/streaks/hooks/useFreezeTokens";
import BoltIcon from "@mui/icons-material/Bolt";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const Dashboard = () => {
  const { stats, dailyStats, advanced, loading } = useDashboardData();
  const { logout: handleLogout } = useAuthActions();
  const navigate = useNavigate();
  const freezeTokens = useFreezeTokens();

  // Helper to convert 24h to 12h format
  const formatHour = (hour) => {
    if (hour === undefined || hour === null) return "N/A";
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h} ${ampm}`;
  };

  // Show loading only while fetching
  if (loading || !stats || !advanced) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a] text-gray-400">
        <div className="animate-pulse tracking-widest uppercase text-sm font-medium">
          Syncing Analytics Engine...
        </div>
      </div>
    );
  }

  // Empty state for new users
  if (stats.totalSessions === 0 || dailyStats.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        <nav className="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-50">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-5 w-5 rounded bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.3)] group-hover:scale-110 transition-transform" />
            <span className="text-base font-bold tracking-tight uppercase">
              Analytify
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-orange-500 transition-colors border border-white/10 px-4 py-2 rounded-full hover:border-orange-500/50"
          >
            Logout
          </button>
        </nav>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-8">
          <div className="text-center max-w-2xl">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-600 to-orange-700 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_50px_rgba(234,88,12,0.3)]">
                <BoltIcon sx={{ fontSize: 48 }} />
              </div>
              <h1 className="text-4xl font-bold mb-4 tracking-tight">
                Welcome to Analytify!
              </h1>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                You haven't completed any focus sessions yet. Start your
                productivity journey and watch your analytics come to life.
              </p>
            </div>

            <button
              onClick={() => navigate("/focus")}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-base rounded-full px-8 py-4 transition-all shadow-lg shadow-orange-900/30 hover:shadow-orange-900/50 hover:scale-105"
            >
              Start Your First Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Completed", value: stats.completed },
    { name: "Abandoned", value: stats.abandoned },
  ];

  const COLORS = ["#f97316", "#262626"];

  // Peak productivity hours data for Recharts
  const peakHoursData = advanced.peakHours.map((ph) => ({
    hourLabel: formatHour(ph.hour),
    completedSessions: ph.completedSessions,
  }));

  // Burnout styling
  const getBurnoutColor = (risk) => {
    if (risk === "high") return "text-red-500 bg-red-500/10 border-red-500/20";
    if (risk === "medium") return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-green-500 bg-green-500/10 border-green-500/20";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <nav className="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-5 w-5 rounded bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.3)] group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold tracking-tight uppercase">
            Analytify
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-orange-500 transition-colors border border-white/10 px-4 py-2 rounded-full hover:border-orange-500/50"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-10">
        {/* Burnout Nudge */}
        <BurnoutNudgeBanner />

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4">
          <div>
            <h1 className="text-4xl font-medium tracking-tight">Performance</h1>
            <p className="text-gray-400 mt-2 text-base">
              Advanced behavioral analytics for your focus sessions.
            </p>
            <div className="mt-4">
              <ExportButton />
            </div>
          </div>
          <div className="flex gap-12 border-l border-white/5 pl-8">
            <div className="flex flex-col text-center">
              <span className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">
                Sessions
              </span>
              <span className="text-3xl font-light tracking-tighter">
                {stats.totalSessions}
              </span>
            </div>
            <div className="flex flex-col text-center">
              <span className="text-xs uppercase tracking-[0.2em] text-orange-500 font-bold mb-1">
                Completed
              </span>
              <span className="text-3xl font-light tracking-tighter text-orange-500">
                {stats.completed}
              </span>
            </div>
            <div className="flex flex-col text-center">
              <span className="text-xs uppercase tracking-[0.2em] text-gray-300 font-bold mb-1">
                Abandoned
              </span>
              <span className="text-3xl font-light tracking-tighter text-gray-400">
                {stats.abandoned}
              </span>
            </div>
          </div>
        </div>

        {/* ─── PHASE 5: Advanced Analytics Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Consistency Card */}
          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              Consistency Score
            </span>
            <div className="my-4 flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight text-orange-500">
                {advanced.consistencyScore}%
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Ratio of completed sessions to total finished sessions.
            </p>
          </div>

          {/* Deep Work Score Card */}
          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              Deep Work Score
            </span>
            <div className="my-4 flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight text-orange-500">
                {advanced.deepWorkScore.score}
              </span>
              <span className="text-sm text-gray-500 font-bold">/100</span>
            </div>
            <p className="text-xs text-gray-500">
              Blends session length, interruptions, and consistency (last 30 days).
            </p>
          </div>

          {/* Streaks Card */}
          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              Focus Streaks
            </span>
            <div className="my-4 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-gray-500 font-semibold">Current</span>
                <span className="text-3xl font-black text-white flex items-center gap-1.5">
                  <LocalFireDepartmentIcon className="text-orange-500" sx={{ fontSize: 26 }} />
                  {advanced.streak.currentStreak}
                </span>
              </div>
              <div className="flex flex-col border-l border-white/10 pl-6">
                <span className="text-[10px] uppercase text-gray-500 font-semibold">Longest</span>
                <span className="text-3xl font-black text-gray-400 flex items-center gap-1.5">
                  <EmojiEventsIcon sx={{ fontSize: 26 }} />
                  {advanced.streak.longestStreak}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Consecutive days of completing at least one session.
              </p>
              {freezeTokens !== null && (
                <div
                  className="flex items-center gap-1 text-[10px] font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-1 shrink-0"
                  title="Freeze tokens auto-protect your streak if you miss a single day. Earn one every 7-day streak, up to 3."
                >
                  <AcUnitIcon sx={{ fontSize: 12 }} />
                  {freezeTokens}
                </div>
              )}
            </div>
          </div>

          {/* Peak Focus Hour Card */}
          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              Peak Focus Hour
            </span>
            <div className="my-4">
              <span className="text-3xl font-black text-orange-500 flex items-center gap-1.5">
                <AccessTimeIcon sx={{ fontSize: 26 }} />
                {advanced.peakHours[0] ? formatHour(advanced.peakHours[0].hour) : "N/A"}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Hour of the day with the highest number of completed sessions.
            </p>
          </div>

          {/* Burnout Indicator Card */}
          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                Burnout Risk
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getBurnoutColor(
                  advanced.burnout.burnoutRisk
                )}`}
              >
                {advanced.burnout.burnoutRisk}
              </span>
            </div>
            <div className="my-4 flex flex-col gap-1">
              <span className="text-3xl font-black text-white flex items-center gap-1.5">
                <WarningAmberIcon className="text-yellow-500" sx={{ fontSize: 26 }} />
                {advanced.burnout.burnoutScore}/100
              </span>
              <p className="text-[10px] text-gray-400 leading-tight">
                {advanced.burnout.reasoning[0]}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Evaluates behavioral patterns from the last 14 days.
            </p>
          </div>
        </div>

        {/* Distraction Report */}
        <DistractionReportCard />

        {/* Share Settings */}
        <ShareProfileCard />

        {/* Heatmap Grid */}
        <Heatmap data={advanced.heatmap} />

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* DAILY BAR GRAPH (Weekly completion / Focus time trends) */}
          <div className="col-span-12 lg:col-span-8 bg-[#111] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="mb-10">
              <h3 className="text-lg font-medium text-gray-200">
                Activity Trends
              </h3>
              <p className="text-sm text-gray-400">
                Daily distribution of session volume and focus duration.
              </p>
            </div>

            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyStats}
                  margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#ffffff05"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#666", fontSize: 12, fontWeight: 600 }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#666", fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#ffffff03" }}
                    contentStyle={{
                      backgroundColor: "#161616",
                      border: "1px solid rgba(249, 115, 22, 0.2)",
                      borderRadius: "12px",
                      padding: "12px",
                    }}
                    labelStyle={{
                      color: "#f97316",
                      fontWeight: "bold",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                    itemStyle={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      padding: "2px 0",
                    }}
                  />
                  <Bar
                    dataKey="sessions"
                    name="Sessions"
                    fill="#ea580c"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar
                    dataKey="focusTime"
                    name="Minutes"
                    fill="#333"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* COMPLETION PIE CHART */}
          <div className="col-span-12 lg:col-span-4 bg-[#111] border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-between shadow-2xl relative">
            <div className="text-center w-full mb-4">
              <h3 className="text-lg font-medium text-gray-200">Efficiency</h3>
              <p className="text-sm text-gray-400 mt-1">
                Success vs. Drop-off ratio
              </p>
            </div>

            <div className="h-[240px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{ outline: "none" }}
                      />
                    ))}
                  </Pie>
                  <Tooltip active={false} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-6">
                <span className="block text-3xl font-bold tracking-tighter text-white">
                  {Math.round(
                    (stats.completed / (stats.totalSessions || 1)) * 100,
                  )}
                  %
                </span>
                <span className="text-xs uppercase tracking-widest text-gray-300 font-bold">
                  Success Rate
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full mt-8 pt-8 border-t border-white/5">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex flex-col items-center">
                  <span className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">
                    {entry.name}
                  </span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: index === 0 ? "#f97316" : "#fff" }}
                  >
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hourly Focus Chart & Weekly Trends Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* HOURLY FOCUS BAR CHART */}
          <div className="col-span-12 lg:col-span-6 bg-[#111] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-200">Peak Focus Hours</h3>
              <p className="text-sm text-gray-400">
                Distribution of completed sessions by time of day.
              </p>
            </div>
            {peakHoursData.length > 0 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="hourLabel" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#161616", border: "1px solid rgba(249, 115, 22, 0.2)", borderRadius: "8px" }}
                      itemStyle={{ color: "#f97316" }}
                    />
                    <Bar dataKey="completedSessions" name="Completed Sessions" fill="#ea580c" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-500 text-sm">
                Complete more sessions to calculate hourly statistics.
              </div>
            )}
          </div>

          {/* WEEKLY LINE CHART (Weekly trends) */}
          <div className="col-span-12 lg:col-span-6 bg-[#111] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-200">Weekly Focus Trends</h3>
              <p className="text-sm text-gray-400">
                Daily completed sessions and focus duration line analysis.
              </p>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#161616", border: "1px solid rgba(249, 115, 22, 0.2)", borderRadius: "8px" }}
                  />
                  <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#ea580c" strokeWidth={3} dot={{ fill: "#ea580c", r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="focusTime" name="Duration (min)" stroke="#333" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
