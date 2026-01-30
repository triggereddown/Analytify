import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchDailyStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get("/pomodoro/stats");
      setStats(res.data);
    } catch (error) {
      console.error("Error fetching stats", error);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const res = await API.get("/pomodoro/dailystats");
      setDailyStats(res.data);
    } catch (error) {
      console.error("Error fetching daily stats", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!stats || !dailyStats.length) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a] text-gray-500">
        <div className="animate-pulse tracking-widest uppercase text-xs font-medium">
          Synchronizing Data...
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Completed", value: stats.completed },
    { name: "Abandoned", value: stats.abandoned },
  ];

  const COLORS = ["#f97316", "#262626"];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white  antialiased">
      <nav className="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-5 w-5 rounded bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.3)] group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold tracking-tight uppercase">
            Analytify
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-orange-500 transition-colors border border-white/10 px-4 py-2 rounded-full hover:border-orange-500/50"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4">
          <div>
            <h1 className="text-4xl font-medium tracking-tight">Performance</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Deep work analytics for the current period.
            </p>
          </div>
          <div className="flex gap-12 border-l border-white/5 pl-8">
            <div className="flex flex-col text-center">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">
                Sessions
              </span>
              <span className="text-3xl font-light tracking-tighter">
                {stats.totalSessions}
              </span>
            </div>
            <div className="flex flex-col text-center">
              <span className="text-[10px] uppercase tracking-[0.2em] text-orange-500 font-bold mb-1">
                Completed
              </span>
              <span className="text-3xl font-light tracking-tighter text-orange-500">
                {stats.completed}
              </span>
            </div>
            <div className="flex flex-col text-center">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">
                Abandoned
              </span>
              <span className="text-3xl font-light tracking-tighter text-gray-500">
                {stats.abandoned}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* DAILY BAR GRAPH */}
          <div className="col-span-12 lg:col-span-8 bg-[#111] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="mb-10">
              <h3 className="text-lg font-medium text-gray-200">
                Activity Trends
              </h3>
              <p className="text-xs text-gray-500">
                Daily distribution of session volume and focus duration.
              </p>
            </div>

            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyStats}
                  margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#ffffff05"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#666", fontSize: 12, fontWeight: 600 }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#666", fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#ffffff03" }}
                    contentStyle={{
                      backgroundColor: "#161616",
                      border: "1px solid rgba(249, 115, 22, 0.2)",
                      borderRadius: "12px",
                      padding: "12px",
                    }}
                    labelStyle={{
                      color: "#f97316",
                      fontWeight: "bold",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                    itemStyle={{
                      fontSize: "13px",
                      fontWeight: "bold",
                      padding: "2px 0",
                    }}
                  />
                  <Bar
                    dataKey="sessions"
                    name="Sessions"
                    fill="#ea580c"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar
                    dataKey="focusTime"
                    name="Minutes"
                    fill="#333"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* COMPLETION PIE CHART */}
          <div className="col-span-12 lg:col-span-4 bg-[#111] w-[410px] border border-white/5 rounded-[2.5rem] p-4 flex flex-col items-center justify-center shadow-2xl relative">
            <div className="text-center w-full mb-4">
              <h3 className="text-lg font-medium text-gray-200">Efficiency</h3>
              <p className="text-xs text-gray-500 mt-1">
                Success vs. Drop-off ratio
              </p>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                    // Static labels replace the hover popup
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{ outline: "none" }}
                      />
                    ))}
                  </Pie>
                  {/* Tooltip disabled to prevent the black popup */}
                  <Tooltip active={false} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-6">
                <span className="block text-3xl font-bold tracking-tighter text-white">
                  {Math.round(
                    (stats.completed / (stats.totalSessions || 1)) * 100,
                  )}
                  %
                </span>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                  Success Rate
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full mt-8 pt-8 border-t border-white/5">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
                    {entry.name}
                  </span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: index === 0 ? "#f97316" : "#fff" }}
                  >
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
