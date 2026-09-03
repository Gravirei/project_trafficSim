'use client';

import { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useViewController } from '@/hooks/useViewController';
import { useTheme } from '@/hooks/useTheme';
import { useLucideRefresh } from '@/hooks/useLucide';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import './login.css';

const MOCK_CREDENTIALS = { email: 'admin@gravirei.com', password: 'Admin@123!' };

export function LoginView() {
  useLucideRefresh();
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
    // Frontend-only mock. Real backend wiring happens in the auth phase.
    await new Promise((r) => setTimeout(r, 600));
    if (email === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
      router.push('/desk/cross');
      return;
    }
    setLoading(false);
    setError('Invalid credentials. Try admin@gravirei.com / Admin@123!');
    // Shake the card to indicate failure
    if (cardRef.current) {
      cardRef.current.classList.remove('shake');
      void cardRef.current.offsetWidth; // force reflow
      cardRef.current.classList.add('shake');
    }
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
            <i data-lucide="arrow-left" /> BACK TO BRIEFING
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
              Authenticate to enter the control desk. This is a frontend mock —
              use <code>admin@gravirei.com</code> / <code>Admin@123!</code>.
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
                <i data-lucide="alert-triangle" />
                <span>{error}</span>
              </div>
            ) : null}

            <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
              {loading ? 'AUTHENTICATING…' : 'ENTER CONTROL CENTER'}
              {!loading && <i data-lucide="arrow-right" />}
            </button>

            <div className="auth-footnote">
              BYPASS — for now this screen is a layout demo. Real auth wires in a later phase.
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
              <b>OFFLINE — MOCK</b>
            </div>
            <div className="aside-row">
              <span>ROLE</span>
              <b>VIEWER</b>
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
