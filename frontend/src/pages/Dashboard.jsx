import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDashboardData } from "../features/pomodoro/hooks/useDashboardData";
import { useFreezeTokens } from "../features/streaks/hooks/useFreezeTokens";
import Heatmap from "../components/Heatmap";
import ShareProfileCard from "../components/ShareProfileCard";
import ExportButton from "../components/ExportButton";
import BurnoutNudgeBanner from "../components/BurnoutNudgeBanner";
import DistractionReportCard from "../components/DistractionReportCard";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import AcUnitRoundedIcon from "@mui/icons-material/AcUnitRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
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
  AreaChart,
  Area,
} from "recharts";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

// Same identity as Landing.jsx: black canvas, one elevated surface, hairline
// borders, italic serif for headlines, mono chrome for labels/metadata, and
// orange kept strictly as accent punctuation — never a button fill.
const CARD = "rounded-[18px] border border-white/10 bg-[#0d0d0d]";
const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#141414",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "5px",
  color: "#fff",
};
const AXIS_TICK = { fill: "#6b7280", fontSize: 11 };

/** Mono uppercase tag — the "metadata, not copy" marker, matching Landing's MonoLabel. */
const Eyebrow = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-orange-500/60 px-3 py-1 font-dm-mono text-[11px] uppercase tracking-[0.08em] text-orange-500">
    {children}
  </span>
);

