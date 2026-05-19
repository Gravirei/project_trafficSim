'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function LoginPage() {
    const { login } = useAuth();
    const searchParams = useSearchParams();
    
    const [showForm, setShowForm] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchParams.get('action') === 'login') {
            setShowForm(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await api.login({ email, username, password });
            login(data.token, data.user);
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#020617',
            overflow: 'hidden'
        }}>
            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
                
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse-glow {
                    0%, 100% { 
                        filter: drop-shadow(0 0 40px rgba(34, 197, 94, 0.3)) brightness(1);
                        opacity: 0.15;
                    }
                    50% { 
                        filter: drop-shadow(0 0 80px rgba(34, 197, 94, 0.5)) brightness(1.2);
                        opacity: 0.25;
                    }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .bg-glow {
                    animation: pulse-glow 4s ease-in-out infinite;
                }
                .float-anim {
                    animation: float 6s ease-in-out infinite;
                }
                .cta-btn {
                    position: relative;
                    overflow: hidden;
                    background: linear-gradient(90deg, #22C55E, #16a34a, #22C55E);
                    background-size: 200% 100%;
                    animation: shimmer 3s linear infinite;
                }
                .cta-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 40px rgba(34, 197, 94, 0.4);
                }
                .glass-card {
                    background: rgba(30, 41, 59, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .input-field {
                    background: rgba(15, 23, 42, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.2s;
                }
                .input-field:focus {
                    border-color: #22C55E;
                    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
                }
            `}} />

            <img 
                src="/logo.png" 
                alt=""
                className="bg-glow"
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            {!showForm ? (
                <div style={{ 
                    zIndex: 10, 
                    textAlign: 'center', 
                    animation: 'fadeIn 1s ease-out',
                    maxWidth: '640px',
                    padding: '0 2rem'
                }}>
                    <div className="float-anim" style={{ marginBottom: '2rem' }}>
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
                            fontWeight: 700, 
                            color: '#F8FAFC',
                            fontFamily: "'DM Sans', sans-serif",
                            letterSpacing: '-0.04em',
                            marginBottom: '0.5rem',
                            textShadow: '0 0 60px rgba(34, 197, 94, 0.3)'
                        }}>
                            Traffic Control
                        </h1>
                        <h2 style={{
                            margin: 0,
                            fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                            fontWeight: 500,
                            color: '#22C55E',
                            fontFamily: "'DM Sans', sans-serif",
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase'
                        }}>
                            System
                        </h2>
                    </div>
                    
                    <p style={{
                        color: '#94A3B8',
                        fontSize: '1.125rem',
                        fontFamily: "'DM Sans', sans-serif",
                        maxWidth: '500px',
                        margin: '0 auto 2.5rem auto',
                        lineHeight: 1.7,
                        fontWeight: 400
                    }}>
                        Advanced adaptive traffic management with real-time queue modeling and AI-driven signal optimization.
                    </p>

                    <button
                        onClick={() => setShowForm(true)}
                        className="cta-btn"
                        style={{
                            marginTop: '7.5rem',
                            padding: '1rem 3rem',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#020617',
                            fontSize: '1rem',
                            fontWeight: 600,
                            fontFamily: "'DM Sans', sans-serif",
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)'
                        }}
                    >
                        <span>Enter Dashboard</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14"></path>
                            <path d="m12 5 7 7-7 7"></path>
                        </svg>
                    </button>

                    <div style={{
                        marginTop: '3rem',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '2rem',
                        color: '#475569',
                        fontSize: '0.875rem',
                        fontFamily: "'DM Sans', sans-serif"
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
                            Real-time Monitoring
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>
                            Secure Access
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            Analytics
                        </span>
                    </div>
                </div>
            ) : (
                <div className="glass-card" style={{
                    position: 'relative',
                    padding: '2.5rem',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '400px',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    zIndex: 10
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, #22C55E, transparent)'
                    }} />

                    <button 
                        onClick={() => setShowForm(false)}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            left: '1rem',
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.25rem',
                            transition: 'color 0.2s'
                        }}
                        className="back-btn"
                        aria-label="Back to landing"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>

                    <style dangerouslySetInnerHTML={{__html: `
                        .back-btn:hover { color: #f8fafc !important; }
                    `}} />

                    <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '0.5rem' }}>
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: '1.5rem', 
                            fontWeight: 600, 
                            color: '#f8fafc',
                            fontFamily: "'DM Sans', sans-serif",
                            letterSpacing: '-0.025em'
                        }}>
                            Welcome Back
                        </h1>
                        <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.875rem', fontFamily: "'DM Sans', sans-serif" }}>
                            Sign in to continue
                        </p>
                    </div>
                    
                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderLeft: '3px solid #ef4444',
                            color: '#fca5a5',
                            padding: '0.875rem',
                            borderRadius: '0 8px 8px 0',
                            marginBottom: '1.25rem',
                            fontSize: '0.875rem',
                            fontFamily: "'DM Sans', sans-serif",
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontSize: '0.8125rem', 
                                fontWeight: 500, 
                                color: '#cbd5e1',
                                fontFamily: "'DM Sans', sans-serif"
                            }}>
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="admin@trafficcontrol.io"
                                className="input-field"
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '10px',
                                    color: '#f8fafc',
                                    fontSize: '0.95rem',
                                    fontFamily: "'DM Sans', sans-serif",
                                    outline: 'none'
                                }}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontSize: '0.8125rem', 
                                fontWeight: 500, 
                                color: '#cbd5e1',
                                fontFamily: "'DM Sans', sans-serif"
                            }}>
                                Username
                            </label>
                            <input
                                type="text"
                                placeholder="admin"
                                className="input-field"
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '10px',
                                    color: '#f8fafc',
                                    fontSize: '0.95rem',
                                    fontFamily: "'DM Sans', sans-serif",
                                    outline: 'none'
                                }}
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '0.5rem', 
                                fontSize: '0.8125rem', 
                                fontWeight: 500, 
                                color: '#cbd5e1',
                                fontFamily: "'DM Sans', sans-serif"
                            }}>
                                Password
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="input-field"
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '10px',
                                    color: '#f8fafc',
                                    fontSize: '0.95rem',
                                    fontFamily: "'DM Sans', sans-serif",
                                    outline: 'none'
                                }}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="cta-btn"
                            style={{
                                marginTop: '0.5rem',
                                padding: '0.875rem',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#020617',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                fontFamily: "'DM Sans', sans-serif",
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.8 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}