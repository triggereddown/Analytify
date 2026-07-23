import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthActions } from "../features/auth/hooks/useAuthActions";
import { useDashboardData } from "../features/pomodoro/hooks/useDashboardData";
import { useFreezeTokens } from "../features/streaks/hooks/useFreezeTokens";
import Heatmap from "../components/Heatmap";
import ShareProfileCard from "../components/ShareProfileCard";
import ExportButton from "../components/ExportButton";
import BurnoutNudgeBanner from "../components/BurnoutNudgeBanner";
import DistractionReportCard from "../components/DistractionReportCard";
import BoltIcon from "@mui/icons-material/Bolt";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import MilitaryTechRoundedIcon from "@mui/icons-material/MilitaryTechRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import ShieldMoonRoundedIcon from "@mui/icons-material/ShieldMoonRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import RadarRoundedIcon from "@mui/icons-material/RadarRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
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
  AreaChart,
  Area,
} from "recharts";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const rankBands = [
  { threshold: 0, rank: "E", title: "Initiate Hunter" },
  { threshold: 250, rank: "D", title: "Field Survivor" },
  { threshold: 500, rank: "C", title: "Dungeon Specialist" },
  { threshold: 900, rank: "B", title: "Shadow Operator" },
  { threshold: 1400, rank: "A", title: "Elite Raider" },
  { threshold: 2200, rank: "S", title: "Monarch Candidate" },
];

