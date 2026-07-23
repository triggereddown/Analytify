import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useFocusSession } from "../features/pomodoro/hooks/useFocusSession";
import { useTasks } from "../features/tasks/hooks/useTasks";
import DistractionPrompt from "../components/DistractionPrompt";
import UndoIcon from "@mui/icons-material/Undo";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import FlagCircleIcon from "@mui/icons-material/FlagCircle";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

// ─── Shared motion props ────────────────────────────────────────────────────
const btnClick = { whileHover: { y: -2 }, whileTap: { scale: 0.97 } };

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Glassy ambient background orbs — unchanged from original */
const BackgroundOrbs = () => (
  <>
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/5 blur-[120px] rounded-full" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/5 blur-[120px] rounded-full" />
  </>
);

/** Top nav bar — unchanged from original */
const TopBar = ({ onLogoClick, onBackToDashboard }) => (
  <nav className="relative z-20 flex items-center justify-between gap-4 p-8">
    <div className="flex items-center gap-4">
      <div
        onClick={onLogoClick}
        className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-orange-600/20"
      >
        <span className="text-xs font-bold">G</span>
      </div>
      <span className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">
        Focus Mode
      </span>
    </div>

    <motion.button
      {...btnClick}
      type="button"
      onClick={onBackToDashboard}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gray-300 hover:border-orange-500/30 hover:text-orange-300"
    >
      <ArrowBackRoundedIcon sx={{ fontSize: 16 }} />
      Dashboard
    </motion.button>
  </nav>
);

/**
 * Recovery banner — shown once when a prior session is restored.
 * Fades in then softly persists.
 */
const RecoveryBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="mb-6 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-widest text-center flex items-center justify-center gap-1.5"
  >
    <UndoIcon sx={{ fontSize: 14 }} />
    Recovered previous session
  </motion.div>
);

/**
 * Session state badge — shows current lifecycle state clearly.
 */
const StateBadge = ({ sessionState }) => {
  const labels = {
    idle:      { text: "Ready",   color: "text-gray-500" },
    created:   { text: "Created", color: "text-blue-400/70" },
    running:   { text: "Running", color: "text-orange-400" },
    paused:    { text: "Paused",  color: "text-yellow-400" },
    expired:   { text: "Expired", color: "text-red-400" },
    completed: { text: "Done",    color: "text-green-400" },
    abandoned: { text: "Stopped", color: "text-gray-400" },
  };
  const { text, color } = labels[sessionState] || labels.idle;
  return (
    <p className={`text-[10px] uppercase tracking-[0.5em] font-bold mb-2 ${color}`}>
      {text}
    </p>
  );
};

/**
 * Timer display — pulse animation only when running.
 */
const TimerDisplay = ({ minutes, seconds, isRunning }) => (
  <motion.div
    animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    className="text-[120px] leading-none font-black tracking-tighter tabular-nums mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
  >
    {minutes}
    <span
      className={`transition-opacity duration-500 ${isRunning ? "animate-pulse" : ""} text-orange-600`}
    >
      :
    </span>
    {String(seconds).padStart(2, "0")}
  </motion.div>
);

/**
 * Task picker — lets the user link the upcoming session to an active task
 * before starting. Only rendered in idle state; a session's task cannot be
 * changed once it's created (matches backend: taskId is set at /start).
 */
