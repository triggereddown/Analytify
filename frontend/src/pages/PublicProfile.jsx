import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Heatmap from "../components/Heatmap";
import { fetchPublicProfile } from "../api/publicApi";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

/**
 * Read-only, unauthenticated profile page at /u/:username.
 * Reuses the same Heatmap component and dark visual language as the
 * authenticated Dashboard so a shared link feels like part of the product,
 * not a bolted-on marketing page.
 */
const PublicProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | not-found | error

  useEffect(() => {
    let cancelled = false;

    fetchPublicProfile(username)
      .then((res) => {
        if (cancelled) return;
        setProfile(res.data);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(err.response?.status === 404 ? "not-found" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a] text-gray-400">
        <div className="animate-pulse tracking-widest uppercase text-sm font-medium">
          Loading profile...
        </div>
      </div>
    );
  }

  if (status === "not-found" || status === "error") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-8">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-3 tracking-tight">
            {status === "not-found" ? "Profile not found" : "Something went wrong"}
          </h1>
          <p className="text-gray-400 mb-8">
            {status === "not-found"
              ? `@${username} doesn't exist or hasn't made their profile public.`
              : "Please try again in a moment."}
          </p>
          <Link
            to="/"
            className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-full px-6 py-3 transition-all"
          >
            Go to Analytify
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <nav className="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-5 w-5 rounded bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.3)] group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold tracking-tight uppercase">Analytify</span>
        </Link>
        <Link
          to="/register"
          className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-orange-500 transition-colors border border-white/10 px-4 py-2 rounded-full hover:border-orange-500/50"
        >
          Get your own profile
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto p-8 lg:p-12 space-y-10">
        <div>
          <h1 className="text-4xl font-medium tracking-tight">
            @{profile.username}
          </h1>
          <p className="text-gray-400 mt-2 text-base">
            {profile.name}'s focus consistency, tracked with Analytify.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              Consistency Score
            </span>
            <span className="text-5xl font-black tracking-tight text-orange-500 my-4">
              {profile.consistencyScore}%
            </span>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              Current Streak
            </span>
            <span className="text-5xl font-black tracking-tight text-white my-4 flex items-center gap-2">
              <LocalFireDepartmentIcon className="text-orange-500" sx={{ fontSize: 42 }} />
              {profile.streak.currentStreak}
            </span>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">
              Longest Streak
            </span>
            <span className="text-5xl font-black tracking-tight text-gray-400 my-4 flex items-center gap-2">
              <EmojiEventsIcon sx={{ fontSize: 42 }} />
              {profile.streak.longestStreak}
            </span>
          </div>
        </div>

        <Heatmap
          data={profile.heatmap}
          title={`@${profile.username}'s Focus Heatmap`}
          subtitle="Completed focus sessions over the past 365 days."
        />
      </div>
    </div>
  );
};

export default PublicProfile;
