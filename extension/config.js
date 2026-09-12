// Shared defaults, read/written to chrome.storage.sync so options/background/popup agree.
export const DEFAULT_BLOCKLIST = [
  "youtube.com",
  "instagram.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "reddit.com",
  "tiktok.com",
  "netflix.com",
];

export const DEFAULT_SETTINGS = {
  apiBaseUrl: "http://localhost:5000/api",
  token: "",
  blocklist: DEFAULT_BLOCKLIST,
  enabled: true,
};

export async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return stored;
}

export async function setSettings(partial) {
  await chrome.storage.sync.set(partial);
}
