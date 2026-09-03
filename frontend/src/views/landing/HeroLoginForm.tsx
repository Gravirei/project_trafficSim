'use client';

import { FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLucideRefresh } from '@/hooks/useLucide';

const MOCK_CREDENTIALS = { email: 'admin@gravirei.com', password: 'Admin@123!' };

export function HeroLoginForm() {
  useLucideRefresh();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLFormElement | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (email === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
      router.push('/desk/cross');
      return;
    }
    setLoading(false);
    setError('Invalid credentials. Try admin@gravirei.com / Admin@123!');
    if (cardRef.current) {
      cardRef.current.classList.remove('shake');
      void cardRef.current.offsetWidth;
      cardRef.current.classList.add('shake');
    }
  };

  return (
    <form className="hero-login" ref={cardRef} onSubmit={handleSubmit} noValidate aria-label="Admin sign-in">
      <div className="hero-login-head">
        <div className="hero-login-eyebrow">ADMIN ACCESS</div>
        <h2>Operator sign-in</h2>
        <p>
          Authenticate to enter the control desk. Mock auth — use{' '}
          <code>admin@gravirei.com</code> / <code>Admin@123!</code>.
        </p>
      </div>

      <label className="hero-login-field">
        <span>EMAIL</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="admin@gravirei.com"
          required
        />
      </label>
      <label className="hero-login-field">
        <span>PASSWORD</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </label>

      {error ? (
        <div className="hero-login-error" role="alert">
          <i data-lucide="alert-triangle" />
          <span>{error}</span>
        </div>
      ) : null}

      <button type="submit" className="hero-login-submit" disabled={loading} aria-busy={loading}>
        {loading ? 'AUTHENTICATING…' : 'ENTER CONTROL CENTER'}
        {!loading && <i data-lucide="arrow-right" />}
      </button>
    </form>
  );
}
