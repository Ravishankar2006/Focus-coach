import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already registered. Try logging in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password too weak. Use at least 6 characters.');
      } else {
        setError('Registration failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 className="auth-title">Join Focus Coach</h2>
          <p className="auth-subtitle">
            Start tracking your digital discipline today.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleRegister}>
          <div>
            <label>Email address</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label>Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              minLength={6}
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-btn" 
            disabled={loading || password.length < 6}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          {error && <div className="auth-error">{error}</div>}
        </form>

        <div className="auth-footer">
          Have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
