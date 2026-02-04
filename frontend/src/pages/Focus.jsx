// import React from "react";
// import { useNavigate } from "react-router-dom";
// import API from "../api/api";
// import { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";

// const TOTAL_MINUTES = 25;
// const TOTAL_SECONDS = TOTAL_MINUTES * 60;

// const Focus = () => {
//   const navigate = useNavigate();

//   const [sessionId, setSessionId] = useState(null);
//   const [status, setStatus] = useState("");
//   const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
//   const [isRunning, setIsRunning] = useState(false);

//   const intervalRef = useRef(null);

//   useEffect(() => {
//     const startSession = async () => {
//       try {
//         const res = await API.post("/pomodoro/start");
//         setSessionId(res.data._id);
//       } catch (err) {
//         console.error("Failed to start session", err);
//       }
//     };
//     startSession();
//     return () => clearInterval(intervalRef.current);
//   }, []);

//   useEffect(() => {
//     if (!isRunning) return;
//     intervalRef.current = setInterval(() => {
//       setSecondsLeft((prev) => {
//         if (prev <= 1) {
//           clearInterval(intervalRef.current);
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//     return () => clearInterval(intervalRef.current);
//   }, [isRunning]);

//   const elapsedMinutes = Math.floor((TOTAL_SECONDS - secondsLeft) / 60);
//   const minutes = Math.floor(secondsLeft / 60);
//   const seconds = secondsLeft % 60;

//   const handleStart = () => setIsRunning(true);
//   const handlePause = () => setIsRunning(false);

//   const handleStop = async () => {
//     if (!sessionId) return;
//     setIsRunning(false);
//     try {
//       await API.post("/pomodoro/abandon", {
//         sessionId,
//         duration: elapsedMinutes,
//       });
//       setStatus("abandoned");
//     } catch (err) {
//       console.error("Failed to abandon session", err);
//     }
//   };

//   const handleComplete = async () => {
//     if (!sessionId) return;
//     setIsRunning(false);
//     try {
//       await API.post("/pomodoro/complete", {
//         sessionId,
//         duration: elapsedMinutes,
//       });
//       setStatus("completed");
//     } catch (err) {
//       console.error("Failed to complete session", err);
//     }
//   };

//   // Reusable Button Motion Props
//   const btnClick = { whileHover: { y: -2 }, whileTap: { scale: 0.97 } };

//   if (!sessionId) {
//     return (
//       <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
//         <motion.p
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           className="text-gray-500 font-medium tracking-widest uppercase text-sm"
//         >
//           Initializing Focus Session...
//         </motion.p>
//       </div>
//     );
//   }
import React from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TOTAL_MINUTES = 25;
const TOTAL_SECONDS = TOTAL_MINUTES * 60;

// const TOTAL_MINUTES = 0.166;
// const TOTAL_SECONDS = 10;

