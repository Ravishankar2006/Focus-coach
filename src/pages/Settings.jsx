import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import AppLayout from "../components/AppLayout";
import { useTheme } from "../utils/useTheme";

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [userData, setUserData] = useState({ logs: 0, sessions: 0 });

  // Load user data summary
  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Count logs
      const logsQuery = query(
        collection(db, "usageLogs"),
        where("userId", "==", user.uid)
      );
      const logsSnap = await getDocs(logsQuery);

      const sessionsQuery = query(
        collection(db, "focusSessions"),
        where("userId", "==", user.uid)
      );
      const sessionsSnap = await getDocs(sessionsQuery);

      setUserData({
        logs: logsSnap.size,
        sessions: sessionsSnap.size,
      });
    };

    loadData();
  }, []);

  const exportData = async () => {
    setExporting(true);
    try {
      const user = auth.currentUser;

      // Fetch logs for export
      const logsQuery = query(
        collection(db, "usageLogs"),
        where("userId", "==", user.uid)
      );
      const logsSnap = await getDocs(logsQuery);
      const logs = logsSnap.docs.map((doc) => doc.data());

      const csv = [
        "Date,Screen Time,Goal,Sleep,Stress,Score",
        ...logs.map(
          (l) =>
            `"${l.date || ""}",${l.screenTimeHours || 0},${l.goalHours || 0},${
              l.sleepHours || 0
            },${l.stressLevel || 0},${l.disciplineScore || 0}`
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `focus-coach-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Export failed: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  const clearAllData = async () => {
    if (
      !window.confirm(
        "Delete ALL your logs and sessions? This cannot be undone."
      )
    )
      return;

    setClearing(true);
    try {
      const user = auth.currentUser;

      // Delete logs (batch in production)
      const logsQuery = query(
        collection(db, "usageLogs"),
        where("userId", "==", user.uid)
      );
      const logsSnap = await getDocs(logsQuery);
      logsSnap.forEach((doc) => doc.ref.delete());

      const sessionsQuery = query(
        collection(db, "focusSessions"),
        where("userId", "==", user.uid)
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      sessionsSnap.forEach((doc) => doc.ref.delete());

      alert("🗑️ All data cleared. Start fresh!");
      window.location.reload();
    } catch (error) {
      alert("Clear failed: " + error.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <AppLayout>
      <div className="dashboard-shell">
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>⚙️ Settings</h1>
          <p style={{ color: "var(--text-soft)", marginBottom: 32 }}>
            Manage your account, data, and preferences.
          </p>

          {/* Data Summary */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>📊 Your Data</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 16,
                fontSize: "0.9rem",
              }}
            >
              <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 600 }}>
                  {userData.logs}
                </div>
                <div style={{ color: "var(--text-soft)" }}>Daily logs</div>
              </div>
              <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 600 }}>
                  {userData.sessions}
                </div>
                <div style={{ color: "var(--text-soft)" }}>Focus sessions</div>
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>🎨 Appearance</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span>Theme:</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => toggleTheme()} // ← Uses your global hook
                  className={`theme-btn ${theme === "light" ? "active" : ""}`}
                >
                  ☀️ Light
                </button>
                <button
                  onClick={() => toggleTheme()} // ← Uses your global hook
                  className={`theme-btn ${theme === "dark" ? "active" : ""}`}
                >
                  🌙 Dark
                </button>
              </div>
            </div>
          </div>

          {/* Export Data */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12 }}>📥 Export Data</h3>
            <p style={{ color: "var(--text-soft)", marginBottom: 16 }}>
              Download your logs and sessions as CSV for backup or analysis.
            </p>
            <button
              onClick={exportData}
              disabled={exporting}
              className="auth-btn"
              style={{ width: "100%" }}
            >
              {exporting ? "Exporting..." : "📥 Download CSV"}
            </button>
          </div>

          {/* Danger Zone */}
          <div
            className="card"
            style={{
              borderColor: "var(--danger)",
              background: "rgba(239,68,68,0.05)",
            }}
          >
            <h3 style={{ marginBottom: 12, color: "var(--danger)" }}>
              🗑️ Danger Zone
            </h3>
            <p style={{ color: "var(--text-soft)", marginBottom: 16 }}>
              Permanently delete all your data. Cannot be undone.
            </p>
            <button
              onClick={clearAllData}
              disabled={clearing}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--danger)",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontWeight: 600,
                cursor: clearing ? "not-allowed" : "pointer",
              }}
            >
              {clearing ? "Deleting..." : "Delete All Data"}
            </button>
          </div>

          <div
            style={{
              marginTop: 40,
              padding: 20,
              textAlign: "center",
              background: "var(--bg-elevated)",
              borderRadius: 16,
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h4>Need help?</h4>
            <p style={{ color: "var(--text-soft)" }}>
              Focus Coach is open source. Questions? Check the GitHub repo.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
