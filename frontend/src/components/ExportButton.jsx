import React, { useState } from "react";
import DownloadIcon from "@mui/icons-material/Download";
import LockIcon from "@mui/icons-material/Lock";
import { fetchSessionsCsv } from "../api/exportApi";

/**
 * Triggers a CSV download of the user's full session history.
 * Premium-gated on the backend (requireTier) — a 403 here means the user
 * is on the free tier, shown as an inline upgrade prompt rather than a
 * generic error.
 */
const ExportButton = () => {
  const [status, setStatus] = useState("idle"); // idle | loading | locked | error

  const handleExport = async () => {
    setStatus("loading");
    try {
      const res = await fetchSessionsCsv();

      // TEACHING NOTE (for the JS side too): axios with responseType:"blob"
      // gives us raw file bytes, not JSON. To let the browser "download" it,
      // we create a temporary object URL pointing at the blob, attach it to
      // an invisible <a download> link, click it programmatically, then
      // revoke the URL so the browser can free the memory.
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `analytify-sessions-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setStatus("idle");
    } catch (err) {
      setStatus(err.response?.status === 403 ? "locked" : "error");
    }
  };

  if (status === "locked") {
    return (
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 border border-white/10 rounded-full px-4 py-2">
        <LockIcon sx={{ fontSize: 14 }} />
        CSV export is a premium feature
      </div>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={status === "loading"}
      className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-orange-500 border border-white/10 hover:border-orange-500/50 rounded-full px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <DownloadIcon sx={{ fontSize: 14 }} />
      {status === "loading" ? "Exporting..." : "Export CSV"}
      {status === "error" && <span className="text-red-400 normal-case font-normal">— failed, try again</span>}
    </button>
  );
};

export default ExportButton;