const TaskPicker = ({ tasks, loading, selectedTaskId, onSelect, onQuickAdd }) => {
  const [quickAddValue, setQuickAddValue] = useState("");
  const [adding, setAdding] = useState(false);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddValue.trim()) return;
    setAdding(true);
    try {
      const task = await onQuickAdd(quickAddValue.trim());
      onSelect(task._id);
      setQuickAddValue("");
    } catch (err) {
      console.error("Failed to add task", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mb-8 text-left">
      <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold mb-3">
        Linked Task (optional)
      </label>

      {!loading && tasks.length > 0 && (
        <select
          value={selectedTaskId ?? ""}
          onChange={(e) => onSelect(e.target.value || null)}
          className="w-full bg-white/[0.03] border border-white/10 rounded-full px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50 mb-3"
        >
          <option value="">No task — general focus session</option>
          {tasks.map((task) => (
            <option key={task._id} value={task._id}>
              {task.title}
            </option>
          ))}
        </select>
      )}

      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <input
          type="text"
          value={quickAddValue}
          onChange={(e) => setQuickAddValue(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 min-w-0 bg-white/[0.03] border border-white/10 rounded-full px-4 py-2 text-xs text-white outline-none focus:border-orange-500/50"
        />
        <button
          type="submit"
          disabled={adding || !quickAddValue.trim()}
          className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-orange-500 border border-white/10 hover:border-orange-500/50 rounded-full px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </form>
    </div>
  );
};

/**
 * Control buttons — rendered based on sessionState state machine.
 *
 * State machine → button rules:
 *   idle/created → [Start Focus]
 *   running      → [Pause]  + [Abandon | Complete]
 *   paused       → [Resume] + [Abandon | Complete]
 */
const Controls = ({ sessionState, start, pause, resume, abandon, complete, onStartClick }) => {
  const isIdle    = sessionState === "idle" || sessionState === "created";
  const isRunning = sessionState === "running";
  const isPaused  = sessionState === "paused";

  return (
    <div className="flex flex-col gap-5">
      {/* Primary action */}
      {isIdle && (
        <motion.button
          {...btnClick}
          id="btn-start-focus"
          onClick={onStartClick}
          className="bg-orange-600 py-5 rounded-full font-black text-sm tracking-widest uppercase shadow-xl shadow-orange-600/30 active:shadow-none"
        >
          Start Focus
        </motion.button>
      )}

      {isRunning && (
        <motion.button
          {...btnClick}
          id="btn-pause"
          onClick={pause}
          className="bg-white/5 border border-white/20 py-5 rounded-full font-black text-sm tracking-widest uppercase hover:bg-white/10 transition"
        >
          Pause
        </motion.button>
      )}

      {isPaused && (
        <motion.button
          {...btnClick}
          id="btn-resume"
          onClick={resume}
          className="bg-orange-600/80 py-5 rounded-full font-black text-sm tracking-widest uppercase shadow-lg shadow-orange-600/20"
        >
          Resume
        </motion.button>
      )}

      {/* Secondary actions — shown when session is active (not idle) */}
      {(isRunning || isPaused) && (
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            {...btnClick}
            id="btn-abandon"
            onClick={abandon}
            className="bg-white/[0.02] border border-white/[0.05] py-4 rounded-full font-bold text-[11px] uppercase tracking-wider text-gray-500 hover:text-red-400 hover:border-red-400/20 transition-all"
          >
            Abandon
          </motion.button>
          <motion.button
            {...btnClick}
            id="btn-complete"
            onClick={complete}
            className="bg-white/[0.02] border border-white/[0.05] py-4 rounded-full font-bold text-[11px] uppercase tracking-wider text-gray-500 hover:text-orange-400 hover:border-orange-400/20 transition-all"
          >
            Complete
          </motion.button>
        </div>
      )}
    </div>
  );
};

/**
 * End-state card (completed | abandoned | expired).
 * Preserved from original with expired state added.
 */
const EndStateCard = ({ sessionState, onNewSession, onDashboard }) => {
  const config = {
    completed: {
      Icon: FlagCircleIcon,
      iconClass: "text-orange-500",
      title: "Session Complete",
      body: "Outstanding discipline. You've successfully finished your deep work block.",
    },
    abandoned: {
      Icon: StopCircleIcon,
      iconClass: "text-gray-400",
      title: "Session Abandoned",
      body: "Session stopped early. Take a moment to reset and try again when ready.",
    },
    expired: {
      Icon: WarningAmberIcon,
      iconClass: "text-yellow-500",
      title: "Session Expired",
      body: "Timer ran out but sync failed. Your focus time may not have been recorded.",
    },
  };

  const { Icon, iconClass, title, body } = config[sessionState] || config.abandoned;

  return (
    <motion.div
      key="status"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-12 rounded-[2.5rem] text-center max-w-md w-full shadow-2xl"
    >
      <div className={`mb-6 flex justify-center ${iconClass}`}>
        <Icon sx={{ fontSize: 56 }} />
      </div>
      <h2 className="text-3xl font-bold mb-3">{title}</h2>
      <p className="text-gray-400 mb-10 leading-relaxed text-sm">{body}</p>
      <div className="flex flex-col gap-4">
        <motion.button
          {...btnClick}
          id="btn-new-session"
          onClick={onNewSession}
          className="bg-orange-600 py-4 rounded-full font-bold text-sm shadow-lg shadow-orange-600/20"
        >
          New Session
        </motion.button>
        <motion.button
          {...btnClick}
          id="btn-go-dashboard"
          onClick={onDashboard}
          className="bg-white/5 border border-white/10 py-4 rounded-full font-bold text-sm hover:bg-white/10 transition"
        >
          Go to Dashboard
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const Focus = () => {
  const navigate = useNavigate();
  const {
    sessionId,
    sessionState,
    minutes,
    seconds,
    isRunning,
    recovered,
    start,
    pause,
    resume,
    abandon,
    complete,
  } = useFocusSession();
  const { tasks, loading: tasksLoading, addTask } = useTasks();

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [distractionPromptSessionId, setDistractionPromptSessionId] = useState(null);

  const isEndState = ["completed", "abandoned", "expired"].includes(sessionState);
  const isIdle = sessionState === "idle" || sessionState === "created";

  // Wrap pause/abandon so the "what pulled you away?" prompt appears
  // right after the action fires — never blocks the pause/abandon itself,
  // which has already been triggered by the time this renders.
  const handlePause = async () => {
    const id = sessionId;
    await pause();
    if (id) setDistractionPromptSessionId(id);
  };
  const handleAbandon = async () => {
    const id = sessionId;
    await abandon();
    if (id) setDistractionPromptSessionId(id);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#161616] text-white selection:bg-orange-500/30 overflow-hidden relative">
      <BackgroundOrbs />
      <TopBar
        onLogoClick={() => navigate("/")}
        onBackToDashboard={() => navigate("/dashboard")}
      />

      <main className="flex flex-col items-center justify-center h-[calc(100vh-120px)] p-6 relative z-10">
        <AnimatePresence mode="wait">

          {/* ── End states (completed | abandoned | expired) ─────────────── */}
          {isEndState ? (
            <EndStateCard
              key="end"
              sessionState={sessionState}
              onNewSession={() => window.location.reload()}
              onDashboard={() => navigate("/dashboard")}
            />
          ) : (

            /* ── Active timer card ────────────────────────────────────── */
            <motion.div
              key="timer"
              layoutId="formBox"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] p-12 rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-lg text-center relative"
            >
              {/* Recovery banner */}
              <AnimatePresence>
                {recovered && <RecoveryBanner key="recovery" />}
              </AnimatePresence>

              <h3 className="text-xs uppercase tracking-[0.4em] text-orange-500/80 font-bold mb-2">
                Deep Work
              </h3>

              {/* Task picker — idle only, hidden once a session exists */}
              {isIdle && (
                <TaskPicker
                  tasks={tasks}
                  loading={tasksLoading}
                  selectedTaskId={selectedTaskId}
                  onSelect={setSelectedTaskId}
                  onQuickAdd={addTask}
                />
              )}

              {/* Session state badge */}
              <StateBadge sessionState={sessionState} />

              <h3 className="text-xs uppercase tracking-[0.4em] text-orange-500/40 font-bold mb-8">
                Timer will beep a sound upon completion
              </h3>

              {/* Timer */}
              <TimerDisplay
                minutes={minutes}
                seconds={seconds}
                isRunning={isRunning}
              />

              <div className="w-12 h-1 bg-gradient-to-r from-transparent via-orange-600 to-transparent mx-auto mb-14" />

              {/* Controls */}
              <Controls
                sessionState={sessionState}
                start={start}
                pause={handlePause}
                resume={resume}
                abandon={handleAbandon}
                complete={complete}
                onStartClick={() => start(selectedTaskId)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* "What pulled you away?" prompt — shown after pause/abandon */}
      {distractionPromptSessionId && (
        <DistractionPrompt
          sessionId={distractionPromptSessionId}
          onClose={() => setDistractionPromptSessionId(null)}
        />
      )}

      {/* Footer status line */}
      <footer className="absolute bottom-10 left-0 w-full text-center">
        <p className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-bold">
          {isRunning ? "Distractions Silenced" : "System Idle"}
        </p>
      </footer>
    </div>
  );
};

export default Focus;
