import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import TerminalRoundedIcon from "@mui/icons-material/TerminalRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import { respondToAiApproval, sendAiMessage } from "../api/aiApi";
import { matchSlashCommand, suggestSlashCommands, SLASH_COMMANDS } from "../features/chat/slashCommands";
import { useVoiceInput } from "../features/chat/useVoiceInput";
import { MonoLabel } from "./ui";

const spring = { type: "spring", stiffness: 260, damping: 24 };

// Human-readable label for a tool name the model proposed — only create_goal
// is approval-gated today (see backend ai.graph.ts TOOLS_REQUIRING_APPROVAL),
// but this stays a lookup rather than a hardcoded string so a future
// approval-gated tool just adds a line here.
const APPROVAL_TOOL_LABELS = { create_goal: "New goal" };

/**
 * Coach replies only ever use **bold** for emphasis (confirmed against
 * actual model output) — a full markdown renderer would be solving for
 * documents this app never produces. Bold is the one thing worth turning
 * into a <strong>; everything else stays plain text.
 */
const renderInlineBold = (text) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-cream">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );

/**
 * Inline approval prompt — same card language as the rest of the app (one
 * accent color, hairline border, rounded-xl), not a separate "alert" style.
 * Approval is a request for a decision, not a warning, so it stays neutral
 * rather than reaching for a status color the app doesn't otherwise use.
 */
