import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  checkInGrowthArea,
  createGrowthArea,
  deleteGrowthArea,
  fetchTodaysGrowth,
} from "../api/growthApi";
import { CARD } from "./ui";

/**
 * "Did I actually grow today" — a daily checklist of user-defined life
 * areas (Finance, DSA, Reading...), separate from the Pomodoro/streak
 * metrics above it. Answers the identity-level question directly instead
 * of making the user infer it from session counts.
 */
const TodaysGrowthCard = () => {
  const [growth, setGrowth] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState(null);

  const load = () => {
    fetchTodaysGrowth()
      .then((res) => setGrowth(res.data))
      .catch(() => setGrowth({ areas: [], completedCount: 0, totalCount: 0 }));
  };

  useEffect(load, []);

  const toggle = async (area) => {
    // Optimistic update — this is a habit checklist, not a form; it should
    // feel instant.
    setGrowth((prev) => ({
      ...prev,
      areas: prev.areas.map((a) => (a.id === area.id ? { ...a, doneToday: !a.doneToday } : a)),
      completedCount: prev.completedCount + (area.doneToday ? -1 : 1),
    }));
    try {
      await checkInGrowthArea(area.id, { done: !area.doneToday });
      load(); // re-sync streak, which optimistic update can't compute correctly
    } catch {
      load(); // rollback to server truth on failure
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      await createGrowthArea(newName.trim());
      setNewName("");
      setAdding(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't add that area");
    }
  };

  const handleRemove = async (id) => {
    await deleteGrowthArea(id);
    load();
  };

  if (!growth) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${CARD} p-6`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-instrument text-xl italic tracking-tight text-cream">Today's growth</h2>
          {growth.totalCount > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {growth.completedCount} of {growth.totalCount} done today
            </p>
          )}
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-gray-400 transition-colors hover:border-cream/40 hover:text-cream"
        >
          <AddRoundedIcon sx={{ fontSize: 18 }} />
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="mt-4 flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Finance, DSA, Reading"
            className="font-almarai w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-cream outline-none focus:border-cream/40"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-cream px-4 py-2 font-almarai text-xs font-medium text-black"
          >
            Add
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-5 space-y-2">
        {growth.areas.length === 0 && !adding ? (
          <p className="rounded-[5px] border border-dashed border-white/10 p-5 text-center text-sm text-gray-500">
            Add a life area (Finance, Coding, Reading...) to start your daily growth check-in.
          </p>
        ) : (
          growth.areas.map((area) => (
            <div
              key={area.id}
              className="group flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 transition-colors hover:border-white/20"
            >
              <button onClick={() => toggle(area)} className="flex min-w-0 items-center gap-3 text-left">
                {area.doneToday ? (
                  <CheckCircleRoundedIcon sx={{ fontSize: 20 }} className="shrink-0 text-cream" />
                ) : (
                  <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 20 }} className="shrink-0 text-gray-600" />
                )}
                <span className={`truncate text-sm ${area.doneToday ? "text-cream" : "text-gray-400"}`}>
                  {area.name}
                </span>
              </button>
              <div className="flex shrink-0 items-center gap-3">
                {area.streak > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <LocalFireDepartmentRoundedIcon sx={{ fontSize: 14 }} className="text-orange-400" />
                    {area.streak}
                  </span>
                )}
                <button
                  onClick={() => handleRemove(area.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <CloseRoundedIcon sx={{ fontSize: 15 }} className="text-gray-600 hover:text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default TodaysGrowthCard;
