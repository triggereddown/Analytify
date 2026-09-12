import { getSettings, setSettings } from "./config.js";

const els = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  token: document.getElementById("token"),
  blocklist: document.getElementById("blocklist"),
  enabled: document.getElementById("enabled"),
  status: document.getElementById("status"),
};

async function load() {
  const settings = await getSettings();
  els.apiBaseUrl.value = settings.apiBaseUrl;
  els.token.value = settings.token;
  els.blocklist.value = settings.blocklist.join("\n");
  els.enabled.checked = settings.enabled;
}

document.getElementById("save").addEventListener("click", async () => {
  await setSettings({
    apiBaseUrl: els.apiBaseUrl.value.trim().replace(/\/$/, ""),
    token: els.token.value.trim(),
    blocklist: els.blocklist.value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    enabled: els.enabled.checked,
  });
  els.status.textContent = "Saved.";
  setTimeout(() => (els.status.textContent = ""), 1500);
});

load();
