import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const GridBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage: `linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
    <svg
      className="absolute top-1/2 left-0 w-full h-64 -translate-y-1/2 opacity-[0.08]"
      viewBox="0 0 1000 100"
      preserveAspectRatio="none"
    >
      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          duration: 4,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
        d="M0 80 C 150 70, 350 90, 500 60 S 850 30, 1000 50"
        fill="none"
        stroke="#f97316"
        strokeWidth="0.5"
      />
    </svg>
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-orange-500/30 antialiased">
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="h-5 w-5 rounded bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.4)]" />
            <span className="text-sm font-bold tracking-tight uppercase">
              FocusMetrics
            </span>
          </div>

          <div className="hidden items-center gap-10 text-[13px] font-medium text-gray-400 md:flex">
            {["Product", "Pricing", "Blog"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="transition-colors hover:text-white"
              >
                {item}
              </a>
            ))}
            {!isLoggedIn && (
              <a href="/login" className="transition-colors hover:text-white">
                Login
              </a>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-800 border border-white/10 hover:border-orange-500/50 transition-colors"
                  title="Profile Dashboard"
                >
                  <div className="h-4 w-4 rounded-full border-2 border-orange-500/70" />
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[13px] font-semibold text-white hover:bg-white/10 transition-all active:scale-95"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/register")}
                className="rounded-full bg-orange-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/10 active:scale-95"
              >
                Sign up
              </button>
            )}
          </div>
        </div>
      </nav>

      <section className="relative flex min-h-screen items-center justify-center px-6 pt-20">
        <GridBackground />
        <div className="relative z-10 max-w-3xl text-center">
          <motion.div {...fadeIn}>
            <div className="mb-8 inline-flex items-center rounded-full border border-orange-500/20 bg-orange-500/5 px-3 py-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-orange-500">
                v2.0 Analytics Now Live
              </span>
            </div>
            <h1 className="mb-8 text-6xl font-medium tracking-tight md:text-8xl">
              Focus Better. <br />
              <span className="text-gray-500">Measure Deep Work.</span>
            </h1>
            <p className="mx-auto mb-12 max-w-xl text-lg leading-relaxed text-gray-400/80">
              A minimalist analytics platform designed for high-output teams to
              reclaim their deep work hours and eliminate digital fatigue.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <motion.button
                onClick={() => navigate("/focus")}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="h-12 rounded-lg bg-orange-600 px-8 text-sm font-bold text-white hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20"
              >
                Start Focus Session
              </motion.button>
              <motion.button
                onClick={() => navigate("/dashboard")}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="h-12 rounded-lg border border-white/10 bg-white/5 px-8 text-sm font-medium text-white hover:bg-white/10 transition-all"
              >
                View Dashboard
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="product" className="max-w-7xl mx-auto px-6 py-32">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-3"
        >
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              variants={fadeIn}
              className="group rounded-2xl border border-white/5 bg-[#0f0f0f] p-5 transition-all hover:border-orange-600/30 shadow-sm"
            >
              <div className="aspect-[16/10] w-full rounded-lg bg-[#161616] ring-1 ring-inset ring-white/5 transition-colors group-hover:bg-[#1a1a1a]" />
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Analytics View {i}
                </h3>
                <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">
                  Precision metrics visualized through high-fidelity data
                  streams for granular productivity tracking.
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="border-y border-white/5 bg-[#0f0f0f]/20 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="mb-12 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
            Powering the next generation of builders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-16 opacity-30 grayscale contrast-125 transition-all hover:opacity-100 hover:grayscale-0">
            {["Outseta", "Stripe", "Framer", "Webflow"].map((brand) => (
              <span
                key={brand}
                className="text-xl font-bold tracking-tighter text-white"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-32">
        <div className="mb-20 text-center">
          <h2 className="text-3xl font-medium tracking-tight md:text-4xl text-white/90">
            Simple. Effective. Deep.
          </h2>
        </div>
        <div className="grid gap-16 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Start a session",
              desc: "Launch focus mode with a single click to block high-frequency distractions.",
            },
            {
              step: "02",
              title: "Track productivity",
              desc: "Passive measurement of engagement levels and screen focus intervals.",
            },
            {
              step: "03",
              title: "View analytics",
              desc: "Deploy automated reports focused on your peak cognitive performance hours.",
            },
          ].map((item, idx) => (
            <div key={idx} className="relative group">
              <span className="text-4xl font-light text-orange-600/20 group-hover:text-orange-600/40 transition-colors">
                {item.step}
              </span>
              <div className="mt-4 border-l border-white/5 pl-6">
                <h3 className="text-base font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-gray-500">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#0f0f0f] p-12 text-center md:py-24">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-full bg-orange-600/5 blur-[120px]" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="mb-8 text-4xl font-medium tracking-tight md:text-5xl">
              Reclaim your focus.
            </h2>
            <p className="mx-auto mb-10 text-gray-500 text-lg">
              Join 10,000+ engineers and designers tracking their deep work.
              Built for the modern web.
            </p>
            <motion.button
              onClick={() => navigate("/focus")}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="h-14 rounded-lg bg-white px-10 text-sm font-bold text-black hover:bg-gray-200 transition-all shadow-xl"
            >
              Get Started for Free
            </motion.button>
            <p className="mt-8 text-[11px] font-bold text-gray-600 uppercase tracking-widest">
              Free forever for individuals
            </p>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto border-t border-white/5 px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[13px] text-gray-600">
            © 2026 FocusMetrics. All rights reserved.
          </p>
          <div className="flex gap-8 text-[13px] text-gray-600">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              System Status
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
