import { getSettings } from "./config.js";

const stateEl = document.getElementById("state");

(async () => {
  const { apiBaseUrl, token, enabled } = await getSettings();
  if (!token) {
    stateEl.textContent = "No token set — open Settings.";
    return;
  }
  if (!enabled) {
    stateEl.textContent = "Disabled.";
    return;
  }
  try {
    const res = await fetch(`${apiBaseUrl}/pomodoro/active-session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const session = res.ok ? await res.json() : null;
    stateEl.textContent =
      session && session.status === "running" ? "Focus session active — watching tabs." : "No active session.";
  } catch {
    stateEl.textContent = "Can't reach server.";
  }
})();

document.getElementById("openOptions").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
