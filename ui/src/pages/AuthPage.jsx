import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiLogin, apiSignup, setToken } from '../api';
import './AuthPage.css';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const data = await apiLogin(email, password);
        setToken(data.access_token);
        navigate('/dashboard');
      } else {
        await apiSignup(email, password);
        setSuccess('Account created! You can now log in.');
        setTab('login');
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="auth-wrapper animate-fade-up" style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo mark */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <path d="M8 13h8M8 17h5"/>
            </svg>
          </div>
          <span className="auth-logo-text">DocMind</span>
        </div>

        <div className="card auth-card">
          <div className="auth-header">
            <h1>{tab === 'login' ? 'Welcome back' : 'Create account'}</h1>
            <p>{tab === 'login' ? 'Sign in to your workspace' : 'Start chatting with your documents'}</p>
          </div>

          {/* Tabs */}
          <div className="tabs" role="tablist">
            <button
              id="tab-login"
              role="tab"
              aria-selected={tab === 'login'}
              className={`tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
            >
              Log in
            </button>
            <button
              id="tab-signup"
              role="tab"
              aria-selected={tab === 'signup'}
              className={`tab ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => { setTab('signup'); setError(''); setSuccess(''); }}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {success && <div className="success-msg">{success}</div>}
            {error   && <div className="error-msg"><span>⚠</span>{error}</div>}

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder={tab === 'signup' ? 'Choose a strong password' : 'Enter your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <button
              id="auth-submit"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? <><span className="spinner" />{tab === 'login' ? 'Signing in…' : 'Creating account…'}</> : (tab === 'login' ? 'Sign in' : 'Create account')}
            </button>
          </form>

          <p className="auth-footer">
            {tab === 'login'
              ? <>Don't have an account? <button className="auth-link" onClick={() => setTab('signup')}>Sign up</button></>
              : <>Already have an account? <button className="auth-link" onClick={() => setTab('login')}>Log in</button></>
            }
          </p>
        </div>
      </div>
    </div>
  );
}