const ApprovalCard = ({ item, onApprove, onReject, disabled }) => {
  let parsedArgs = {};
  try {
    parsedArgs = JSON.parse(item.arguments || "{}");
  } catch {
    // Malformed args shouldn't crash the panel — fall back to an empty
    // object so the card still renders (title/description just show blank).
  }

  return (
    <div className="mr-auto max-w-[85%] rounded-xl border border-cream/25 bg-[#111] px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cream/25 text-cream">
          <FlagRoundedIcon sx={{ fontSize: 14 }} />
        </span>
        <div className="min-w-0">
          <p className="font-almarai text-[10px] uppercase tracking-[0.08em] text-gray-500">Wants to confirm</p>
          <p className="mt-1 text-sm font-medium text-cream">
            {APPROVAL_TOOL_LABELS[item.toolName] ?? item.toolName}: "{parsedArgs.title ?? "untitled"}"
          </p>
          {parsedArgs.description && (
            <p className="mt-1 text-sm leading-6 text-gray-400">{parsedArgs.description}</p>
          )}
        </div>
      </div>

      {item.resolved ? (
        <p className="mt-3 pl-10 font-almarai text-[11px] uppercase tracking-[0.08em] text-gray-500">
          {item.resolved === "approved" ? "Approved" : "Not created"}
        </p>
      ) : (
        <div className="mt-3 flex gap-2 pl-10">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onApprove(item.toolCallId)}
            className="rounded-lg border border-cream/30 px-3 py-1.5 font-almarai text-xs text-cream transition-colors hover:bg-cream/10 disabled:opacity-40"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onReject(item.toolCallId)}
            className="rounded-lg border border-white/10 px-3 py-1.5 font-almarai text-xs text-gray-400 transition-colors hover:border-white/20 hover:text-gray-200 disabled:opacity-40"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

const AiCoachPanel = ({ isOpen, onToggle, isVisible = true }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

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
      appendAiResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || "The AI assistant could not answer right now");
    } finally {
      setSending(false);
    }
  };

  // Both a fresh chat turn and a resumed (approved/rejected) turn can come
  // back either finished (status: "completed" — show the reply) or paused
  // again (status: "pending_approval" — another gated action in the same
  // round, e.g. two goals in one message) — same handling either way.
  const appendAiResult = (data) => {
    if (data.status === "pending_approval") {
      setMessages((prev) => [
        ...prev,
        {
          role: "approval",
          toolName: data.toolName,
          arguments: data.arguments,
          toolCallId: data.toolCallId,
          resolved: null,
        },
      ]);
    } else {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    }
  };

  const handleApproval = async (toolCallId, approved) => {
    setMessages((prev) =>
      prev.map((item) =>
        item.role === "approval" && item.toolCallId === toolCallId
          ? { ...item, resolved: approved ? "approved" : "rejected" }
          : item,
      ),
    );
    setSending(true);
    try {
      const data = await respondToAiApproval(toolCallId, approved);
      appendAiResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not record that decision");
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
        <div className="fixed right-4 bottom-20 z-[80] md:bottom-6 md:right-6 lg:bottom-6">
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
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top_left,rgba(222,219,200,0.25),transparent_45%)] opacity-80" />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-cream text-black shadow-[0_10px_25px_rgba(222,219,200,0.35)]">
              <SmartToyIcon sx={{ fontSize: 22 }} />
            </span>
            <span className="relative hidden pr-2 md:block">
              <span className="block font-almarai text-[10px] uppercase tracking-[0.08em] text-cream">AI Coach</span>
              <span className="mt-1 block text-[15px] font-medium text-cream">Open assistant</span>
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

            {/* ~85% of the viewport, uncapped so it stays genuinely spacious
                on real monitors instead of being clipped by an arbitrary
                max-width. Header is a single compact row so the message
                area — the part actually being used — gets the space. */}
            <motion.section
              key="coach-open"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              transition={spring}
              className="relative flex h-[90vh] w-[95vw] flex-col overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_40px_120px_rgba(0,0,0,0.7)] md:h-[85vh] md:w-[85vw]"
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
                <MonoLabel>AI Coach</MonoLabel>
                <button
                  type="button"
                  onClick={onToggle}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-gray-300 transition-colors hover:border-white/30 hover:text-cream"
                >
                  <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </button>
              </div>

              <div className="relative flex-1 overflow-auto px-6 py-6">
                {messages.length === 0 ? (
                  <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-6 text-center">
                    <div>
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream/10 text-cream mx-auto mb-4">
                        <SmartToyIcon sx={{ fontSize: 22 }} />
                      </span>
                      <p className="font-almarai text-sm text-gray-400">
                        Ask me anything, or try a quick command below.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {SLASH_COMMANDS.map((cmd) => (
                        <button
                          key={cmd.command}
                          type="button"
                          onClick={() => applySuggestion(cmd)}
                          className="rounded-lg border border-white/10 px-3 py-2 font-almarai text-sm text-gray-300 transition-colors hover:border-cream/40 hover:text-cream"
                        >
                          {cmd.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-3xl space-y-3">
                    {messages.map((item, index) =>
                      item.role === "approval" ? (
                        <motion.div
                          key={`approval-${item.toolCallId}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22 }}
                        >
                          <ApprovalCard
                            item={item}
                            disabled={sending}
                            onApprove={(id) => handleApproval(id, true)}
                            onReject={(id) => handleApproval(id, false)}
                          />
                        </motion.div>
                      ) : item.role === "user" ? (
                        <motion.article
                          key={`user-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22 }}
                          className="ml-auto max-w-[75%] rounded-xl border border-cream/20 bg-cream/[0.06] px-4 py-2.5 text-cream"
                        >
                          <div className="whitespace-pre-wrap text-sm leading-7">{item.content}</div>
                        </motion.article>
                      ) : (
                        <motion.div
                          key={`assistant-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22 }}
                          className="mr-auto flex max-w-[75%] items-start gap-2.5"
                        >
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream/10 text-cream">
                            <SmartToyIcon sx={{ fontSize: 13 }} />
                          </span>
                          <div className="whitespace-pre-wrap text-sm leading-7 text-gray-200">
                            {renderInlineBold(item.content)}
                          </div>
                        </motion.div>
                      ),
                    )}

                    {sending && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mr-auto flex items-center gap-2.5"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream/10 text-cream">
                          <SmartToyIcon sx={{ fontSize: 13 }} />
                        </span>
                        <span className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="h-1.5 w-1.5 rounded-full bg-gray-500"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}
                        </span>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="mx-6 mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSend} className="relative border-t border-white/10 p-5">
                <div className="mx-auto max-w-3xl">
                  <AnimatePresence>
                    {slashSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute inset-x-5 bottom-full mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#141414] shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
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
                              index === suggestionIndex ? "bg-cream/10" : "hover:bg-white/[0.04]"
                            }`}
                          >
                            <TerminalRoundedIcon sx={{ fontSize: 15 }} className="text-cream" />
                            <span className="font-almarai text-sm text-cream">{cmd.label}</span>
                            <span className="text-xs text-gray-500">{cmd.description}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-end gap-2 rounded-2xl border border-white/10 p-2">
                    <textarea
                      rows={1}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      placeholder="Ask anything, or type /..."
                      className="min-h-[50px] w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-cream outline-none placeholder:truncate placeholder:whitespace-nowrap placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      disabled={!voiceSupported}
                      title={
                        !voiceSupported
                          ? "Voice input isn't supported in this browser — try Chrome or Edge"
                          : isListening
                            ? "Stop listening"
                            : "Speak instead of typing"
                      }
                      onClick={toggleListening}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                        isListening
                          ? "border-cream/40 bg-cream/15 text-cream"
                          : "border-white/10 text-gray-300 hover:border-white/30 hover:text-cream"
                      }`}
                    >
                      <motion.span
                        animate={isListening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                        transition={{ duration: 1.1, repeat: isListening ? Infinity : 0 }}
                      >
                        <MicRoundedIcon sx={{ fontSize: 18 }} />
                      </motion.span>
                    </button>
                    <button
                      type="submit"
                      disabled={sending || !message.trim()}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream text-black disabled:opacity-40"
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

export default AiCoachPanel;
