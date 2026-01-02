import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">
            Track your focus, reclaim your time.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-btn" 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {error && <div className="auth-error">{error}</div>}
        </form>

        <div className="auth-footer">
          New to Focus Coach? <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
