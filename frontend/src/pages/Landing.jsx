import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import png1 from "../assets/png1.png";
import png2 from "../assets/png2.png";
import png3 from "../assets/png3.png";

const NAV_LINKS = ["Product", "Steps", "Footer"];

/**
 * A grid rising into a warm glow at the floor of the hero — flat, static,
 * no rotation or fake depth. Deliberately avoids `mask-image`: it renders
 * inconsistently (fades correctly on one edge but not the other) once nested
 * inside an absolutely-positioned, overflow-hidden ancestor — reproduced and
 * confirmed in isolation, not just a one-off. Solid-color linear-gradient
 * overlays that fade to transparent are the boring, reliable alternative:
 * they cover the grid/glow's hard edges with the page's own background
 * color, fading out, so no masking behavior is depended on at all.
 */
const GridGlowFloor = () => (
  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(55% 70% at 50% 100%, rgba(249,115,22,0.5) 0%, rgba(234,88,12,0.2) 40%, transparent 75%)",
      }}
    />
    <div
      className="absolute inset-0 opacity-40"
      style={{
        backgroundImage:
          "linear-gradient(rgba(249,115,22,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.4) 1px, transparent 1px)",
        backgroundSize: "42px 42px",
      }}
    />
    {/* Solid-color fade caps — plain gradients, not masks, covering the hard top/bottom edges */}
    <div
      className="absolute inset-x-0 top-0 h-1/2"
      style={{ background: "linear-gradient(to bottom, #0a0a0a 0%, transparent 100%)" }}
    />
    <div
      className="absolute inset-x-0 bottom-0 h-1/4"
      style={{ background: "linear-gradient(to top, #0a0a0a 0%, transparent 100%)" }}
    />
  </div>
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
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-500/30 antialiased">
      {/* ── Nav: plain text links, boxed CTA ──────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full bg-[#0a0a0a]">
        <div className="mx-auto flex h-[84px] max-w-7xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight">Analytify</span>

          <div className="hidden items-center gap-9 md:flex">
            {NAV_LINKS.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={(e) => handleScroll(e, item.toLowerCase())}
                className="text-[14px] text-gray-300 transition-colors hover:text-white"
              >
                {item}
              </a>
            ))}
          </div>

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-md bg-orange-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-orange-700 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="rounded-md bg-[#e8e4dc] px-5 py-2.5 text-[13px] font-medium text-black hover:bg-white transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="rounded-md bg-[#e8e4dc] px-5 py-2.5 text-[13px] font-medium text-black hover:bg-white transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero: centered statement, split typography, grid/glow floor ──── */}
      <section className="relative overflow-hidden">
        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-20 pb-56 text-center md:pt-28">
          <motion.div {...fadeIn}>
            <h1 className="text-5xl font-medium leading-[1.1] tracking-tight text-white md:text-7xl">
              Every focus session,
            </h1>
            <h1 className="mt-1 font-serif text-5xl italic leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 md:text-7xl">
              turned into progress
            </h1>
            <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-gray-400">
              Analytify turns every session into evidence — streaks, deep work
              scores, and burnout signals that actually reflect how you work.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(isLoggedIn ? "/focus" : "/register")}
                className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-6 py-3.5 text-sm font-medium text-white hover:bg-orange-700 transition-all"
              >
                Start Focus Session
                <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
              </motion.button>
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-md bg-[#e8e4dc] px-6 py-3.5 text-sm font-medium text-black hover:bg-white transition-all"
              >
                View Dashboard
              </button>
            </div>
          </motion.div>
        </div>

        <GridGlowFloor />
      </section>

      {/* ── Feature showcase ───────────────────────────────────────────────── */}
      <section id="product" className="mx-auto max-w-7xl px-6 py-32">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeIn}
              className="group rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 transition-all hover:border-orange-600/30"
            >
              <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-[#161616] ring-1 ring-inset ring-white/5">
                <img
                  src={feature.img}
                  alt={feature.title}
                  className="h-full w-full object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                />
              </div>
              <div className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{feature.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-500">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="border-y border-white/10 bg-[#0f0f0f]/20 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-12 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
            Powering the next generation of builders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-16 opacity-30 grayscale contrast-125 transition-all hover:opacity-100 hover:grayscale-0">
            {["Outseta", "Stripe", "Framer", "Webflow"].map((brand) => (
              <span key={brand} className="text-xl font-bold tracking-tighter text-white">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="steps" className="mx-auto max-w-5xl px-6 py-32">
        <div className="mb-20 text-center">
          <h2 className="text-3xl font-medium tracking-tight text-white/90 md:text-4xl">
            Steps On How To Get Started
          </h2>
        </div>
        <div className="grid gap-16 md:grid-cols-3">
          {[
            { step: "01", title: "Session Tracking", desc: "Launch focus mode with a single click to record your study sessions and pause them if needed." },
            { step: "02", title: "Track productivity", desc: "Once a session completes, hit abandon to leave or complete to register it." },
            { step: "03", title: "View analytics", desc: "Automated reports focused on your peak cognitive performance hours." },
          ].map((item) => (
            <div key={item.step} className="group relative">
              <span className="text-4xl font-light text-orange-600 transition-colors group-hover:text-orange-600/40">
                {item.step}
              </span>
              <div className="mt-4 border-l border-white/10 pl-6">
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="footer" className="mx-auto max-w-7xl px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f0f] p-12 text-center md:py-24">
          <div className="absolute top-0 left-1/2 h-64 w-full -translate-x-1/2 bg-orange-600/5 blur-[120px]" />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="mb-8 text-4xl font-medium tracking-tight md:text-5xl">Reclaim your focus.</h2>
            <p className="mx-auto mb-10 text-lg text-gray-500">
              Built for people who want proof of their deep work, not just a timer.
            </p>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/register")}
              className="rounded-lg bg-white px-10 py-4 text-sm font-bold text-black shadow-xl hover:bg-gray-200 transition-all"
            >
              Get Started for Free
            </motion.button>
            <p className="mt-8 text-[11px] font-bold uppercase tracking-widest text-gray-600">
              Free forever for individuals
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl border-t border-white/10 px-6 py-16">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-[13px] text-gray-600">© 2026 Analytify. All rights reserved.</p>
          <div className="flex gap-8 text-[13px] text-gray-600">
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
