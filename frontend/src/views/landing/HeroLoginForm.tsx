'use client';

import { FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export function HeroLoginForm() {
  const router = useRouter();
  const { login } = useAuth();
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
    try {
      await login(email, password);
      router.push('/desk/cross');
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
    <form className="hero-login" ref={cardRef} onSubmit={handleSubmit} noValidate aria-label="Admin sign-in">
      <div className="hero-login-head">
        <div className="hero-login-eyebrow">ADMIN ACCESS</div>
        <h2>Operator sign-in</h2>
        <p>
          Authenticate to enter the control desk. Real auth is wired to the
          backend; use <code>admin@gravirei.com</code> / <code>Admin@123!</code>.
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
          <AlertTriangle size={14} strokeWidth={2} />
          <span>{error}</span>
        </div>
      ) : null}

      <button type="submit" className="hero-login-submit" disabled={loading} aria-busy={loading}>
        {loading ? 'AUTHENTICATING…' : 'ENTER CONTROL CENTER'}
        {!loading && <ArrowRight size={14} strokeWidth={2} />}
      </button>
    </form>
  );
}
