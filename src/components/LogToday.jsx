import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import toast, { Toaster } from 'react-hot-toast';  // ✅ Added

const LogToday = () => {
  const [formData, setFormData] = useState({
    screenTimeHours: "",
    goalHours: "",
    sleepHours: "",
    stressLevel: 3,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      const screenTime = parseFloat(formData.screenTimeHours);
      const goalHours = parseFloat(formData.goalHours);
      const sleep = parseFloat(formData.sleepHours);
      const stress = parseInt(formData.stressLevel);

      // 🔧 IMPROVED SCORING SYSTEM (0-100)
      let score = 100;

      // Screen time vs goal (40% weight)
      if (screenTime <= goalHours * 0.8) score += 10;
      else if (screenTime <= goalHours) score += 5;
      else if (screenTime <= goalHours * 1.5) score -= 15;
      else score -= 35;

      // Sleep quality (25% weight)
      if (sleep >= 7.5) score += 12;
      else if (sleep >= 6.5) score += 5;
      else if (sleep >= 5.5) score -= 8;
      else score -= 25;

      // Stress impact (20% weight)
      if (stress <= 2) score += 8;
      else if (stress <= 3) score += 2;
      else score -= 12;

      // Consistency bonus (15% weight)
      if (Math.abs(screenTime - goalHours) <= 1) score += 8;
      else if (Math.abs(screenTime - goalHours) <= 2) score += 4;

      // Clamp between 0-100
      score = Math.max(0, Math.min(100, score));

      // Score explanation
      const reasons = [];
      if (screenTime > goalHours * 1.5) reasons.push("High screen time");
      if (sleep < 6) reasons.push("Low sleep");
      if (stress > 3) reasons.push("High stress");
      if (screenTime <= goalHours * 0.8) reasons.push("Great focus");
      if (sleep >= 7.5) reasons.push("Excellent sleep");

      await addDoc(collection(db, "usageLogs"), {
        userId: user.uid,
        screenTimeHours: screenTime,
        goalHours: goalHours,
        sleepHours: sleep,
        stressLevel: stress,
        disciplineScore: Math.round(score),
        scoreReasons: reasons,
        date: new Date().toISOString().split("T")[0],
        createdAt: serverTimestamp(),
      });

      // ✅ TOAST SUCCESS (replaces alert)
      toast.success(
        `✅ Data saved! Score: ${Math.round(score)}% (${reasons.join(", ") || "Balanced day"})`,
        {
          duration: 5000,
          position: "top-right",
          style: {
            background: "linear-gradient(45deg, #10b981, #059669)",
            color: "white",
            fontWeight: 600
          }
        }
      );
      
      setTimeout(() => navigate("/dashboard"), 2000);
      
    } catch (error) {
      // ✅ TOAST ERROR (replaces alert)
      toast.error(`Error: ${error.message}`, {
        duration: 4000,
        position: "top-right",
        style: {
          background: "linear-gradient(45deg, #ef4444, #dc2626)",
          color: "white"
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          maxWidth: "500px",
          margin: "50px auto",
          padding: "30px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#ffffffff" }}>
          📱 Log Today's Data
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ margin: "15px 0" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>
              Screen Time (hours):
            </label>
            <input
              type="number"
              name="screenTimeHours"
              value={formData.screenTimeHours}
              onChange={handleChange}
              step="0.5"
              min="0"
              max="24"
              required
              style={{ 
                width: "100%", 
                padding: "12px", 
                marginTop: "5px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px"
              }}
            />
          </div>

          <div style={{ margin: "15px 0" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>
              Goal Hours:
            </label>
            <input
              type="number"
              name="goalHours"
              value={formData.goalHours}
              onChange={handleChange}
              step="0.5"
              min="0"
              required
              style={{ 
                width: "100%", 
                padding: "12px", 
                marginTop: "5px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px"
              }}
            />
          </div>

          <div style={{ margin: "15px 0" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>
              Sleep Hours:
            </label>
            <input
              type="number"
              name="sleepHours"
              value={formData.sleepHours}
              onChange={handleChange}
              step="0.5"
              min="0"
              max="12"
              required
              style={{ 
                width: "100%", 
                padding: "12px", 
                marginTop: "5px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px"
              }}
            />
          </div>

          <div style={{ margin: "20px 0" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Stress Level:
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <input
                type="range"
                name="stressLevel"
                min="1"
                max="5"
                value={formData.stressLevel}
                onChange={handleChange}
                style={{ flex: 1, height: "6px", borderRadius: "3px" }}
              />
              <span style={{ fontSize: "18px", fontWeight: 600, minWidth: "30px" }}>
                {formData.stressLevel}/5
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              background: "linear-gradient(45deg, #4285f4, #3367d6)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 4px 15px rgba(66,133,244,0.4)"
            }}
          >
            {loading ? "💾 Saving..." : "💾 Save Data"}
          </button>
        </form>
      </div>
      
      {/* ✅ Built-in Toaster */}
      <Toaster />
    </>
  );
};

export default LogToday;
