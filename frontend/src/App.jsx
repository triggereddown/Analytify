import React, { useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Focus from "./pages/Focus";
import PublicProfile from "./pages/PublicProfile";
import AiCoachPanel from "./components/AiCoachPanel";
import WorkJournal from "./pages/WorkJournal";

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
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/focus"
          element={
            <ProtectedRoute>
              <Focus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-journal"
          element={
            <ProtectedRoute>
              <WorkJournal />
            </ProtectedRoute>
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
  const protectedAssistantRoutes = new Set(["/dashboard", "/focus", "/work-journal"]);
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
