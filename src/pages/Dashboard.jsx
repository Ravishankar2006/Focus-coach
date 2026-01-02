import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import AppLayout from "../components/AppLayout";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useTheme } from "../utils/useTheme"; // make sure this hook exists

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Firestore: last 10 logs for this user
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "usageLogs"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(data);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // Derived metrics
  const lastSeven = logs.slice(0, 7).reverse();
  const avgScore =
    logs.length > 0
      ? Math.round(
          logs.reduce((sum, l) => sum + (l.disciplineScore || 0), 0) /
            logs.length
        )
      : 0;
  const avgScreen =
    logs.length > 0
      ? logs.reduce((sum, l) => sum + (l.screenTimeHours || 0), 0) / logs.length
      : 0;

  const chartData = lastSeven.map((log) => ({
    date: log.date || "N/A",
    screenTime: log.screenTimeHours || 0,
    goal: log.goalHours || 0,
    score: log.disciplineScore || 0,
  }));

  if (loading) {
    return (
      <div className="dashboard-shell">
        <div className="loader-shell">
          <div className="loader-spinner" />
          <div style={{ color: "var(--text-soft)", fontSize: "0.9rem" }}>
            Loading your focus analytics...
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="dashboard-shell">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-title-block">
            <h1>Focus Coach</h1>
            <p>Your digital discipline cockpit.</p>
          </div>

          <div className="dashboard-actions">
            <button
              className="btn-pill btn-accent"
              type="button"
              onClick={toggleTheme}
            >
              {theme === "light" ? "🌙 Dark mode" : "☀️ Light mode"}
            </button>
            <button
              className="btn-pill"
              type="button"
              onClick={() => navigate("/log-today")}
            >
              ➕ Log today
            </button>
            <button
              className="btn-pill btn-danger"
              type="button"
              onClick={handleLogout}
            >
              ⏏ Logout
            </button>
          </div>
        </header>

        {/* AI-like focus plan (static for now) */}
        <section className="ai-panel">
          <h3>🤖 Focus Coach Plan</h3>
          <p style={{ marginBottom: 6 }}>
            Based on your recent logs, here’s a suggested structure for today.
          </p>
          <div style={{ marginBottom: 6 }}>
            <strong>🎯 Focus Window:</strong> 9:00 AM – 12:00 PM, 7:30 PM – 9:30
            PM
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>⏸ Breaks:</strong> 10:30 AM (5 min walk), 8:30 PM (10 min
            stretch)
          </div>
          <div
            style={{
              fontStyle: "italic",
              fontSize: "0.9rem",
              background: "rgba(15,23,42,0.25)",
              padding: "8px 10px",
              borderRadius: 10,
              marginBottom: 4,
            }}
          >
            “You’re most consistent when screen time stays under 4.5h and sleep
            above 6.5h. Protect your focus windows like a meeting with your
            future self.”
          </div>
          <div className="ai-meta">AI narrative – live Gemini hook ready.</div>
        </section>

        {/* KPI cards */}
        <section className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Weekly discipline score</div>
            <div className="kpi-value">{avgScore ? `${avgScore}%` : "—"}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-soft)" }}>
              Higher = closer to your goals.
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">
              Avg screen time (last {logs.length} days)
            </div>
            <div className="kpi-value">
              {avgScreen ? `${avgScreen.toFixed(1)}h` : "—"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-soft)" }}>
              Target: under 4h on focus days.
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Logged streak</div>
            <div className="kpi-value">{logs.length} days</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-soft)" }}>
              Every log = more accurate patterns.
            </div>
          </div>
        </section>

        {/* Streak banner */}
        <section className="streak-banner">
          <div>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>
              🔥 Consistency meter
            </div>
            <div style={{ fontSize: "1rem" }}>
              You’ve logged {logs.length} day{logs.length !== 1 ? "s" : ""} of
              focus data.
            </div>
          </div>
          <div style={{ fontSize: "0.85rem" }}>
            Aim for a 7‑day streak. Tiny inputs → big behavior change.
          </div>
        </section>

        {/* Chart */}
        <section style={{ marginBottom: 22 }}>
          <h3 style={{ marginBottom: 8 }}>📈 Screen time vs goal</h3>
          <div
            style={{
              height: 320,
              borderRadius: 18,
              overflow: "hidden",
            }}
            className="card-soft"
          >
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.35)"
                />
                <XAxis dataKey="date" stroke="var(--text-soft)" />
                <YAxis stroke="var(--text-soft)" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="screenTime"
                  stroke="#fb7185"
                  name="Screen time (h)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="goal"
                  stroke="#22c55e"
                  name="Goal (h)"
                  strokeWidth={2.3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Logs table */}
        <section>
          <h3 style={{ marginBottom: 8 }}>📋 Recent logs</h3>
          {logs.length === 0 ? (
            <p style={{ color: "var(--text-soft)", fontSize: "0.9rem" }}>
              No logs yet. Start by{" "}
              <Link to="/log-today" style={{ textDecoration: "underline" }}>
                logging today&apos;s session
              </Link>
              .
            </p>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Screen</th>
                    <th>Goal</th>
                    <th>Sleep</th>
                    <th>Stress</th>
                    <th>Reasons</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.date}</td>
                      <td>{log.screenTimeHours}h</td>
                      <td>{log.goalHours}h</td>
                      <td>{log.sleepHours}h</td>
                      <td>{log.stressLevel}/5</td>
                      <td>
                        {log.scoreReasons?.slice(0, 2).join(", ") || "Balanced"}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          color:
                            log.disciplineScore >= 80
                              ? "var(--success)"
                              : log.disciplineScore >= 60
                              ? "var(--warning)"
                              : "var(--danger)",
                        }}
                      >
                        {log.disciplineScore}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
