import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { WordsPullUp, WordsPullUpMultiStyle, ScrollRevealText } from "../components/text-animations";

const NAV_LINKS = ["Product", "Features"];

const CARD_EASE = [0.22, 1, 0.36, 1];

/** Staggered scale+fade entrance for the Features grid — fires once, on first view. */
const FeatureCard = ({ index, className = "", children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: CARD_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/** The recurring checklist-card layout used by three of the four Features cards. */
const ChecklistCard = ({ index, title, items }) => (
  <FeatureCard
    index={index}
    className="flex flex-col justify-between rounded-2xl bg-[#212121] p-6 lg:h-[480px]"
  >
    <div>
      <span className="font-almarai text-xs text-gray-500">0{index + 1}</span>
      <h3 className="font-almarai mt-2 text-xl font-bold text-cream">{title}</h3>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-gray-400">
            <CheckRoundedIcon sx={{ fontSize: 16 }} className="mt-0.5 shrink-0 text-cream" />
            {item}
          </li>
        ))}
      </ul>
    </div>
    <button className="mt-8 inline-flex items-center gap-2 self-start font-almarai text-sm font-medium text-cream">
      Learn more
      <ArrowForwardRoundedIcon sx={{ fontSize: 16, transform: "rotate(-45deg)" }} />
    </button>
  </FeatureCard>
);

const Landing = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

          <ScrollRevealText
            className="mx-auto mt-10 max-w-2xl text-xs leading-7 text-[#DEDBC8] sm:text-sm md:text-base"
            text="Analytify started as a simple Pomodoro timer and grew into a full analytics layer. Every session feeds a Deep Work Score, a burnout detector, and a 365-day heatmap, so the story your data tells is the same one you actually lived, not a vanity streak counter."
          />
        </div>
      </section>

      {/* ═══ FEATURES ═══════════════════════════════════════════════════ */}
      <section id="features" className="relative min-h-screen overflow-hidden bg-black px-4 py-20 md:px-6 md:py-28">
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

          <div className="mt-12 grid grid-cols-1 gap-3 sm:gap-2 md:grid-cols-2 md:gap-1 lg:grid-cols-4">
            <FeatureCard
              index={0}
              className="flex flex-col overflow-hidden rounded-2xl bg-[#212121] lg:h-[480px] lg:col-span-2"
            >
              <div className="p-6 pb-0">
                <span className="font-almarai text-xs text-gray-500">01</span>
                <h3 className="font-almarai mt-2 text-xl font-bold text-cream">The real dashboard</h3>
              </div>
              {/* object-contain — this is a screenshot with real, readable
                  text baked into the image. object-cover (even anchored)
                  still crops one axis and cuts off words; object-contain
                  is the only choice that never truncates the content,
                  letterboxing on a solid card background instead. */}
              <div className="mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-t-xl bg-black/40 p-4">
                <img
                  src="/dashBoard.png"
                  alt="Analytify dashboard showing streaks, deep work score, and session outcomes"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </FeatureCard>

            <ChecklistCard
              index={1}
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
              title="AI Coach"
              items={[
                "Creates tasks and goals directly from chat",
                "/task, /goal, /reminder quick commands",
                "Voice input via your browser's mic",
              ]}
            />

            <ChecklistCard
              index={3}
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

      <footer className="border-t border-white/10 bg-black px-6 py-10 text-center">
        <p className="text-xs text-gray-500">© 2026 Analytify. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
