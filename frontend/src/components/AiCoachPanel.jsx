import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import WbTwilightRoundedIcon from "@mui/icons-material/WbTwilightRounded";
import { getAiContext, sendAiMessage } from "../api/aiApi";

const STARTER_PROMPTS = [
  "Plan my next 90 minutes",
  "What should I do next?",
  "Review my focus pattern this week",
];

const spring = { type: "spring", stiffness: 260, damping: 24 };

const AiCoachPanel = ({ isOpen, onToggle, isVisible = true }) => {
  const [context, setContext] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isVisible) return undefined;

    const loadContext = async () => {
      try {
        setLoading(true);
        const data = await getAiContext();
        setContext(data);
      } catch (err) {
        setError(err?.response?.data?.message || "Could not load AI context");
      } finally {
        setLoading(false);
      }
    };

    loadContext();
    return undefined;
  }, [isVisible]);

  const headerInsight = useMemo(() => buildHeaderInsight(context), [context]);
  const statCards = useMemo(() => buildStatCards(context), [context]);

  const handleSend = async (event, promptOverride) => {
    event?.preventDefault();

    const prompt = String(promptOverride ?? message).trim();
    if (!prompt) return;

    setError("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setMessage("");

    try {
      const data = await sendAiMessage(prompt);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err?.response?.data?.message || "The AI assistant could not answer right now");
    } finally {
      setSending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[80] md:bottom-6 md:right-6">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.section
            key="coach-open"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={spring}
            className="relative w-[calc(100vw-2rem)] max-w-[24rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0d]/95 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:max-w-[28rem]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_32%),radial-gradient(circle_at_100%_10%,rgba(245,158,11,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />

            <div className="relative border-b border-white/8 px-5 pb-4 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-orange-200">
                    <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                    AI Coach
                  </div>
                  <h3 className="mt-4 text-xl font-medium tracking-tight text-white">
                    Personal planning, not generic AI chatter.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{loading ? "Loading your context..." : headerInsight}</p>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04, rotate: 3 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={onToggle}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-gray-300 transition-colors hover:text-white"
                >
                  <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </motion.button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {statCards.map((card) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28 }}
                    className="rounded-[1.35rem] border border-white/8 bg-white/[0.04] px-3 py-3"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                      <card.icon sx={{ fontSize: 13 }} />
                      {card.label}
                    </div>
                    <div className="mt-2 text-lg font-semibold tracking-tight text-white">{card.value}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative max-h-[22rem] min-h-[18rem] overflow-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(249,115,22,0.12),rgba(255,255,255,0.02))] p-4">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-orange-200">
                      <WbTwilightRoundedIcon sx={{ fontSize: 14 }} />
                      Good First Ask
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white">
                      Ask for a next-step plan, a reset strategy, or a realistic time block based on what your week actually looks like.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <motion.button
                        key={prompt}
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(event) => handleSend(event, prompt)}
                        disabled={sending}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-300 transition-all hover:border-orange-400/30 hover:bg-orange-400/10 hover:text-white disabled:opacity-60"
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((item, index) => (
                    <motion.article
                      key={`${item.role}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22 }}
                      className={`max-w-[88%] rounded-[1.4rem] px-4 py-3 ${
                        item.role === "user"
                          ? "ml-auto border border-orange-400/20 bg-[linear-gradient(180deg,rgba(249,115,22,0.16),rgba(249,115,22,0.05))] text-white"
                          : "mr-auto border border-white/8 bg-white/[0.04] text-gray-200"
                      }`}
                    >
                      <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-gray-500">
                        {item.role === "user" ? "You" : "Coach"}
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-7">{item.content}</div>
                    </motion.article>
                  ))}

                  {sending && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mr-auto max-w-[14rem] rounded-[1.35rem] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-gray-400"
                    >
                      Thinking through your pattern...
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="mx-4 mb-3 rounded-[1.2rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSend} className="relative border-t border-white/8 p-4">
              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-2">
                <div className="flex items-end gap-2">
                  <textarea
                    rows={1}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask for a focused plan or realistic next action..."
                    className="min-h-[50px] w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-500"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    disabled={sending || !message.trim()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-orange-600 text-white disabled:opacity-50"
                  >
                    <SendRoundedIcon sx={{ fontSize: 18 }} />
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.section>
        ) : (
          <motion.button
            key="coach-closed"
            initial={{ opacity: 0, y: 18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.94 }}
            transition={spring}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onToggle}
            className="group relative flex items-center gap-3 rounded-full border border-white/10 bg-[#111]/90 px-3.5 py-3 text-left shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.22),transparent_45%)] opacity-80" />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-white shadow-[0_10px_25px_rgba(234,88,12,0.35)]">
              <SmartToyIcon sx={{ fontSize: 22 }} />
            </span>
            <span className="relative hidden pr-2 md:block">
              <span className="block text-[10px] uppercase tracking-[0.24em] text-orange-200">AI Coach</span>
              <span className="mt-1 block text-[15px] font-medium text-white">Open assistant</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

const buildHeaderInsight = (context) => {
  if (!context) {
    return "Reading your current work rhythm.";
  }

  if (context.analytics?.burnoutRisk === "high") {
    return "Your recent pattern looks intense, so this coach should prioritize recovery-aware suggestions over pressure.";
  }

  if ((context.streak?.currentStreak ?? 0) >= 5) {
    return `You are on a ${context.streak.currentStreak}-day streak, so preserving momentum matters more than adding complexity.`;
  }

  if ((context.activeTasks?.length ?? 0) > 0) {
    return `You have ${context.activeTasks.length} active tasks in play, which makes prioritization more useful than ambition right now.`;
  }

  return "Enough behavioral data is in place for grounded, specific suggestions.";
};

const buildStatCards = (context) => [
  {
    label: "Streak",
    value: `${context?.streak?.currentStreak ?? 0}d`,
    icon: TimelineRoundedIcon,
  },
  {
    label: "Deep Work",
    value: context?.analytics?.deepWorkScore ?? 0,
    icon: BoltRoundedIcon,
  },
  {
    label: "Tasks",
    value: context?.activeTasks?.length ?? 0,
    icon: ForumRoundedIcon,
  },
];

export default AiCoachPanel;
