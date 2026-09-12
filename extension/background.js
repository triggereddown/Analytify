import { getSettings } from "./config.js";

// ponytail: naive hostname-substring blocklist match; swap for a proper
// public-suffix-aware matcher if false positives on lookalike domains show up.
const matchesBlocklist = (hostname, blocklist) =>
  blocklist.some((entry) => hostname === entry || hostname.endsWith(`.${entry}`));

let activeSessionId = null;
let lastLoggedHostAt = 0;
const RELOG_COOLDOWN_MS = 60_000; // don't spam-log the same distracting tab every navigation

async function fetchActiveSession() {
  const { apiBaseUrl, token, enabled } = await getSettings();
  if (!enabled || !token) {
    activeSessionId = null;
    return;
  }
  try {
    const res = await fetch(`${apiBaseUrl}/pomodoro/active-session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      activeSessionId = null;
      return;
    }
    const session = await res.json();
    activeSessionId = session && session.status === "running" ? session.sessionId ?? session.id : null;
  } catch {
    activeSessionId = null;
  }
}

async function logDistraction(hostname) {
  const { apiBaseUrl, token } = await getSettings();
  if (!activeSessionId || !token) return;
  try {
    await fetch(`${apiBaseUrl}/distractions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId: activeSessionId,
        category: "social_media",
        note: `Visited ${hostname} during focus session`,
      }),
    });
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
  } catch {
    // best-effort; a missed log isn't worth surfacing an error to the user
  }
}

async function checkTab(tab) {
  if (!tab?.url) return;
  let hostname;
  try {
    hostname = new URL(tab.url).hostname;
  } catch {
    return;
  }

  await fetchActiveSession();
  if (!activeSessionId) return;

  const { blocklist } = await getSettings();
  if (!matchesBlocklist(hostname, blocklist)) return;

  const now = Date.now();
  if (now - lastLoggedHostAt < RELOG_COOLDOWN_MS) return;
  lastLoggedHostAt = now;

  await logDistraction(hostname);
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  checkTab(tab);
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") checkTab(tab);
});

// Poll active-session periodically so the badge clears once a session ends.
chrome.alarms.create("refresh-session", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refresh-session") {
    fetchActiveSession().then(() => {
      if (!activeSessionId) chrome.action.setBadgeText({ text: "" });
    });
  }
});
