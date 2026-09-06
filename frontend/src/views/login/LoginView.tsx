'use client';

import { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { useViewController } from '@/hooks/useViewController';
import { useTheme } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/components/auth/AuthProvider';
import './login.css';

export function LoginView() {
  const { login, user, status: authStatus } = useAuth();
  const router = useRouter();
  const { showLanding } = useViewController();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      const next = new URLSearchParams(window.location.search).get('next') ?? '/desk/cross';
      router.push(next);
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials.';
      setError(msg);
      if (cardRef.current) {
        cardRef.current.classList.remove('shake');
        void cardRef.current.offsetWidth;
        cardRef.current.classList.add('shake');
      }
    }
    setLoading(false);
  };

  return (
    <div id="auth" className={`auth ${theme === 'light' ? 'light' : ''}`}>
      <nav className="auth-nav">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); showLanding(); }}>
          GREEN<b>WAVE</b>
        </a>
        <div className="nav-actions">
          <button
            className="back-link"
            type="button"
            onClick={() => showLanding()}
            aria-label="Back to briefing"
          >
            <ArrowLeft size={14} strokeWidth={2} /> BACK TO BRIEFING
          </button>
          <ThemeToggle />
        </div>
      </nav>

      <main className="auth-stage">
        <div className="auth-card" ref={cardRef} role="region" aria-label="Admin login">
          <div className="auth-head">
            <div className="auth-eyebrow">GREENWAVE · ADMIN ACCESS</div>
            <h1>Operator sign-in</h1>
            <p className="auth-sub">
              Authenticate to enter the control desk. Real auth is wired to the
              backend; use <code>admin@gravirei.com</code> / <code>Admin@123!</code>.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span className="field-label">EMAIL</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="admin@gravirei.com"
                aria-label="Email"
                required
              />
            </label>

            <label className="field">
              <span className="field-label">PASSWORD</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-label="Password"
                required
              />
            </label>

            {error ? (
              <div className="auth-error" role="alert">
                <AlertTriangle size={14} strokeWidth={2} />
                <span>{error}</span>
              </div>
            ) : null}

            <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
              {loading ? 'AUTHENTICATING…' : 'ENTER CONTROL CENTER'}
              {!loading && <ArrowRight size={14} strokeWidth={2} />}
            </button>

            <div className="auth-footnote">
              SESSION — {authStatus === 'authenticated' && user ? `${user.username} · ${user.role}` : 'NOT AUTHENTICATED'}.
            </div>
          </form>
        </div>

        <div className="auth-aside" aria-hidden="true">
          <div className="aside-card">
            <div className="aside-eyebrow">// SESSION</div>
            <div className="aside-row">
              <span>VIEW</span>
              <b>{theme === 'light' ? 'LIGHT' : 'DARK'}</b>
            </div>
            <div className="aside-row">
              <span>NETWORK</span>
              <b>{authStatus === 'authenticated' ? 'ONLINE · JWT' : 'OFFLINE'}</b>
            </div>
            <div className="aside-row">
              <span>ROLE</span>
              <b>{user ? user.role : '—'}</b>
            </div>
            <div className="aside-row">
              <span>NODE</span>
              <b>0.0.0.0</b>
            </div>
          </div>
        </div>
      </main>

      <footer className="auth-foot">
        <span>GREENWAVE — single-file traffic control simulation</span>
        <span>no data leaves your browser · figures indicative</span>
      </footer>
    </div>
  );
}
