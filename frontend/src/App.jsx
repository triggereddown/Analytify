import React, { useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import Focus from "./pages/Focus";
import PublicProfile from "./pages/PublicProfile";
import AiCoachPanel from "./components/AiCoachPanel";
import WorkJournal from "./pages/WorkJournal";
import TasksPage from "./pages/TasksPage";
import GoalsPage from "./pages/GoalsPage";
import MemoryPage from "./pages/MemoryPage";
import LearningPathsPage from "./pages/LearningPathsPage";

// Wraps a page in both auth-gating and the persistent nav shell so every
// protected route gets the same top nav without repeating boilerplate.
const Shell = ({ children }) => (
  <ProtectedRoute>
    <AppShell>{children}</AppShell>
  </ProtectedRoute>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <Shell>
              <Dashboard />
            </Shell>
          }
        />
        <Route
          path="/focus"
          element={
            <Shell>
              <Focus />
            </Shell>
          }
        />
        <Route
          path="/work-journal"
          element={
            <Shell>
              <WorkJournal />
            </Shell>
          }
        />
        <Route
          path="/tasks"
          element={
            <Shell>
              <TasksPage />
            </Shell>
          }
        />
        <Route
          path="/goals"
          element={
            <Shell>
              <GoalsPage />
            </Shell>
          }
        />
        <Route
          path="/memory"
          element={
            <Shell>
              <MemoryPage />
            </Shell>
          }
        />
        <Route
          path="/learning-paths"
          element={
            <Shell>
              <LearningPathsPage />
            </Shell>
          }
        />
        <Route path="/u/:username" element={<PublicProfile />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const location = useLocation();
  const [isAiOpen, setIsAiOpen] = useState(false);
  const protectedAssistantRoutes = new Set([
    "/dashboard",
    "/focus",
    "/work-journal",
    "/tasks",
    "/goals",
    "/memory",
    "/learning-paths",
  ]);
  const showAssistant = protectedAssistantRoutes.has(location.pathname);

  return (
    <motion.div
      className="mainDiv"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <AnimatedRoutes />
      <AiCoachPanel
        isVisible={showAssistant}
        isOpen={showAssistant && isAiOpen}
        onToggle={() => setIsAiOpen((prev) => !prev)}
      />
    </motion.div>
  );
};

export default App;