const Dashboard = () => {
  const { stats, dailyStats, advanced, loading } = useDashboardData();
  const { logout: handleLogout } = useAuthActions();
  const navigate = useNavigate();
  const freezeTokens = useFreezeTokens();

  const formatHour = (hour) => {
    if (hour === undefined || hour === null) return "N/A";
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour % 12 || 12;
    return `${h} ${ampm}`;
  };

  if (loading || !stats || !advanced) {
    return (
      <div className="min-h-screen bg-[#07090f] text-cyan-100 flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="rounded-full border border-cyan-400/20 bg-cyan-400/8 px-6 py-3 text-xs uppercase tracking-[0.35em]"
        >
          Syncing System Interface
        </motion.div>
      </div>
    );
  }

  if (stats.totalSessions === 0 || dailyStats.length === 0) {
    return (
      <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_25%),linear-gradient(180deg,#07090f,#05060b)] text-white">
        <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-cyan-400/10 bg-[#05070d]/70 px-8 py-6 backdrop-blur-xl">
          <Link to="/" className="group flex items-center gap-3">
            <div className="h-8 w-8 rounded-full border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-transform group-hover:scale-110" />
            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-100">Analytify System</span>
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-full border border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400 hover:border-cyan-300/30 hover:text-cyan-100"
          >
            Logout
          </button>
        </nav>

        <div className="mx-auto flex min-h-[calc(100vh-88px)] max-w-4xl items-center justify-center px-8">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.45 }}
            className="w-full rounded-[2.5rem] border border-cyan-400/10 bg-black/25 p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8 shadow-[0_0_60px_rgba(34,211,238,0.22)]">
              <BoltIcon sx={{ fontSize: 48 }} className="text-cyan-200" />
            </div>
            <h1 className="mt-8 text-4xl font-semibold tracking-tight">System Awaiting First Clear</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-gray-400">
              Your hunter profile is live, but no run data exists yet. Clear your first focus session to unlock rank growth, quest tracking, and behavioral combat analytics.
            </p>
            <motion.button
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/focus")}
              className="mt-10 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-8 py-4 text-sm font-bold uppercase tracking-[0.28em] text-cyan-100 shadow-[0_12px_30px_rgba(8,145,178,0.25)]"
            >
              Begin First Hunt
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Cleared", value: stats.completed },
    { name: "Dropped", value: stats.abandoned },
  ];

  const peakHoursData = advanced.peakHours.map((ph) => ({
    hourLabel: formatHour(ph.hour),
    completedSessions: ph.completedSessions,
  }));

  const xp = calculateXp({ stats, advanced });
  const rankInfo = getRankInfo(xp);
  const nextRank = getNextRankInfo(xp);
  const xpProgress = nextRank
    ? Math.min(100, Math.round(((xp - rankInfo.threshold) / (nextRank.threshold - rankInfo.threshold)) * 100))
    : 100;

  const quests = [
    {
      label: "Current Chain",
      value: `${advanced.streak.currentStreak} day streak`,
      detail: "Keep one clean completion alive today to preserve your chain.",
      icon: LocalFireDepartmentIcon,
    },
    {
      label: "Power Level",
      value: `${advanced.deepWorkScore.score}/100`,
      detail: "This is your current combat-readiness readout.",
      icon: BoltIcon,
    },
    {
      label: "Fatigue Shield",
      value: advanced.burnout.burnoutRisk.toUpperCase(),
      detail: "Lower fatigue means your system can support harder quests.",
      icon: ShieldMoonRoundedIcon,
    },
  ];

  const performanceCards = [
    {
      title: "Hunter Rank",
      value: `${rankInfo.rank}`,
      subvalue: rankInfo.title,
      caption: nextRank ? `${nextRank.threshold - xp} XP to ${nextRank.rank}-Rank` : "Peak rank achieved",
      icon: MilitaryTechRoundedIcon,
      glow: "from-cyan-400/20 via-cyan-300/10 to-transparent",
    },
    {
      title: "Deep Work Power",
      value: advanced.deepWorkScore.score,
      subvalue: "/100",
      caption: "Composite output from length, interruptions, and consistency.",
      icon: AutoGraphRoundedIcon,
      glow: "from-amber-400/20 via-orange-300/10 to-transparent",
    },
    {
      title: "Quest Chain",
      value: advanced.streak.currentStreak,
      subvalue: "days",
      caption: `Longest chain ${advanced.streak.longestStreak} days`,
      icon: LocalFireDepartmentIcon,
      glow: "from-orange-500/20 via-red-400/10 to-transparent",
    },
    {
      title: "Recovery Tokens",
      value: freezeTokens ?? 0,
      subvalue: "saved",
      caption: "Emergency shields that keep one bad day from breaking the run.",
      icon: AcUnitIcon,
      glow: "from-sky-400/20 via-blue-300/10 to-transparent",
    },
  ];

  const threatColor =
    advanced.burnout.burnoutRisk === "high"
      ? "text-red-300 border-red-400/20 bg-red-500/10"
      : advanced.burnout.burnoutRisk === "medium"
        ? "text-amber-200 border-amber-400/20 bg-amber-500/10"
        : "text-emerald-200 border-emerald-400/20 bg-emerald-500/10";

  const successRate = Math.round((stats.completed / (stats.totalSessions || 1)) * 100);

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_22%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.12),transparent_18%),linear-gradient(180deg,#07090f,#05060b_40%,#04050a)] text-white antialiased">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-cyan-400/10 bg-[#05070d]/72 px-6 py-5 backdrop-blur-xl md:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <div className="h-8 w-8 rounded-full border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_24px_rgba(34,211,238,0.18)] transition-transform group-hover:scale-110" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.42em] text-cyan-100 md:text-xs">Analytify System</span>
        </Link>
        <button
          onClick={handleLogout}
          className="rounded-full border border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400 hover:border-cyan-300/30 hover:text-cyan-100"
        >
          Logout
        </button>
      </nav>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-6 pb-36 md:px-8 lg:px-10 lg:py-10">
        <BurnoutNudgeBanner />

        <motion.section
          {...fadeUp}
          transition={{ duration: 0.42 }}
          className="overflow-hidden rounded-[2.75rem] border border-cyan-400/12 bg-black/20 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
        >
          <div className="grid gap-8 p-6 md:p-8 xl:grid-cols-[1.35fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-100">
                <RadarRoundedIcon sx={{ fontSize: 14 }} />
                Hunter System
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
                Solo progression for deep work, discipline, and recovery.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-400 md:text-base">
                Your sessions are no longer just logs. They are combat runs, energy management, and quest-chain momentum. This dashboard is the command layer for leveling up your attention.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/focus")}
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-100 shadow-[0_12px_30px_rgba(8,145,178,0.22)]"
                >
                  Enter Focus Arena
                </motion.button>
                <div className="hover-lift">
                  <ExportButton />
                </div>
                <Link
                  to="/work-journal"
                  className="rounded-full border border-white/10 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.26em] text-gray-300 hover:border-cyan-300/30 hover:text-cyan-100"
                >
                  Open Work Journal
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(8,15,28,0.85),rgba(4,7,14,0.95))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-100/70">Hunter Rank</p>
                  <div className="mt-3 flex items-end gap-3">
                    <span className="text-6xl font-black tracking-tight text-cyan-100">{rankInfo.rank}</span>
                    <span className="pb-2 text-sm uppercase tracking-[0.22em] text-gray-400">{rankInfo.title}</span>
                  </div>
                </div>
                <MilitaryTechRoundedIcon className="text-cyan-200/90" sx={{ fontSize: 34 }} />
              </div>

              <div className="mt-8">
                <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-gray-500">
                  <span>XP Progress</span>
                  <span>{xp} XP</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className="h-full rounded-full bg-[linear-gradient(90deg,#67e8f9,#38bdf8,#f59e0b)] shadow-[0_0_20px_rgba(56,189,248,0.35)]"
                  />
                </div>
                <p className="mt-3 text-sm text-gray-400">
                  {nextRank ? `${nextRank.threshold - xp} XP until ${nextRank.rank}-Rank awakening.` : "You have reached the highest current rank band."}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-[1.4rem] border border-white/6 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Clears</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{stats.completed}</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/6 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Threat Level</p>
                  <div className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${threatColor}`}>
                    {advanced.burnout.burnoutRisk}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          {...fadeUp}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {performanceCards.map((card, index) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.05 * index }}
              className="relative overflow-hidden rounded-[2rem] border border-white/7 bg-[#0d1119] p-5 shadow-[0_24px_40px_rgba(0,0,0,0.32)]"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.glow}`} />
              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-gray-500">{card.title}</p>
                  <card.icon sx={{ fontSize: 20 }} className="text-cyan-200/80" />
                </div>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tight text-white">{card.value}</span>
                  <span className="pb-2 text-sm uppercase tracking-[0.18em] text-gray-500">{card.subvalue}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-400">{card.caption}</p>
              </div>
            </motion.article>
          ))}
        </motion.section>

        <motion.section
          {...fadeUp}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="rounded-[2.4rem] border border-white/7 bg-[#0b0f17] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-100/70">Quest Board</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Daily progression arcs</h2>
              </div>
              <div className="rounded-full border border-cyan-300/12 bg-cyan-300/8 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-cyan-100">
                Live System Read
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {quests.map((quest, index) => (
                <motion.div
                  key={quest.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index }}
                  className="rounded-[1.7rem] border border-white/7 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">{quest.label}</p>
                    <quest.icon sx={{ fontSize: 18 }} className="text-cyan-200/80" />
                  </div>
                  <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{quest.value}</p>
                  <p className="mt-3 text-sm leading-6 text-gray-400">{quest.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.4rem] border border-white/7 bg-[#0b0f17] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-100/70">Battle Readout</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Run outcome balance</h2>
              </div>
              <ExploreRoundedIcon className="text-cyan-200/90" sx={{ fontSize: 22 }} />
            </div>

            <div className="relative mt-6 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={74}
                    outerRadius={95}
                    paddingAngle={7}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={index === 0 ? "#22d3ee" : "#f97316"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f1724",
                      border: "1px solid rgba(103,232,249,0.18)",
                      borderRadius: "14px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-5xl font-black tracking-tight text-white">{successRate}%</span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-gray-400">Clear Rate</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="rounded-[1.4rem] border border-white/6 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{entry.name}</p>
                  <p className="mt-2 text-2xl font-semibold" style={{ color: index === 0 ? "#67e8f9" : "#fb923c" }}>
                    {entry.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <DistractionReportCard />
        <ShareProfileCard />

        <Heatmap
          data={advanced.heatmap}
          title="Training Grid"
          subtitle="Every day in the last year logged as part of your discipline archive."
        />

        <motion.section
          {...fadeUp}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="grid grid-cols-12 gap-6"
        >
          <div className="col-span-12 rounded-[2.4rem] border border-white/7 bg-[#0b0f17] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)] lg:col-span-8">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-100/70">Power Growth Curve</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Session volume vs focus stamina</h2>
              </div>
              <TaskAltRoundedIcon className="text-cyan-200/80" sx={{ fontSize: 22 }} />
            </div>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats} margin={{ top: 6, right: 0, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} dy={12} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    contentStyle={{
                      backgroundColor: "#0f1724",
                      border: "1px solid rgba(103,232,249,0.18)",
                      borderRadius: "14px",
                    }}
                    labelStyle={{ color: "#67e8f9", fontWeight: "bold" }}
                  />
                  <Bar dataKey="sessions" name="Quest Clears" fill="#22d3ee" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="focusTime" name="Focus Minutes" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-12 rounded-[2.4rem] border border-white/7 bg-[#0b0f17] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)] lg:col-span-4">
            <div className="mb-7">
              <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-100/70">Threat Scan</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Fatigue pressure</h2>
            </div>
            <div className="rounded-[1.8rem] border border-white/7 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Burnout Meter</span>
                <WarningAmberIcon sx={{ fontSize: 20 }} className="text-amber-300" />
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-black tracking-tight text-white">{advanced.burnout.burnoutScore}</span>
                <span className="pb-2 text-sm text-gray-500">/100</span>
              </div>
              <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${threatColor}`}>
                {advanced.burnout.burnoutRisk} risk
              </div>
              <div className="mt-5 space-y-2">
                {advanced.burnout.reasoning.slice(0, 3).map((reason) => (
                  <p key={reason} className="text-sm leading-6 text-gray-400">
                    {reason}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          {...fadeUp}
          transition={{ duration: 0.45, delay: 0.16 }}
          className="grid grid-cols-12 gap-6"
        >
          <div className="col-span-12 rounded-[2.4rem] border border-white/7 bg-[#0b0f17] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)] lg:col-span-6">
            <div className="mb-7">
              <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-100/70">Clock Window Analysis</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Best raid hours</h2>
            </div>
            {peakHoursData.length > 0 ? (
              <div className="h-[290px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                    <XAxis dataKey="hourLabel" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f1724",
                        border: "1px solid rgba(103,232,249,0.18)",
                        borderRadius: "14px",
                      }}
                    />
                    <Bar dataKey="completedSessions" name="Clears" fill="#38bdf8" radius={[6, 6, 0, 0]} barSize={42} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[290px] items-center justify-center text-sm text-gray-500">
                More runs are needed to map your strongest combat window.
              </div>
            )}
          </div>

          <div className="col-span-12 rounded-[2.4rem] border border-white/7 bg-[#0b0f17] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.34)] lg:col-span-6">
            <div className="mb-7">
              <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-100/70">Awakening Timeline</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Recent growth rhythm</h2>
            </div>
            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="xpGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f1724",
                      border: "1px solid rgba(103,232,249,0.18)",
                      borderRadius: "14px",
                    }}
                  />
                  <Area type="monotone" dataKey="focusTime" name="Focus Minutes" stroke="#22d3ee" fill="url(#xpGlow)" strokeWidth={3} />
                  <Line type="monotone" dataKey="sessions" name="Clears" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: "#f59e0b" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

const calculateXp = ({ stats, advanced }) =>
  stats.completed * 35 +
  advanced.streak.currentStreak * 18 +
  advanced.deepWorkScore.score * 2 +
  advanced.consistencyScore * 3;

const getRankInfo = (xp) =>
  rankBands.reduce((current, band) => (xp >= band.threshold ? band : current), rankBands[0]);

const getNextRankInfo = (xp) => rankBands.find((band) => band.threshold > xp) ?? null;

export default Dashboard;
