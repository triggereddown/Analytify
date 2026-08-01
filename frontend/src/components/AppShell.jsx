import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import PsychologyRoundedIcon from "@mui/icons-material/PsychologyRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
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

/** Icon button with a label tooltip that appears on hover — desktop sidebar only. */
const NavIcon = ({ to, label, icon: Icon, active }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Link
        to={to}
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
          active ? "bg-cream text-black" : "text-gray-400 hover:bg-white/[0.06] hover:text-cream"
        }`}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Link>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.12 }}
            className="font-almarai pointer-events-none absolute top-1/2 left-full ml-3 -translate-y-1/2 rounded-md border border-white/10 bg-[#141414] px-2.5 py-1.5 text-xs whitespace-nowrap text-cream shadow-lg"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Slim icon-only sidebar (desktop) / bottom icon bar (mobile) — replaces
 * the previous full-width labeled top nav. The Landing page's own
 * Workspace dropdown already covers "get me into the app"; once inside,
 * this only needs to be a compact way to move between sections, not a
 * second copy of the same wide labeled bar on every single page.
 */
const AppShell = ({ children }) => {
  const location = useLocation();
  const { logout } = useAuthActions();

  const isActive = (to) => location.pathname === to;

  return (
    <div className="flex min-h-screen bg-black text-cream">
      {/* Desktop: fixed-width vertical icon rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col items-center border-r border-white/10 bg-black py-5 lg:flex">
        <Link to="/dashboard" className="mb-6 flex h-9 w-9 items-center justify-center">
          <div className="h-5 w-5 rounded bg-cream shadow-[0_0_15px_rgba(222,219,200,0.4)]" />
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-1.5">
          {NAV_ITEMS.map((item) => (
            <NavIcon key={item.to} {...item} active={isActive(item.to)} />
          ))}
        </nav>

        <div className="flex flex-col items-center gap-1.5">
          <NavIcon to="/" label="Landing page" icon={HomeRoundedIcon} active={false} />
          <button
            onClick={logout}
            title="Logout"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-white/[0.06] hover:text-cream"
          >
            <LogoutRoundedIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
      </aside>

      {/* Mobile: fixed-height horizontal icon bar along the bottom */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/10 bg-black/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
              isActive(item.to) ? "bg-cream text-black" : "text-gray-400"
            }`}
          >
            <item.icon sx={{ fontSize: 19 }} />
          </Link>
        ))}
        <button
          onClick={logout}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400"
        >
          <LogoutRoundedIcon sx={{ fontSize: 19 }} />
        </button>
      </nav>

      <main className="min-w-0 flex-1 pb-20 lg:pb-0 lg:pl-[76px]">{children}</main>
    </div>
  );
};

export default AppShell;
