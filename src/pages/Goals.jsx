import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import AppLayout from "../components/AppLayout";

const Goals = () => {
  const [weeklyGoal, setWeeklyGoal] = useState(28); // default 4h/day
  const [weekStart, setWeekStart] = useState("");
  const [weekUsage, setWeekUsage] = useState(0);
  const [weekSessions, setWeekSessions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load goals + week data
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Load user goals
    const goalDoc = doc(db, "userGoals", user.uid);
    const unsubscribeGoals = onSnapshot(goalDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWeeklyGoal(data.weeklyScreenGoal || 28);
      }
    });

    // Load this week's data
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStartDate = weekAgo.toISOString().split("T")[0];

    const q = query(
      collection(db, "usageLogs"),
      where("userId", "==", user.uid),
      where("date", ">=", weekStartDate)
    );

    const unsubscribeLogs = onSnapshot(q, (snapshot) => {
      const usage = snapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().screenTimeHours || 0),
        0
      );
      setWeekUsage(usage);
      setWeekSessions(snapshot.docs.length);
      setWeekStart(weekStartDate);
      setLoading(false);
    });

    return () => {
      unsubscribeGoals();
      unsubscribeLogs();
    };
  }, []);

  const saveGoal = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser; // ← Move INSIDE try
      await updateDoc(doc(db, "userGoals", user.uid), {
        weeklyScreenGoal: parseInt(weeklyGoal),
        updatedAt: new Date(),
      });
      alert(`✅ Goal saved: ${weeklyGoal}h/week`);
    } catch (error) {
      const user = auth.currentUser; // ← Add here too
      await addDoc(collection(db, "userGoals"), {
        userId: user.uid,
        weeklyScreenGoal: parseInt(weeklyGoal),
        updatedAt: new Date(),
      });
      alert(`✅ Goal set: ${weeklyGoal}h/week`);
    } finally {
      setSaving(false);
    }
  };

  const progressPercent =
    weekUsage > 0 ? Math.min((weekUsage / weeklyGoal) * 100, 100) : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="dashboard-shell">
          <div className="loader-shell">
            <div className="loader-spinner" />
            <div>Loading goals...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="dashboard-shell">
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          {/* Goal Setter */}
          <div className="card" style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 12 }}>🎯 Weekly Screen Time Goal</h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <label style={{ fontSize: "1.1rem", minWidth: 140 }}>
                Set target:
              </label>
              <input
                type="range"
                min="7"
                max="56"
                step="7"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(e.target.value)}
                style={{ flex: 1, height: 8 }}
              />
              <span
                style={{ fontSize: "1.2rem", fontWeight: 600, minWidth: 50 }}
              >
                {weeklyGoal}h
              </span>
              <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                ({Math.round(weeklyGoal / 7)}h/day)
              </span>
            </div>
            <button
              onClick={saveGoal}
              disabled={saving}
              className="auth-btn"
              style={{ width: "100%" }}
            >
              {saving ? "Saving..." : "Save Goal"}
            </button>
          </div>

          {/* Progress */}
          <div className="card" style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 16 }}>
              📊 This Week: {weekStart} to today
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 20,
                marginBottom: 24,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-soft)",
                    marginBottom: 4,
                  }}
                >
                  Screen time used
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 600 }}>
                  {weekUsage.toFixed(1)}h
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-soft)",
                    marginBottom: 4,
                  }}
                >
                  Days logged
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 600 }}>
                  {weekSessions}/7
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-soft)",
                    marginBottom: 4,
                  }}
                >
                  Progress
                </div>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 600,
                    color:
                      progressPercent > 90 ? "var(--danger)" : "var(--accent)",
                  }}
                >
                  {progressPercent.toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 12,
                background: "var(--bg-soft)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(progressPercent, 100)}%`,
                  background:
                    progressPercent > 90
                      ? "var(--danger)"
                      : progressPercent > 70
                      ? "var(--warning)"
                      : "var(--success)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: "0.85rem",
                opacity: 0.8,
                textAlign: "center",
              }}
            >
              {weekUsage < weeklyGoal * 0.8 && "🎉 On track!"}
              {weekUsage > weeklyGoal * 1.1 &&
                "⚠️ Over target—review patterns."}
              {weekSessions < 4 && "💡 Log more days for better insights."}
            </div>
          </div>

          {/* Quick tips */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>💡 Tips for this week</h3>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
              <li>🛌 Aim for 6.5+ hours sleep</li>
              <li>📱 Keep social media under 1h</li>
              <li>🎯 Use Focus Timer for deep work</li>
              <li>📊 Log daily for accurate insights</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Goals;
