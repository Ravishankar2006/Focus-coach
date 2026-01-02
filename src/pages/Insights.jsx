import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import AppLayout from '../components/AppLayout';

const Insights = () => {
  const [logs, setLogs] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Get last 30 days of data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const q = query(
      collection(db, 'usageLogs'),
      where('userId', '==', user.uid),
      where('date', '>=', thirtyDaysAgo)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      setLogs(data);
      setLoading(false);
      generateInsights(data);
    });

    return () => unsubscribe();
  }, []);

  const generateInsights = (data) => {
    if (data.length === 0) return;

    const avgScreen = data.reduce((sum, l) => sum + l.screenTimeHours, 0) / data.length;
    const avgSleep = data.reduce((sum, l) => sum + l.sleepHours, 0) / data.length;
    const avgScore = data.reduce((sum, l) => sum + l.disciplineScore, 0) / data.length;

    const insightsList = [];

    // Screen time patterns
    if (avgScreen > 6) {
      insightsList.push({
        type: 'warning',
        title: 'High Screen Time Detected',
        message: `Your average is ${avgScreen.toFixed(1)}h/day. Consider a "no phone" hour before bed.`,
        icon: '📱'
      });
    } else if (avgScreen < 4) {
      insightsList.push({
        type: 'success',
        title: 'Excellent Screen Discipline',
        message: `Only ${avgScreen.toFixed(1)}h/day. You're in the top 10% of focus users!`,
        icon: '🏆'
      });
    }

    // Sleep correlation
    if (avgSleep < 6.5) {
      insightsList.push({
        type: 'warning',
        title: 'Sleep is Your Focus Foundation',
        message: `Average ${avgSleep.toFixed(1)}h. Prioritize 30min earlier bedtime for +15% focus score.`,
        icon: '😴'
      });
    }

    // Score trends
    const recentScore = data.slice(0, 7).reduce((sum, l) => sum + l.disciplineScore, 0) / 7;
    const trend = recentScore > avgScore ? 'improving' : 'stable';
    
    insightsList.push({
      type: trend === 'improving' ? 'success' : 'neutral',
      title: `${trend === 'improving' ? '🚀 Momentum Building' : '📊 Stable Baseline'}`,
      message: `Recent 7-day avg: ${recentScore.toFixed(0)}% ${trend === 'improving' ? '(uptrend!)' : ''}`,
      icon: trend === 'improving' ? '📈' : '📊'
    });

    // Consistency
    const loggedDays = data.length;
    if (loggedDays >= 14) {
      insightsList.push({
        type: 'success',
        title: 'Consistency Champion',
        message: `Logged ${loggedDays} days. Your patterns are reliable for accurate predictions.`,
        icon: '🔥'
      });
    }

    setInsights(insightsList.slice(0, 4)); // Top 4 insights
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="dashboard-shell">
          <div className="loader-shell">
            <div className="loader-spinner" />
            <div>Analyzing patterns...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="dashboard-shell">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>💡 Smart Insights</h1>
            <p style={{ color: 'var(--text-soft)', maxWidth: 500, margin: '0 auto' }}>
              Patterns from your last {logs.length} logged days. Actionable tips to level up.
            </p>
          </div>

          {logs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <h3>No data yet</h3>
              <p style={{ color: 'var(--text-soft)' }}>
                Log a few days of screen time, sleep, and stress to unlock insights.
              </p>
              <a href="/log-today" className="auth-btn" style={{ display: 'inline-block' }}>
                Start logging
              </a>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className="card"
                  style={{
                    padding: 24,
                    borderLeft: `4px solid ${
                      insight.type === 'success' 
                        ? 'var(--success)' 
                        : insight.type === 'warning' 
                        ? 'var(--danger)' 
                        : 'var(--accent)'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: '1.5rem' }}>{insight.icon}</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{insight.title}</h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>
                        {insight.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Data summary */}
          <div className="card" style={{ marginTop: 28 }}>
            <h3 style={{ marginBottom: 16 }}>📊 Data Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>{logs.length}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>days logged</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>
                  {Math.round(logs.reduce((a,b)=>a+b.disciplineScore,0)/logs.length || 0)}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>avg score</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Insights;