const Focus = () => {
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef(null);

  // ✅ NEW: audio ref
  const audioRef = useRef(null);

  useEffect(() => {
    const startSession = async () => {
      try {
        const res = await API.post("/pomodoro/start");
        setSessionId(res.data._id);
      } catch (err) {
        console.error("Failed to start session", err);
      }
    };

    startSession();

    // ✅ NEW: preload sound
    audioRef.current = new Audio("/beep.mp3");
    audioRef.current.volume = 0.7;

    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);

          // ✅ NEW: play sound when timer ends
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }

          // auto complete session
          handleComplete();

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const elapsedMinutes = Math.floor((TOTAL_SECONDS - secondsLeft) / 60);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);

  const handleStop = async () => {
    if (!sessionId) return;
    setIsRunning(false);
    try {
      await API.post("/pomodoro/abandon", {
        sessionId,
        duration: elapsedMinutes,
      });
      setStatus("abandoned");
    } catch (err) {
      console.error("Failed to abandon session", err);
    }
  };

  const handleComplete = async () => {
    if (!sessionId) return;
    setIsRunning(false);
    try {
      await API.post("/pomodoro/complete", {
        sessionId,
        duration: elapsedMinutes,
      });
      setStatus("completed");
    } catch (err) {
      console.error("Failed to complete session", err);
    }
  };

  const btnClick = { whileHover: { y: -2 }, whileTap: { scale: 0.97 } };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-500 font-medium tracking-widest uppercase text-sm"
        >
          Initializing Focus Session...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#161616] text-white  selection:bg-orange-500/30 overflow-hidden relative">
      {/* Background Glassy Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/5 blur-[120px] rounded-full" />

      {/* 1️⃣ Top Bar */}
      <nav className="p-8 flex items-center gap-4 relative z-20">
        <div
          onClick={() => navigate("/")}
          className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-orange-600/20"
        >
          <span className="text-xs font-bold">G</span>
        </div>
        <span className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">
          Focus Mode
        </span>
      </nav>

      <main className="flex flex-col items-center justify-center h-[calc(100vh-120px)] p-6 relative z-10">
        <AnimatePresence mode="wait">
          {/* 🧩 Ended States (Completed / Abandoned) */}
          {status ? (
            <motion.div
              key="status"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-12 rounded-[2.5rem] text-center max-w-md w-full shadow-2xl"
            >
              <div className="text-5xl mb-6">
                {status === "completed" ? "🏁" : "⏹️"}
              </div>
              <h2 className="text-3xl font-bold mb-3">
                {status === "completed"
                  ? "Session Complete"
                  : "Session Abandoned"}
              </h2>
              <p className="text-gray-400 mb-10 leading-relaxed text-sm">
                {status === "completed"
                  ? "Outstanding discipline. You've successfully finished your deep work block."
                  : "Session stopped early. Take a moment to reset and try again when ready."}
              </p>
              <div className="flex flex-col gap-4">
                <motion.button
                  {...btnClick}
                  onClick={() => window.location.reload()}
                  className="bg-orange-600 py-4 rounded-full font-bold text-sm shadow-lg shadow-orange-600/20"
                >
                  New Session
                </motion.button>
                <motion.button
                  {...btnClick}
                  onClick={() => navigate("/dashboard")}
                  className="bg-white/5 border border-white/10 py-4 rounded-full font-bold text-sm hover:bg-white/10 transition"
                >
                  Go to Dashboard
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* 2️⃣ Main Focus Card */
            <motion.div
              key="timer"
              layoutId="formBox"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] p-12 rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-lg text-center relative"
            >
              <h3 className="text-xs uppercase tracking-[0.4em] text-orange-500/80 font-bold mb-10">
                Deep Work
              </h3>

              <h3 className="text-xs uppercase tracking-[0.4em] text-orange-500/80 font-bold mb-10">
                Timer will beep a sound upon completion
              </h3>
              {/* TIMER DISPLAY */}
              <motion.div
                animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="text-[120px] leading-none font-black tracking-tighter tabular-nums mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
              >
                {minutes}
                <span
                  className={`transition-opacity duration-500 ${isRunning ? "animate-pulse" : ""} text-orange-600`}
                >
                  :
                </span>
                {seconds.toString().padStart(2, "0")}
              </motion.div>

              <div className="w-12 h-1 bg-gradient-to-r from-transparent via-orange-600 to-transparent mx-auto mb-14" />

              {/* 3️⃣ Controls */}
              <div className="flex flex-col gap-5">
                {!isRunning ? (
                  <motion.button
                    {...btnClick}
                    onClick={handleStart}
                    className="bg-orange-600 py-5 rounded-full font-black text-sm tracking-widest uppercase shadow-xl shadow-orange-600/30 active:shadow-none"
                  >
                    Start Focus
                  </motion.button>
                ) : (
                  <motion.button
                    {...btnClick}
                    onClick={handlePause}
                    className="bg-white/5 border border-white/20 py-5 rounded-full font-black text-sm tracking-widest uppercase hover:bg-white/10 transition"
                  >
                    Pause
                  </motion.button>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    {...btnClick}
                    onClick={handleStop}
                    className="bg-white/[0.02] border border-white/[0.05] py-4 rounded-full font-bold text-[11px] uppercase tracking-wider text-gray-500 hover:text-red-400 hover:border-red-400/20 transition-all"
                  >
                    Abandon
                  </motion.button>
                  <motion.button
                    {...btnClick}
                    onClick={handleComplete}
                    className="bg-white/[0.02] border border-white/[0.05] py-4 rounded-full font-bold text-[11px] uppercase tracking-wider text-gray-500 hover:text-orange-400 hover:border-orange-400/20 transition-all"
                  >
                    Complete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Status */}
      <footer className="absolute bottom-10 left-0 w-full text-center">
        <p className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-bold">
          {isRunning ? "Distractions Silenced" : "System Idle"}
        </p>
      </footer>
    </div>
  );
};

export default Focus;
