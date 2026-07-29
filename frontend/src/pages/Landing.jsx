import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import png1 from "../assets/png1.png";
import png2 from "../assets/png2.png";
import png3 from "../assets/png3.png";

const NAV_LINKS = ["Product", "Steps", "Footer"];

/**
 * Ghost brand wordmark — a huge, low-opacity italic serif "Analytify"
 * bleeding past the viewport edges as an atmospheric background layer, not
 * a heading. Sits behind all content (z-0); replaces the earlier grid/glow
 * floor, which doesn't belong in this identity — the mood here is an
 * unbroken void with one typographic gesture, not a glowing texture.
 */
const GhostWordmark = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 select-none overflow-hidden text-center"
  >
    <span
      className="font-serif italic text-[28vw] leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white/[0.07] to-white/0"
    >
      Analytify
    </span>
  </div>
);

/** Mono uppercase tag — the "metadata, not copy" marker used for nav, labels, captions. */
const MonoLabel = ({ children, className = "" }) => (
  <span className={`font-dm-mono text-[11px] uppercase tracking-[0.08em] text-gray-500 ${className}`}>
    {children}
  </span>
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

  const fadeIn = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } },
  };

  const features = [
    { title: "Flow Analytics", img: png1, desc: "Visualize your focus sessions with high-fidelity trend lines." },
    { title: "Session Precision", img: png2, desc: "Track every block of deep work with granular accuracy." },
    { title: "Efficiency Ratios", img: png3, desc: "Identify your peak performance hours automatically." },
  ];

  const handleScroll = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 antialiased">
      {/* ── Nav: mono chrome, minimal ──────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-sm">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6">
          <span className="font-serif text-xl italic tracking-tight text-white">Analytify</span>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={(e) => handleScroll(e, item.toLowerCase())}
                className="font-dm-mono text-[12px] uppercase tracking-[0.08em] text-gray-400 transition-colors hover:text-white"
              >
                {item}
              </a>
            ))}
          </div>

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-full border border-white/20 px-5 py-2 font-dm-mono text-[12px] uppercase tracking-[0.08em] text-white hover:border-white/40 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="rounded-full bg-white px-5 py-2 font-dm-mono text-[12px] uppercase tracking-[0.08em] text-black hover:bg-gray-200 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="rounded-full bg-white px-5 py-2 font-dm-mono text-[12px] uppercase tracking-[0.08em] text-black hover:bg-gray-200 transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero: ghost wordmark behind, italic serif statement, one accent word ── */}
      <section className="relative overflow-hidden">
        <GhostWordmark />

        <div className="relative z-10 mx-auto max-w-3xl px-6 pt-28 pb-24 text-center md:pt-36">
          <motion.div {...fadeIn}>
            <MonoLabel>Focus analytics, not another timer</MonoLabel>
            <h1 className="mt-6 font-serif text-6xl italic leading-[1.05] tracking-tight text-white md:text-8xl">
              Every session, <span className="text-orange-500">proven.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-lg text-[17px] leading-relaxed text-gray-400">
              Analytify turns every focus session into evidence — streaks, deep work
              scores, and burnout signals that actually reflect how you work.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(isLoggedIn ? "/focus" : "/register")}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-dm-mono text-[12px] uppercase tracking-[0.08em] text-black hover:bg-gray-200 transition-all"
              >
                Start Focus Session
                <ArrowForwardRoundedIcon sx={{ fontSize: 15 }} />
              </motion.button>
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-full border border-white/20 px-6 py-3 font-dm-mono text-[12px] uppercase tracking-[0.08em] text-white hover:border-white/40 transition-all"
              >
                View Dashboard
              </button>
            </div>
          </motion.div>
        </div>

        {/* Product preview card — flat surface, one soft shadow, no fake-plastic layering */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mx-auto max-w-4xl px-6 pb-28"
        >
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0d0d] shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <div
              className="w-full"
              style={{ background: "linear-gradient(180deg, rgba(249,115,22,0.14) 0%, rgba(10,10,10,0.9) 40%)" }}
            >
              <img src="/dashBoard.png" alt="Analytify dashboard preview" className="w-full object-cover object-top opacity-95" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Feature showcase ───────────────────────────────────────────────── */}
      <section id="product" className="mx-auto max-w-7xl px-6 py-32">
        <MonoLabel className="block text-center">What you get</MonoLabel>
        <h2 className="mx-auto mt-4 max-w-xl text-center font-serif text-4xl italic leading-tight tracking-tight text-white md:text-5xl">
          The evidence behind every session
        </h2>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mt-16 grid gap-6 md:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeIn}
              className="group rounded-[18px] border border-white/10 bg-[#0d0d0d] p-5 transition-all hover:border-orange-500/30"
            >
              <div
                className="aspect-[16/10] w-full overflow-hidden rounded-[12px]"
                style={{ background: "linear-gradient(180deg, rgba(249,115,22,0.18) 0%, rgba(13,13,13,0.9) 70%)" }}
              >
                <img
                  src={feature.img}
                  alt={feature.title}
                  className="h-full w-full object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                />
              </div>
              <div className="mt-7">
                <h3 className="font-dm-mono text-[12px] uppercase tracking-[0.08em] text-white">{feature.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-500">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="border-y border-white/10 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <MonoLabel className="block text-center">Powering the next generation of builders</MonoLabel>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-16 opacity-30 grayscale contrast-125 transition-all hover:opacity-100 hover:grayscale-0">
            {["Outseta", "Stripe", "Framer", "Webflow"].map((brand) => (
              <span key={brand} className="font-serif text-xl italic tracking-tight text-white">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="steps" className="mx-auto max-w-5xl px-6 py-32">
        <div className="mb-20 text-center">
          <MonoLabel className="block">How it works</MonoLabel>
          <h2 className="mt-4 font-serif text-4xl italic tracking-tight text-white md:text-5xl">
            Three steps to proof
          </h2>
        </div>
        <div className="grid gap-16 md:grid-cols-3">
          {[
            { step: "01", title: "Session Tracking", desc: "Launch focus mode with a single click to record your study sessions and pause them if needed." },
            { step: "02", title: "Track productivity", desc: "Once a session completes, hit abandon to leave or complete to register it." },
            { step: "03", title: "View analytics", desc: "Automated reports focused on your peak cognitive performance hours." },
          ].map((item) => (
            <div key={item.step} className="group relative">
              <span className="font-serif text-4xl italic text-orange-500/80 transition-colors group-hover:text-orange-500/40">
                {item.step}
              </span>
              <div className="mt-4 border-l border-white/10 pl-6">
                <h3 className="font-dm-mono text-[12px] uppercase tracking-[0.08em] text-white">{item.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="footer" className="mx-auto max-w-7xl px-6 py-24">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0d0d] p-12 text-center md:py-24">
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="mb-8 font-serif text-5xl italic tracking-tight text-white md:text-6xl">
              Reclaim your focus.
            </h2>
            <p className="mx-auto mb-10 text-[17px] text-gray-500">
              Built for people who want proof of their deep work, not just a timer.
            </p>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/register")}
              className="rounded-full bg-white px-10 py-3.5 font-dm-mono text-[12px] uppercase tracking-[0.08em] text-black hover:bg-gray-200 transition-all"
            >
              Get Started for Free
            </motion.button>
            <p className="mt-8">
              <MonoLabel>Free forever for individuals</MonoLabel>
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl border-t border-white/10 px-6 py-16">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="font-dm-mono text-[12px] text-gray-600">© 2026 Analytify. All rights reserved.</p>
          <div className="flex gap-8 font-dm-mono text-[12px] text-gray-600">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">System Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
