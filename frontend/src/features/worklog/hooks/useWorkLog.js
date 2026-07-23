import { useCallback, useEffect, useState } from "react";
import {
  deleteEntry as deleteEntryRequest,
  generateWorkReport as generateWorkReportRequest,
  getWorkLog,
  logWork as logWorkRequest,
  updateEntry as updateEntryRequest,
} from "../api/worklogApi";

const today = new Date().toISOString().split("T")[0];
const monthAgo = (() => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 30);
  return date.toISOString().split("T")[0];
})();

export const useWorkLog = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [range, setRange] = useState({ from: monthAgo, to: today });

  const reload = useCallback(async (customRange = range) => {
    setLoading(true);
    try {
      const res = await getWorkLog(customRange.from, customRange.to);
      setEntries(res.data);
      setRange(customRange);
    } catch (err) {
      console.error("Failed to load work log", err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addEntry = useCallback(async (payload) => {
    const res = await logWorkRequest(payload);
    setEntries((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const editEntry = useCallback(async (id, payload) => {
    const res = await updateEntryRequest(id, payload);
    setEntries((prev) => prev.map((entry) => (entry.id === id ? res.data : entry)));
    return res.data;
  }, []);

  const removeEntry = useCallback(async (id) => {
    await deleteEntryRequest(id);
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const generateReport = useCallback(async (customRange = range) => {
    setReportLoading(true);
    try {
      const res = await generateWorkReportRequest(customRange.from, customRange.to);
      setReport(res.data);
      return res.data;
    } finally {
      setReportLoading(false);
    }
  }, [range]);

  return {
    entries,
    loading,
    range,
    setRange,
    report,
    reportLoading,
    reload,
    addEntry,
    editEntry,
    removeEntry,
    generateReport,
  };
};
