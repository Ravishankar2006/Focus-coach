import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import AppLayout from '../components/AppLayout';

const FocusTimer = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState('focus'); // 'focus' or 'break'
  const [completedSessions, setCompletedSessions] = useState(0);
  const intervalRef = useRef(null);
  const sessionStartRef = useRef(Date.now());

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      } else if (minutes > 0) {
        setMinutes(minutes - 1);
        setSeconds(59);
      } else {
        // Session complete!
        handleSessionComplete();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [minutes, seconds, isRunning]);

  const handleSessionComplete = async () => {
    setIsRunning(false);
    
    // Auto-log to Firestore
    const sessionDuration = Math.round((Date.now() - sessionStartRef.current) / 1000 / 60);
    
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'focusSessions'), {
        userId: user.uid,
        type: sessionType,
        durationMinutes: sessionDuration,
        completedAt: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      });
      
      alert(
        `✅ ${sessionType === 'focus' ? 'Focus' : 'Break'} session complete! 
        Logged ${sessionDuration} minutes.`
      );
    } catch (error) {
      console.error('Log failed:', error);
    }

    // Switch mode
    setSessionType(sessionType === 'focus' ? 'break' : 'focus');
    setMinutes(sessionType === 'focus' ? 5 : 25);
    setSeconds(0);
    setCompletedSessions(prev => prev + 1);
  };

  const startPause = () => {
    if (!isRunning) {
      sessionStartRef.current = Date.now();
    }
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setIsRunning(false);
    setMinutes(25);
    setSeconds(0);
  };

  const formatTime = (time) => time.toString().padStart(2, '0');

  return (
    <AppLayout>
      <div className="dashboard-shell">
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 8 }}>
              {sessionType === 'focus' ? '🧠 Focus' : '☕ Break'}
            </h1>
            <div style={{ 
              fontSize: '4rem', 
              fontWeight: '300', 
              fontFamily: 'monospace',
              marginBottom: 30,
              letterSpacing: '0.1em'
            }}>
              {formatTime(minutes)}:{formatTime(seconds)}
            </div>
            <div style={{ fontSize: '1.1rem', opacity: 0.8 }}>
              Session {completedSessions + 1} • {isRunning ? 'Running...' : 'Ready'}
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: 12, 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={startPause}
              style={{
                padding: '14px 28px',
                fontSize: '1.1rem',
                borderRadius: 50,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                minWidth: 120,
                background: isRunning 
                  ? 'var(--danger)' 
                  : 'var(--accent-grad)',
                color: 'white',
                boxShadow: '0 8px 25px rgba(99,102,241,0.4)'
              }}
            >
              {isRunning ? '⏸️ Pause' : '▶️ Start'}
            </button>

            <button
              onClick={reset}
              style={{
                padding: '14px 28px',
                fontSize: '1.1rem',
                borderRadius: 50,
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                color: 'var(--text-color)',
                cursor: 'pointer',
                minWidth: 120
              }}
              disabled={isRunning}
            >
              🔄 Reset
            </button>
          </div>

          <div style={{ 
            marginTop: 40, 
            textAlign: 'center', 
            padding: '20px',
            background: 'var(--bg-elevated)',
            borderRadius: 16,
            border: '1px solid var(--border-subtle)'
          }}>
            <h3 style={{ marginBottom: 12 }}>How it works</h3>
            <ul style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto' }}>
              <li>25 min focus → 5 min break (Pomodoro)</li>
              <li>Sessions auto-save to your dashboard</li>
              <li>Track total focus time this week</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default FocusTimer;
