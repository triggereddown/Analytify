import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import { WordsPullUp, WordsPullUpMultiStyle } from "../components/text-animations";

const NAV_LINKS = ["Product", "Features"];

// Every entry routes through the same auth check as the rest of the app —
// clicking any of these when logged out lands on /login first (matching
// ProtectedRoute's behavior), not a broken/half-navigated state.
const WORKSPACE_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: SpaceDashboardRoundedIcon, description: "Your focus, streaks, and burnout signals at a glance." },
  { label: "Focus", path: "/focus", icon: BoltRoundedIcon, description: "Start a Pomodoro session and track deep work in real time." },
  { label: "Tasks", path: "/tasks", icon: TaskAltRoundedIcon, description: "Everything you need to do, including what the AI coach created." },
  { label: "Goals", path: "/goals", icon: FlagRoundedIcon, description: "Long-term objectives backed by real work-log evidence." },
  { label: "Memory", path: "/memory", icon: PsychologyRoundedIcon, description: "Capture ideas in passing and recall them later — your second brain." },
  { label: "Learning", path: "/learning-paths", icon: SchoolRoundedIcon, description: "AI-generated day-by-day curricula for anything you want to learn." },
];

/**
 * Feature dropdown for the marketing nav — a pill trigger that expands
 * into a grid of every app section. Every item is auth-gated: clicking
 * navigates to /login first if the user isn't signed in yet, exactly like
 * landing directly on a ProtectedRoute would.
 */
