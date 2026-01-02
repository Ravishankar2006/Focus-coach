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
import { useTheme } from '../utils/useTheme';
import toast from 'react-hot-toast';  // ✅ Added
import { useNavigate } from 'react-router-dom';  // ✅ Added
import { signOut } from 'firebase/auth';
const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [userData, setUserData] = useState({ logs: 0, sessions: 0 });
  const navigate = useNavigate();  // ✅ Added

  // Load user data summary (your code unchanged)
  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (!user) return;

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

  // ✅ NEW: Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('👋 Logged out successfully!', {
        duration: 4000,
        style: { background: 'linear-gradient(45deg, #10b981, #059669)' }
      });
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed: ' + error.message);
    }
  };

  // Your existing functions (exportData, clearAllData) - update alerts to toast:
  const exportData = async () => {
    setExporting(true);
    try {
      const user = auth.currentUser;
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
      
      toast.success('📥 Data exported!');  // ✅ Toast
    } catch (error) {
      toast.error("Export failed: " + error.message);  // ✅ Toast
    } finally {
      setExporting(false);
    }
  };

  const clearAllData = async () => {
    if (!window.confirm("Delete ALL your logs and sessions? This cannot be undone.")) return;

    setClearing(true);
    try {
      const user = auth.currentUser;
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

      toast.success('🗑️ All data cleared. Page refreshing...');  // ✅ Toast
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error("Clear failed: " + error.message);  // ✅ Toast
    } finally {
      setClearing(false);
    }
  };

  // Your JSX (add logout section):
  return (
    <AppLayout>
      <div className="dashboard-shell">
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>⚙️ Settings</h1>
          <p style={{ color: "var(--text-soft)", marginBottom: 32 }}>
            Manage your account, data, and preferences.
          </p>

          {/* ✅ NEW: Account Section with Logout */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>👤 Account</h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-soft)' }}>
                Logged in as: {auth.currentUser?.email || 'Unknown'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, var(--danger), #dc2626)",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(239,68,68,0.4)"
              }}
            >
              🚪 Logout
            </button>
          </div>

          {/* Your existing sections unchanged */}
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

          {/* Rest of your JSX unchanged (Theme, Export, Danger Zone, Help) */}
          {/* ... paste your existing theme/export/clear sections here ... */}
          
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
