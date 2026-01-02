import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

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
      if (screenTime <= goalHours * 0.8) score += 10; // Great focus
      else if (screenTime <= goalHours) score += 5; // On target
      else if (screenTime <= goalHours * 1.5) score -= 15; // Slightly over
      else score -= 35; // Heavy distraction

      // Sleep quality (25% weight)
      if (sleep >= 7.5) score += 12; // Excellent
      else if (sleep >= 6.5) score += 5; // Good
      else if (sleep >= 5.5) score -= 8; // OK
      else score -= 25; // Poor sleep

      // Stress impact (20% weight)
      if (stress <= 2) score += 8; // Very low stress
      else if (stress <= 3) score += 2; // Manageable
      else score -= 12; // High stress

      // Consistency bonus (15% weight)
      if (Math.abs(screenTime - goalHours) <= 1) score += 8; // Very consistent
      else if (Math.abs(screenTime - goalHours) <= 2) score += 4; // Consistent

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

      alert(
        `✅ Data saved! Score: ${Math.round(score)}% (${
          reasons.join(", ") || "Balanced day"
        })`
      );
      navigate("/dashboard");
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "50px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "10px",
      }}
    >
      <h2>📱 Log Today's Data</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ margin: "15px 0" }}>
          <label>Screen Time (hours):</label>
          <input
            type="number"
            name="screenTimeHours"
            value={formData.screenTimeHours}
            onChange={handleChange}
            step="0.5"
            min="0"
            max="24"
            required
            style={{ width: "100%", padding: "10px", marginTop: "5px" }}
          />
        </div>

        <div style={{ margin: "15px 0" }}>
          <label>Goal Hours:</label>
          <input
            type="number"
            name="goalHours"
            value={formData.goalHours}
            onChange={handleChange}
            step="0.5"
            min="0"
            required
            style={{ width: "100%", padding: "10px", marginTop: "5px" }}
          />
        </div>

        <div style={{ margin: "15px 0" }}>
          <label>Sleep Hours:</label>
          <input
            type="number"
            name="sleepHours"
            value={formData.sleepHours}
            onChange={handleChange}
            step="0.5"
            min="0"
            max="12"
            required
            style={{ width: "100%", padding: "10px", marginTop: "5px" }}
          />
        </div>

        <div style={{ margin: "15px 0" }}>
          <label>Stress Level:</label>
          <input
            type="range"
            name="stressLevel"
            min="1"
            max="5"
            value={formData.stressLevel}
            onChange={handleChange}
          />
          <span style={{ marginLeft: "10px" }}> {formData.stressLevel}/5 </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "#4285f4",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
          }}
        >
          {loading ? "Saving..." : "💾 Save Data"}
        </button>
      </form>
    </div>
  );
};

export default LogToday;
