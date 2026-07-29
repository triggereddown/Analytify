import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import WbTwilightRoundedIcon from "@mui/icons-material/WbTwilightRounded";
import TerminalRoundedIcon from "@mui/icons-material/TerminalRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import { getAiContext, sendAiMessage } from "../api/aiApi";
import { matchSlashCommand, suggestSlashCommands } from "../features/chat/slashCommands";
import { useVoiceInput } from "../features/chat/useVoiceInput";
import { MonoLabel } from "./ui";

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

  // Lock page scroll while the large overlay is open — otherwise the page
  // behind it scrolls along with the panel's own internal scroll areas.
  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const headerInsight = useMemo(() => buildHeaderInsight(context), [context]);
  const statCards = useMemo(() => buildStatCards(context), [context]);
  const slashSuggestions = useMemo(() => suggestSlashCommands(message), [message]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  useEffect(() => {
    setSuggestionIndex(0);
  }, [slashSuggestions.length]);

  const applySuggestion = (cmd) => {
    setMessage(`${cmd.command} `);
  };

  const handleSend = async (event, promptOverride) => {
    event?.preventDefault();

    const prompt = String(promptOverride ?? message).trim();
    if (!prompt) return;

    setError("");
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setMessage("");

    // Exact slash-command match ("/task learn n8n") skips the LLM entirely —
    // no ambiguity to resolve, so no reason to spend a model call on it.
    // Anything else (free text, or a "/" that doesn't resolve) falls
    // through to the normal AI chat + tool-calling path below.
    const command = matchSlashCommand(prompt);
    if (command) {
      setSending(true);
      try {
        const confirmation = await command.run(command.argText);
        setMessages((prev) => [...prev, { role: "assistant", content: confirmation }]);
      } catch (err) {
        setError(err?.response?.data?.message || `Could not run ${command.command}`);
      } finally {
        setSending(false);
      }
      return;
    }

    setSending(true);
    try {
      const data = await sendAiMessage(prompt);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err?.response?.data?.message || "The AI assistant could not answer right now");
    } finally {
      setSending(false);
    }
  };

  // Voice input appends to whatever's already typed rather than replacing
  // it — so "click /, select task, hit mic, speak" produces
  // "/task <spoken text>" instead of wiping out the "/task " prefix the
  // user just picked. If the merged text resolves to a real slash command,
  // there's no ambiguity left to confirm, so it submits automatically;
  // plain dictation (no slash prefix) just fills the box and waits for the
  // user to hit send, same as typing.
  const { isSupported: voiceSupported, isListening, toggleListening } = useVoiceInput((transcript) => {
    setMessage((prev) => {
      const merged = prev.trim() ? `${prev.trim()} ${transcript}` : transcript;
      const command = matchSlashCommand(merged);
      if (command) {
        // Fire on the next tick so this state update commits first.
        setTimeout(() => handleSend(null, merged), 0);
        return "";
      }
      return merged;
    });
  });

  const handleInputKeyDown = (event) => {
    if (slashSuggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSuggestionIndex((i) => (i + 1) % slashSuggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSuggestionIndex((i) => (i - 1 + slashSuggestions.length) % slashSuggestions.length);
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        applySuggestion(slashSuggestions[suggestionIndex]);
        return;
      }
    }

    // Standard chat convention: Enter sends, Shift+Enter inserts a newline.
    // A plain <textarea> never submits its form on Enter on its own — this
    // was a real gap, not just a missing nicety.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend(event);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-[80] md:bottom-6 md:right-6">
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
              <span className="block font-dm-mono text-[10px] uppercase tracking-[0.08em] text-orange-300">AI Coach</span>
              <span className="mt-1 block text-[15px] font-medium text-white">Open assistant</span>
            </span>
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-8">
            <motion.div
              key="coach-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Roughly 70% of the viewport, per the ask — capped so it stays
                usable on very large or very small screens. */}
            <motion.section
              key="coach-open"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              transition={spring}
              className="relative flex h-[85vh] w-[92vw] max-w-[1100px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-black shadow-[0_40px_120px_rgba(0,0,0,0.7)] md:h-[70vh] md:w-[70vw]"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                <div>
                  <MonoLabel>AI Coach</MonoLabel>
                  <h3 className="mt-3 font-serif text-2xl italic tracking-tight text-white md:text-3xl">
                    Personal planning, not generic AI chatter.
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
                    {loading ? "Loading your context..." : headerInsight}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onToggle}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-gray-300 transition-colors hover:border-white/30 hover:text-white"
                >
                  <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 border-b border-white/10 px-6 py-4">
                {statCards.map((card) => (
                  <div key={card.label} className="rounded-[12px] border border-white/10 px-4 py-3">
                    <div className="flex items-center gap-1.5 font-dm-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
                      <card.icon sx={{ fontSize: 13 }} className="text-orange-500" />
                      {card.label}
                    </div>
                    <div className="mt-1.5 text-xl font-medium tracking-tight text-white">{card.value}</div>
                  </div>
                ))}
              </div>

              <div className="relative flex-1 overflow-auto px-6 py-5">
                {messages.length === 0 ? (
                  <div className="mx-auto max-w-2xl space-y-5">
                    <div className="rounded-[18px] border border-orange-500/30 p-5">
                      <div className="flex items-center gap-2 font-dm-mono text-[11px] uppercase tracking-[0.08em] text-orange-400">
                        <WbTwilightRoundedIcon sx={{ fontSize: 14 }} />
                        Good first ask
                      </div>
                      <p className="mt-3 text-[15px] leading-7 text-white">
                        Ask for a next-step plan, a reset strategy, or a realistic time block based on what your week
                        actually looks like — or type <span className="font-dm-mono text-orange-300">/task</span>,{" "}
                        <span className="font-dm-mono text-orange-300">/goal</span>, or{" "}
                        <span className="font-dm-mono text-orange-300">/reminder</span> to create something directly.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {STARTER_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={(event) => handleSend(event, prompt)}
                          disabled={sending}
                          className="rounded-full border border-white/20 px-4 py-2 text-sm text-gray-300 transition-all hover:border-orange-500/40 hover:text-white disabled:opacity-60"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-2xl space-y-3">
                    {messages.map((item, index) => (
                      <motion.article
                        key={`${item.role}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22 }}
                        className={`max-w-[85%] rounded-[16px] border px-4 py-3 ${
                          item.role === "user"
                            ? "ml-auto border-orange-500/30 bg-orange-500/[0.06] text-white"
                            : "mr-auto border-white/10 text-gray-200"
                        }`}
                      >
                        <div className="mb-2 font-dm-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
                          {item.role === "user" ? "You" : "Coach"}
                        </div>
                        <div className="whitespace-pre-wrap text-sm leading-7">{item.content}</div>
                      </motion.article>
                    ))}

                    {sending && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mr-auto max-w-xs rounded-[16px] border border-white/10 px-4 py-3 text-sm text-gray-400"
                      >
                        Thinking through your pattern...
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="mx-6 mb-3 rounded-[12px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSend} className="relative border-t border-white/10 p-5">
                <div className="mx-auto max-w-2xl">
                  <AnimatePresence>
                    {slashSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute inset-x-5 bottom-full mb-2 overflow-hidden rounded-[12px] border border-white/10 bg-[#141414] shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                      >
                        {slashSuggestions.map((cmd, index) => (
                          <button
                            key={cmd.command}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              applySuggestion(cmd);
                            }}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              index === suggestionIndex ? "bg-orange-500/10" : "hover:bg-white/[0.04]"
                            }`}
                          >
                            <TerminalRoundedIcon sx={{ fontSize: 15 }} className="text-orange-400" />
                            <span className="font-dm-mono text-sm text-orange-300">{cmd.label}</span>
                            <span className="text-xs text-gray-500">{cmd.description}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-end gap-2 rounded-[16px] border border-white/10 p-2">
                    <textarea
                      rows={1}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      placeholder="Ask a question, or type / for quick commands..."
                      className="min-h-[50px] w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-500"
                    />
                    {voiceSupported && (
                      <button
                        type="button"
                        title={isListening ? "Stop listening" : "Speak instead of typing"}
                        onClick={toggleListening}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border transition-colors ${
                          isListening
                            ? "border-orange-400/50 bg-orange-500/20 text-orange-200"
                            : "border-white/10 text-gray-300 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        <motion.span
                          animate={isListening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                          transition={{ duration: 1.1, repeat: isListening ? Infinity : 0 }}
                        >
                          <MicRoundedIcon sx={{ fontSize: 18 }} />
                        </motion.span>
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={sending || !message.trim()}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white text-black disabled:opacity-40"
                    >
                      <SendRoundedIcon sx={{ fontSize: 18 }} />
                    </button>
                  </div>
                </div>
              </form>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </>
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
