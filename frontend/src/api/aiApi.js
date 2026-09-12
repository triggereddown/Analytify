import API from "./api";

export const getAiContext = async () => {
  const { data } = await API.get("/ai/context");
  return data;
};

export const sendAiMessage = async (message) => {
  const { data } = await API.post("/ai/chat", { message });
  return data;
};

/** Resumes a chat turn that paused waiting for the user to approve/reject an action (e.g. create_goal). */
export const respondToAiApproval = async (toolCallId, approved) => {
  const { data } = await API.post("/ai/chat/approve", { toolCallId, approved });
  return data;
};

/** Extracts a clean, corrected title from noisy typed/dictated slash-command text. */
export const cleanCommandText = async (text) => {
  const { data } = await API.post("/ai/clean-command", { text });
  return data;
};

/** Wipes persisted chat history — the coach's next reply starts with no prior turns as context. */
export const clearAiChatHistory = async () => {
  const { data } = await API.delete("/ai/chat");
  return data;
};
