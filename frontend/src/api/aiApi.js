import API from "./api";

export const getAiContext = async () => {
  const { data } = await API.get("/ai/context");
  return data;
};

export const sendAiMessage = async (message) => {
  const { data } = await API.post("/ai/chat", { message });
  return data;
};

/** Extracts a clean, corrected title from noisy typed/dictated slash-command text. */
export const cleanCommandText = async (text) => {
  const { data } = await API.post("/ai/clean-command", { text });
  return data;
};