const WorkspaceDropdown = ({ isLoggedIn, navigate }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const goTo = (path) => {
    setOpen(false);
    navigate(isLoggedIn ? path : "/login");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] transition-colors sm:text-xs md:text-sm"
        style={{ color: open ? "#E1E0CC" : "rgba(225, 224, 204, 0.8)" }}
      >
        Workspace
        <KeyboardArrowDownRoundedIcon
          sx={{ fontSize: 16, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 z-20 mt-3 w-[92vw] max-w-2xl -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0c0c0c] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
          >
            <p className="px-2 pb-2 font-almarai text-[10px] uppercase tracking-[0.08em] text-gray-500">
              {isLoggedIn ? "Jump back in" : "Sign in to open any of these"}
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {WORKSPACE_ITEMS.map((item) => (
                <button
                  key={item.path}
                  onClick={() => goTo(item.path)}
                  className="flex items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <item.icon sx={{ fontSize: 18 }} className="mt-0.5 shrink-0 text-cream" />
                  <span>
                    <span className="block font-almarai text-sm font-medium text-cream">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-gray-500">{item.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CARD_EASE = [0.22, 1, 0.36, 1];

/** Staggered fade+rise entrance for the Features grid — fires once, on first view. */
const FeatureCard = ({ index, className = "", children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: CARD_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Icon-led feature card — sized to its own content instead of a fixed
 * height, so a 3-item checklist doesn't inherit the same box height as an
 * image card and strand a slab of empty space beneath it. Icon in a bordered
 * tile (matching the app's own sidebar icon treatment) replaces the plain
 * numbered label as the visual anchor.
 */
const ChecklistCard = ({ index, icon: Icon, title, items, className = "" }) => (
  <FeatureCard
    index={index}
    className={`flex flex-col rounded-2xl border border-white/[0.06] bg-[#161616] p-7 ${className}`}
  >
    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
      <Icon sx={{ fontSize: 20 }} className="text-cream" />
    </div>
    <h3 className="font-almarai mt-5 text-lg font-bold text-cream">{title}</h3>
    <ul className="mt-4 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-gray-400">
          <CheckRoundedIcon sx={{ fontSize: 15 }} className="mt-0.5 shrink-0 text-cream/70" />
          {item}
        </li>
      ))}
    </ul>
  </FeatureCard>
);

/**
 * The recurring signature motif for everything below the hero: real product
 * screenshots, always shown in the same "browser chrome" frame (traffic-light
 * dots + a URL pill) so four different screenshots read as one consistent,
 * designed system instead of randomly pasted images — same idea as the
 * reference's repeated gradient-photo treatment, adapted to an app that has
 * real UI to show instead of stock photography.
 */
const BrowserFrame = ({ src, alt, path = "app.analytify.dev", className = "" }) => (
  <div className={`overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-[0_40px_100px_rgba(0,0,0,0.55)] ${className}`}>
    <div className="flex items-center gap-3 border-b border-white/10 bg-[#161616] px-4 py-3">
      <div className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
      </div>
      <div className="mx-auto flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 font-almarai text-[10px] text-gray-500">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
        {path}
      </div>
    </div>
    <img src={src} alt={alt} className="block w-full" loading="lazy" />
  </div>
);

/** Fade+rise entrance wrapper, fires once on first scroll into view — used for every below-the-hero section so motion reads as one consistent system. */
const Reveal = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: CARD_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Start a session",
    description: "Link it to a task or just hit go — the timer runs, no setup required.",
    img: "/screens/focus-idle.png",
    alt: "Analytify focus session start screen with linked task picker",
  },
  {
    step: "02",
    title: "Stay honest, automatically",
    description: "Pauses, distractions, and interruptions are all logged as they happen — not self-reported after the fact.",
    img: "/screens/focus-running.png",
    alt: "Analytify running focus timer",
  },
  {
    step: "03",
    title: "See the real story",
    description: "Every session rolls into a Deep Work Score, a burnout signal, and a 365-day heatmap of how you actually work.",
    img: "/screens/dashboard-heatmap.png",
    alt: "Analytify focus heatmap showing a year of session history",
  },
];

const PROOF_METRICS = [
  { value: "7", label: "Core modules", caption: "Focus, Tasks, Goals, Memory, Learning Paths, Work Journal, AI Coach" },
  { value: "365", label: "Day heatmap", caption: "Full-year focus history, not a 7-day vanity window" },
  { value: "3", label: "Signals per session", caption: "Deep Work Score, burnout risk, and peak-hour tracking" },
  { value: "0", label: "Manual logging", caption: "Distraction detection is automatic, not self-reported" },
];

const FAQ_ITEMS = [
  {
    q: "How is this different from a regular Pomodoro timer?",
    a: "Most timers stop at the beep. Analytify turns every session into structured data — a Deep Work Score weighted by length, interruptions, and consistency, plus a burnout detector comparing this week against last week. The timer is the input; the analytics layer is the product.",
  },
  {
    q: "Does it require manual logging to be useful?",
    a: "No. Pauses, abandons, and completions are captured automatically as lifecycle events. The optional distraction log and work journal add richer context, but the core metrics work from timer usage alone.",
  },
  {
    q: "What's the AI Coach actually doing?",
    a: "It's a tool-using assistant wired directly into the data model — it can create tasks, goals, and reminders mid-conversation via quick commands, and generate day-by-day learning paths, not just answer questions about your stats.",
  },
  {
    q: "Is this open to individuals or built for teams?",
    a: "Today it's single-player by design — every feature is about making one person's focus data useful to them, not a leaderboard. Team and workspace features are on the roadmap, not a retrofit.",
  },
  {
    q: "What's the stack?",
    a: "Postgres via Prisma, an Express/Node API, a Vite/React frontend, and a Redis-backed job queue for analytics — built to run on free-tier infrastructure end to end.",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openFaq, setOpenFaq] = useState(1); // second item pre-opened, matching the reference's FAQ treatment

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <div className="font-almarai bg-black text-cream antialiased">
      {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
      <section className="h-screen p-4 md:p-6">
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-black md:rounded-[2rem]">
          {/* Abstract cinematic backdrop — deliberately not the dashboard
              screenshot: a UI screenshot carries its own dense readable
              text and nav chrome, which collides into an illegible mess
              once the real headline and nav sit on top of it. A dark
              gradient + noise grain gives the moody, cinematic feel the
              spec asks for without fighting the foreground content. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 100%, rgba(222,219,200,0.14) 0%, rgba(0,0,0,0.9) 55%, #000 100%)",
            }}
          />

          {/* Fine grid with a warm glow spreading from the top-right corner —
              the hero's one accent color against the cream identity. Uses
              plain solid-color fade overlays rather than `mask-image`:
              masks render unreliably (fade correctly on one edge, not the
              other) once nested inside an absolutely-positioned ancestor —
              confirmed by direct isolation testing earlier when this same
              motif was built for the previous hero. Solid overlays that
              fade to the backdrop's own color have no such failure mode. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(249,115,22,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.35) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(65% 65% at 100% 0%, #fbbf24 0%, rgba(249,115,22,0.55) 35%, rgba(234,88,12,0.18) 60%, transparent 80%)",
              }}
            />
            {/* Fades the grid/glow back to the backdrop toward the bottom
                and left, so it reads as originating from the corner rather
                than covering the whole hero uniformly. */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom left, transparent 0%, #000 70%)" }}
            />
          </div>

          <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.5] mix-blend-overlay" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

          {/* Navbar */}
          <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2">
            <nav className="rounded-b-2xl bg-black px-4 py-2 md:rounded-b-3xl md:px-8">
              <div className="flex items-center gap-3 sm:gap-6 md:gap-12 lg:gap-14">
                {NAV_LINKS.map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-[10px] transition-colors sm:text-xs md:text-sm"
                    style={{ color: "rgba(225, 224, 204, 0.8)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#E1E0CC")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(225, 224, 204, 0.8)")}
                  >
                    {item}
                  </a>
                ))}
                <WorkspaceDropdown isLoggedIn={isLoggedIn} navigate={navigate} />
                <button
                  onClick={() => navigate(isLoggedIn ? "/dashboard" : "/login")}
                  className="text-[10px] transition-colors sm:text-xs md:text-sm"
                  style={{ color: "rgba(225, 224, 204, 0.8)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#E1E0CC")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(225, 224, 204, 0.8)")}
                >
                  {isLoggedIn ? "Dashboard" : "Sign in"}
                </button>
                {isLoggedIn && (
                  <button
                    onClick={handleLogout}
                    className="text-[10px] transition-colors sm:text-xs md:text-sm"
                    style={{ color: "rgba(225, 224, 204, 0.8)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#E1E0CC")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(225, 224, 204, 0.8)")}
                  >
                    Logout
                  </button>
                )}
              </div>
            </nav>
          </div>

          {/* Bottom-aligned hero content */}
          <div className="absolute right-0 bottom-0 left-0 p-6 md:p-10">
            <div className="grid grid-cols-12 items-end gap-6">
              <div className="col-span-12 lg:col-span-8">
                <h1
                  className="font-medium leading-[0.85] tracking-[-0.07em] text-[#E1E0CC]"
                  style={{ fontSize: "clamp(3.5rem, 19vw, 14rem)" }}
                >
                  <WordsPullUp text="Analytify" />
                </h1>
              </div>
              <div className="col-span-12 flex flex-col items-start gap-5 lg:col-span-4">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: CARD_EASE }}
                  className="text-xs leading-[1.2] text-cream/70 sm:text-sm md:text-base"
                >
                  Analytify turns every focus session into evidence — streaks, deep work scores, and
                  burnout signals that actually reflect how you work, not just a timer running in the
                  background.
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: CARD_EASE }}
                  onClick={() => navigate(isLoggedIn ? "/focus" : "/register")}
                  className="group flex items-center gap-2 rounded-full bg-cream py-1.5 pr-1.5 pl-5 font-medium text-black transition-all hover:gap-3 sm:text-base"
                >
                  Start focusing
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                    <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} className="text-cream" />
                  </span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ABOUT ══════════════════════════════════════════════════════ */}
      <section id="product" className="bg-black px-4 py-20 md:px-6 md:py-32">
        <div className="mx-auto max-w-6xl rounded-2xl bg-[#101010] px-6 py-16 text-center md:px-12 md:py-24">
          <span className="text-[10px] text-cream sm:text-xs">Focus analytics</span>

          <div className="mx-auto mt-6 max-w-3xl text-3xl leading-[0.95] sm:text-4xl sm:leading-[0.9] md:text-5xl lg:text-6xl xl:text-7xl">
            <WordsPullUpMultiStyle
              segments={[
                { text: "Every session, ", className: "font-almarai font-normal" },
                { text: "proven honestly.", className: "font-instrument italic" },
                { text: "Built from real Pomodoro data, not guesses.", className: "font-almarai font-normal" },
              ]}
            />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: CARD_EASE }}
            className="mx-auto mt-10 max-w-2xl text-xs leading-7 text-[#DEDBC8] sm:text-sm md:text-base"
          >
            Analytify started as a simple Pomodoro timer and grew into a full analytics layer. Every session
            feeds a Deep Work Score, a burnout detector, and a 365-day heatmap, so the story your data tells
            is the same one you actually lived, not a vanity streak counter.
          </motion.p>
        </div>
      </section>

      {/* ═══ PRODUCT PREVIEW ════════════════════════════════════════════
          The anchor visual for the whole page: the real dashboard, framed
          in the browser-chrome motif every screenshot below reuses. This
          replaces the old dashBoard.png card buried inside the feature
          grid — a real product deserves one large, unmistakable "here it
          is" moment, not a thumbnail competing with three text cards. */}
      <section className="bg-black px-4 py-4 md:px-6">
        <Reveal className="mx-auto max-w-6xl">
          <BrowserFrame
            src="/screens/dashboard-full.png"
            alt="Analytify dashboard: streak, deep work score, consistency, burnout risk, and session charts"
            path="app.analytify.dev/dashboard"
          />
        </Reveal>
      </section>

      {/* ═══ HOW IT WORKS ═══════════════════════════════════════════════ */}
      <section className="bg-black px-4 py-20 md:px-6 md:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <span className="font-almarai text-[10px] uppercase tracking-[0.2em] text-gray-500 sm:text-xs">
              How it works
            </span>
            <h2 className="mt-4 max-w-xl text-3xl leading-[1.05] font-normal text-cream sm:text-4xl md:text-5xl">
              Three steps. No manual bookkeeping.
            </h2>
          </Reveal>

          <div className="mt-14 space-y-16 md:space-y-24">
            {HOW_IT_WORKS_STEPS.map((item, i) => (
              <Reveal key={item.step} delay={0.05}>
                <div
                  className={`grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-14 ${
                    i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <BrowserFrame src={item.img} alt={item.alt} path={`app.analytify.dev/${item.step === "01" ? "focus" : item.step === "02" ? "focus" : "dashboard"}`} />
                  <div>
                    <span className="font-almarai text-xs text-gray-500">{item.step}</span>
                    <h3 className="font-almarai mt-3 text-2xl font-bold text-cream md:text-3xl">{item.title}</h3>
                    <p className="mt-4 max-w-md text-sm leading-7 text-gray-400 md:text-base">{item.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══════════════════════════════════════════════════ */}
      <section id="features" className="relative overflow-hidden bg-black px-4 py-20 md:px-6 md:py-28">
        <div className="bg-noise pointer-events-none absolute inset-0 opacity-[0.15]" />

        <div className="relative mx-auto max-w-6xl text-center">
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
            <WordsPullUpMultiStyle
              segments={[
                { text: "Studio-grade focus tracking for people who take deep work seriously.", className: "font-almarai font-normal text-cream" },
              ]}
            />
          </div>
          <div className="mt-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl">
            <WordsPullUpMultiStyle
              segments={[{ text: "Built for real sessions. Powered by real data.", className: "font-almarai font-normal text-gray-500" }]}
            />
          </div>

          {/* Hero feature: the heatmap runs edge-to-edge with the caption
              below it as a proper strip, not floating in a fixed-height box
              with dead air underneath — the image dictates the card's
              height instead of the other way around. */}
          <FeatureCard index={0} className="mt-12 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#161616] text-left">
            <img
              src="/screens/dashboard-heatmap.png"
              alt="Analytify focus heatmap — every day of the last year, at a glance"
              className="block w-full"
            />
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] p-7">
              <div>
                <span className="font-almarai text-xs text-gray-500">01 · Analytics</span>
                <h3 className="font-almarai mt-1.5 text-xl font-bold text-cream">A year of focus, mapped</h3>
              </div>
              <p className="max-w-sm text-sm leading-6 text-gray-400">
                Every completed session lands on the map the same day it happens — no manual logging, no gaps.
              </p>
            </div>
          </FeatureCard>

          <div className="mt-4 grid grid-cols-1 gap-4 text-left md:grid-cols-3">
            <ChecklistCard
              index={1}
              icon={AutoGraphRoundedIcon}
              title="Deep Work Score"
              items={[
                "Weighted 40% by session length",
                "30% by interruption count",
                "30% by day-to-day consistency",
                "Recomputed after every session",
              ]}
            />

            <ChecklistCard
              index={2}
              icon={PsychologyRoundedIcon}
              title="AI Coach"
              items={[
                "Creates tasks and goals directly from chat",
                "/task, /goal, /reminder quick commands",
                "Voice input via your browser's mic",
              ]}
            />

            <ChecklistCard
              index={3}
              icon={LocalFireDepartmentRoundedIcon}
              title="Streaks & Recovery"
              items={[
                "Freeze tokens auto-cover one missed day",
                "Burnout risk scored from real session data",
                "365-day focus heatmap",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ═══ PROOF / METRICS ════════════════════════════════════════════
          Honest product-depth numbers, not fabricated traction — Analytify
          is pre-launch, so this band proves engineering substance (what's
          actually built) rather than claiming user/revenue numbers it
          doesn't have yet. */}
      <section className="bg-black px-4 py-16 md:px-6">
        <Reveal className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-gradient-to-br from-[#151310] via-[#101010] to-[#0a0a0a] px-6 py-14 md:px-12 md:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
            {PROOF_METRICS.map((metric) => (
              <div key={metric.label}>
                <span className="font-instrument text-4xl italic text-cream md:text-5xl">{metric.value}</span>
                <p className="font-almarai mt-2 text-xs font-bold tracking-wide text-cream/80 uppercase">{metric.label}</p>
                <p className="mt-2 text-xs leading-5 text-gray-500">{metric.caption}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ═══ FAQ ═════════════════════════════════════════════════════════ */}
      <section className="bg-black px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-3xl">
          <Reveal className="text-center">
            <h2 className="font-instrument text-3xl italic text-cream md:text-4xl">FAQ</h2>
            <p className="mt-3 text-sm text-gray-500">Everything worth knowing before you dig in.</p>
          </Reveal>

          <div className="mt-10 space-y-2">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <Reveal key={item.q} delay={i * 0.03}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className={`w-full rounded-xl border px-5 py-4 text-left transition-all ${
                      isOpen ? "border-cream/30 bg-[#141210]" : "border-white/10 bg-[#0d0d0d] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className={`font-almarai text-sm font-medium ${isOpen ? "text-cream" : "text-gray-200"}`}>
                        {item.q}
                      </span>
                      {isOpen ? (
                        <RemoveRoundedIcon sx={{ fontSize: 18 }} className="shrink-0 text-cream" />
                      ) : (
                        <AddRoundedIcon sx={{ fontSize: 18 }} className="shrink-0 text-gray-500" />
                      )}
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: CARD_EASE }}
                          className="overflow-hidden"
                        >
                          <p className="pt-3 text-sm leading-6 text-gray-400">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ CLOSING CTA ════════════════════════════════════════════════ */}
      <section className="bg-black px-4 pb-20 md:px-6">
        <Reveal className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1712] via-[#141210] to-[#0a0a0a] px-6 py-16 text-center md:px-12 md:py-24">
          <AutoGraphRoundedIcon sx={{ fontSize: 32 }} className="mx-auto text-cream" />
          <h2 className="mt-6 text-3xl leading-tight font-normal text-cream sm:text-4xl md:text-5xl">
            Start building your <span className="font-instrument italic">evidence.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-gray-400">
            No credit card, no setup — just a timer that actually remembers how you work.
          </p>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(isLoggedIn ? "/focus" : "/register")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-cream px-7 py-3 font-medium text-black transition-all hover:gap-3"
          >
            {isLoggedIn ? "Go to Focus" : "Start focusing"}
            <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
          </motion.button>
        </Reveal>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/10 bg-black px-6 py-14 md:px-10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-cream" />
              <span className="font-almarai text-sm font-bold tracking-tight text-cream uppercase">Analytify</span>
            </div>
            <p className="mt-4 max-w-xs text-xs leading-6 text-gray-500">
              Focus analytics for people who take deep work seriously.
            </p>
          </div>

          <div>
            <p className="font-almarai text-[11px] font-bold tracking-widest text-gray-500 uppercase">Product</p>
            <ul className="mt-4 space-y-2.5 text-xs text-gray-400">
              <li><a href="#product" className="hover:text-cream">Overview</a></li>
              <li><a href="#features" className="hover:text-cream">Features</a></li>
              <li><button onClick={() => navigate(isLoggedIn ? "/dashboard" : "/login")} className="hover:text-cream">Dashboard</button></li>
            </ul>
          </div>

          <div>
            <p className="font-almarai text-[11px] font-bold tracking-widest text-gray-500 uppercase">Account</p>
            <ul className="mt-4 space-y-2.5 text-xs text-gray-400">
              <li><button onClick={() => navigate("/login")} className="hover:text-cream">Sign in</button></li>
              <li><button onClick={() => navigate("/register")} className="hover:text-cream">Register</button></li>
            </ul>
          </div>

          <div>
            <p className="font-almarai text-[11px] font-bold tracking-widest text-gray-500 uppercase">Legal</p>
            <ul className="mt-4 space-y-2.5 text-xs text-gray-400">
              <li><span className="cursor-default opacity-60">Privacy Policy</span></li>
              <li><span className="cursor-default opacity-60">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-6xl items-center justify-between border-t border-white/10 pt-6">
          <p className="text-xs text-gray-500">© 2026 Analytify. All rights reserved.</p>
          <LocalFireDepartmentRoundedIcon sx={{ fontSize: 16 }} className="text-gray-700" />
        </div>
      </footer>
    </div>
  );
};

export default Landing;