const Dashboard = () => {
  const { stats, dailyStats, advanced, loading } = useDashboardData();
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
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-black text-white">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="rounded-full border border-white/10 bg-[#0d0d0d] px-6 py-3 font-dm-mono text-xs uppercase tracking-[0.08em] text-gray-400"
        >
          Loading your dashboard
        </motion.div>
      </div>
    );
  }

  if (stats.totalSessions === 0 || dailyStats.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-black text-white">
        <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-2xl items-center justify-center px-6">
          <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="w-full text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] border border-orange-500/30 bg-[#0d0d0d]">
              <BoltRoundedIcon sx={{ fontSize: 28 }} className="text-orange-500" />
            </div>
            <h1 className="mt-8 font-serif text-4xl italic tracking-tight text-white md:text-5xl">
              No sessions yet
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-gray-400">
              Run your first focus session to start seeing streaks, deep work scores, and peak-hour analytics here.
            </p>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/focus")}
              className="mt-9 rounded-full bg-white px-8 py-3 font-dm-mono text-[12px] uppercase tracking-[0.08em] text-black hover:bg-gray-200 transition-all"
            >
              Start a focus session
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Completed", value: stats.completed },
    { name: "Abandoned", value: stats.abandoned },
  ];

  const peakHoursData = advanced.peakHours.map((ph) => ({
    hourLabel: formatHour(ph.hour),
    completedSessions: ph.completedSessions,
  }));

  const statCards = [
    {
      label: "Current Streak",
      value: advanced.streak.currentStreak,
      unit: "days",
      caption: `Longest streak: ${advanced.streak.longestStreak} days`,
      icon: LocalFireDepartmentRoundedIcon,
    },
    {
      label: "Deep Work Score",
      value: advanced.deepWorkScore.score,
      unit: "/100",
      caption: "Weighted by session length, interruptions, and consistency.",
      icon: AutoGraphRoundedIcon,
    },
    {
      label: "Consistency",
      value: advanced.consistencyScore,
      unit: "/100",
      caption: "How regularly you show up, not just how much you do.",
      icon: BoltRoundedIcon,
    },
    {
      label: "Freeze Tokens",
      value: freezeTokens ?? 0,
      unit: "saved",
      caption: "Auto-spent to cover one missed day without breaking a streak.",
      icon: AcUnitRoundedIcon,
    },
  ];

  const riskStyle =
    advanced.burnout.burnoutRisk === "high"
      ? "text-red-300 border-red-400/30"
      : advanced.burnout.burnoutRisk === "medium"
        ? "text-amber-200 border-amber-400/30"
        : "text-emerald-200 border-emerald-400/30";

  const completionRate = Math.round((stats.completed / (stats.totalSessions || 1)) * 100);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl space-y-5 px-5 py-8 pb-32 md:px-8 lg:px-10">
        <BurnoutNudgeBanner />

        {/* Hero — italic serif statement, mono eyebrow, plain supporting copy */}
        <motion.section {...fadeUp} transition={{ duration: 0.4 }}>
          <Eyebrow>Dashboard</Eyebrow>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-serif text-4xl italic tracking-tight text-white md:text-5xl">
                Your focus, at a glance.
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-gray-400">
                {stats.completed} completed sessions · {completionRate}% completion rate.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/focus")}
                className="rounded-full bg-white px-5 py-2.5 font-dm-mono text-[12px] uppercase tracking-[0.08em] text-black hover:bg-gray-200 transition-all"
              >
                Start a session
              </motion.button>
              <div className="hover-lift">
                <ExportButton />
              </div>
              <Link
                to="/work-journal"
                className="inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 font-dm-mono text-[12px] uppercase tracking-[0.08em] text-white hover:border-white/40 transition-all"
              >
                Work Journal
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Stat cards — identical treatment across all four, differentiated by content only */}
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {statCards.map((card, index) => (
            <motion.article
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.04 * index }}
              className={`${CARD} p-5`}
            >
              <div className="flex items-center justify-between">
                <p className="font-dm-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">{card.label}</p>
                <card.icon sx={{ fontSize: 17 }} className="text-orange-500" />
              </div>
              <div className="mt-4 flex items-end gap-1.5">
                <span className="text-4xl font-medium tracking-tight text-white">{card.value}</span>
                <span className="pb-1 text-xs text-gray-500">{card.unit}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-500">{card.caption}</p>
            </motion.article>
          ))}
        </motion.section>

        {/* Session outcomes + burnout — two panels, same card language */}
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid gap-4 xl:grid-cols-[1fr_1fr]"
        >
          <div className={`${CARD} p-6`}>
            <h2 className="font-serif text-xl italic tracking-tight text-white">Session outcomes</h2>
            <div className="relative mt-4 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={92}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={index === 0 ? "#f97316" : "#3f3f46"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-medium tracking-tight text-white">{completionRate}%</span>
                <span className="mt-1 font-dm-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">Completed</span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="rounded-[5px] border border-white/10 p-3.5">
                  <p className="font-dm-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">{entry.name}</p>
                  <p className="mt-1.5 text-xl font-medium" style={{ color: index === 0 ? "#f97316" : "#a1a1aa" }}>
                    {entry.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${CARD} p-6`}>
            <h2 className="font-serif text-xl italic tracking-tight text-white">Burnout risk</h2>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-medium tracking-tight text-white">{advanced.burnout.burnoutScore}</span>
              <span className="pb-1 text-sm text-gray-500">/100</span>
              <span className={`ml-auto inline-flex rounded-full border px-3 py-1 font-dm-mono text-[11px] uppercase tracking-[0.08em] ${riskStyle}`}>
                {advanced.burnout.burnoutRisk}
              </span>
            </div>
            <div className="mt-5 space-y-2.5">
              {advanced.burnout.reasoning.slice(0, 3).map((reason) => (
                <p key={reason} className="text-sm leading-6 text-gray-400">
                  {reason}
                </p>
              ))}
            </div>
          </div>
        </motion.section>

        <DistractionReportCard />
        <ShareProfileCard />

        <Heatmap
          data={advanced.heatmap}
          title="Focus heatmap"
          subtitle="Every day in the last year, at a glance."
        />

        {/* Trend charts — consistent axis/tooltip styling, single accent color per series */}
        <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.12 }} className="grid grid-cols-12 gap-4">
          <div className={`${CARD} col-span-12 p-6 lg:col-span-7`}>
            <h2 className="font-serif text-xl italic tracking-tight text-white">Daily sessions &amp; focus time</h2>
            <div className="mt-5 h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats} margin={{ top: 6, right: 0, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="sessions" name="Sessions" fill="#f97316" radius={[5, 5, 0, 0]} barSize={20} />
                  <Bar dataKey="focusTime" name="Focus minutes" fill="#52525b" radius={[5, 5, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${CARD} col-span-12 p-6 lg:col-span-5`}>
            <h2 className="font-serif text-xl italic tracking-tight text-white">Peak focus hours</h2>
            {peakHoursData.length > 0 ? (
              <div className="mt-5 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" />
                    <XAxis dataKey="hourLabel" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                    <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="completedSessions" name="Completed" fill="#f97316" radius={[5, 5, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
                More sessions are needed to map your peak hours.
              </div>
            )}
          </div>
        </motion.section>

        <motion.section {...fadeUp} transition={{ duration: 0.4, delay: 0.16 }}>
          <div className={`${CARD} p-6`}>
            <h2 className="font-serif text-xl italic tracking-tight text-white">Focus time trend</h2>
            <div className="mt-5 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="focusTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f1f" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="focusTime" name="Focus minutes" stroke="#f97316" fill="url(#focusTrendFill)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Dashboard;
