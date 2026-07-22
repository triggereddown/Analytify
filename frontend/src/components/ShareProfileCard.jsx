import React, { useEffect, useState } from "react";
import {
  fetchMyProfile,
  updateUsername,
  updateVisibility,
} from "../api/profileApi";

/**
 * Lets the user claim a public username and toggle whether their
 * heatmap/streak is visible at /u/:username with no login required.
 * Self-contained: fetches its own state so it can be dropped into
 * Dashboard without threading profile data through useDashboardData.
 */
const ShareProfileCard = () => {
  const [profile, setProfile] = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "error"|"success", text }

  useEffect(() => {
    fetchMyProfile()
      .then((res) => {
        setProfile(res.data);
        setUsernameInput(res.data.username ?? "");
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const handleSaveUsername = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await updateUsername(usernameInput);
      setProfile(res.data);
      setMessage({ type: "success", text: "Username saved." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message ?? "Failed to save username.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!profile.username) {
      setMessage({ type: "error", text: "Set a username first." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await updateVisibility(!profile.isPublic);
      setProfile(res.data);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message ?? "Failed to update visibility.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="bg-[#111] border border-white/5 rounded-3xl p-6 shadow-lg animate-pulse text-gray-500 text-sm">
        Loading share settings...
      </div>
    );
  }

  if (status === "error") {
    return null; // non-critical widget — fail silently rather than block the dashboard
  }

  const publicUrl = profile.username
    ? `${window.location.origin}/u/${profile.username}`
    : null;

  return (
    <div className="bg-[#111] border border-white/5 rounded-3xl p-6 shadow-lg flex flex-col gap-4">
      <div>
        <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
          Public Profile
        </span>
        <p className="text-xs text-gray-500 mt-1">
          Share your heatmap and streak with a public link — no login required to view.
        </p>
      </div>

      <form onSubmit={handleSaveUsername} className="flex gap-2">
        <div className="flex-1 flex items-center bg-black/30 border border-white/10 rounded-full px-4 py-2">
          <span className="text-gray-500 text-sm">analytify.app/u/</span>
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
            placeholder="username"
            maxLength={24}
            className="bg-transparent outline-none text-sm text-white flex-1 min-w-0"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !usernameInput}
          className="text-xs font-bold uppercase tracking-widest text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-full px-4 py-2 transition-colors"
        >
          Save
        </button>
      </form>

      <button
        onClick={handleToggleVisibility}
        disabled={saving || !profile.username}
        className={`flex items-center justify-between text-xs font-bold uppercase tracking-widest rounded-full px-4 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          profile.isPublic
            ? "text-orange-500 border-orange-500/40 hover:border-orange-500/70"
            : "text-gray-400 border-white/10 hover:border-white/20"
        }`}
      >
        <span>{profile.isPublic ? "Public" : "Private"}</span>
        <span>{profile.isPublic ? "Click to hide" : "Click to share"}</span>
      </button>

      {profile.isPublic && publicUrl && (
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-orange-500 hover:text-orange-400 truncate"
        >
          {publicUrl}
        </a>
      )}

      {message && (
        <p
          className={`text-xs ${
            message.type === "error" ? "text-red-400" : "text-green-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
};

export default ShareProfileCard;
