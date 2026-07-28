import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useAuthActions } from "../features/auth/hooks/useAuthActions";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: SpaceDashboardRoundedIcon },
  { to: "/focus", label: "Focus", icon: BoltRoundedIcon },
  { to: "/work-journal", label: "Work Journal", icon: LibraryBooksRoundedIcon },
  { to: "/tasks", label: "Tasks", icon: TaskAltRoundedIcon },
  { to: "/goals", label: "Goals", icon: FlagRoundedIcon },
  { to: "/memory", label: "Memory", icon: PsychologyRoundedIcon },
  { to: "/learning-paths", label: "Learning", icon: SchoolRoundedIcon },
];

/**
 * Persistent authenticated-shell navigation. Wraps every protected page so
 * the user can jump between Dashboard/Focus/Work Journal/Goals/Memory/
 * Learning Paths from anywhere, instead of the previous ad-hoc per-page
 * "Back to Dashboard" links. Matches the dark/orange pill-button language
 * established in Landing.jsx.
 */
const AppShell = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthActions();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to) => location.pathname === to;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="h-5 w-5 rounded bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.4)]" />
            <span className="hidden text-sm font-bold uppercase tracking-tight sm:inline">
              Analytify
            </span>
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-1.5 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] transition-all ${
                  isActive(item.to)
                    ? "bg-orange-600 text-white shadow-[0_8px_20px_rgba(234,88,12,0.25)]"
                    : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <item.icon sx={{ fontSize: 16 }} />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <Link
              to="/"
              title="Back to landing page"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-gray-300 transition-all hover:border-orange-500/40 hover:text-white"
            >
              <HomeRoundedIcon sx={{ fontSize: 17 }} />
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 transition-all hover:border-orange-500/40 hover:text-white"
            >
              <LogoutRoundedIcon sx={{ fontSize: 15 }} />
              Logout
            </button>
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] lg:hidden"
          >
            {mobileOpen ? <CloseRoundedIcon sx={{ fontSize: 18 }} /> : <MenuRoundedIcon sx={{ fontSize: 18 }} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/5 lg:hidden"
            >
              <div className="flex flex-col gap-1 px-5 py-4">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`inline-flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                      isActive(item.to)
                        ? "bg-orange-600 text-white"
                        : "text-gray-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <item.icon sx={{ fontSize: 18 }} />
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 inline-flex items-center gap-2.5 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-white/[0.06]"
                >
                  <HomeRoundedIcon sx={{ fontSize: 18 }} />
                  Landing Page
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="inline-flex items-center gap-2.5 rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold uppercase tracking-widest text-gray-400"
                >
                  <LogoutRoundedIcon sx={{ fontSize: 18 }} />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {children}
    </div>
  );
};

export default AppShell;
