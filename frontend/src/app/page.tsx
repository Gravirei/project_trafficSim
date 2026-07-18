'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

function useScrollReveal(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);

    return { ref, visible };
}

function FadeInSection({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
    const { ref, visible } = useScrollReveal();
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(40px)',
                transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
            }}
        >
            {children}
        </div>
    );
}

function StaggeredImage({ src, alt, index }: { src: string; alt: string; index: number }) {
    const { ref, visible } = useScrollReveal(0.2);
    const directions = ['translateX(-60px)', 'translateY(40px)', 'translateX(60px)'];
    return (
        <div
            ref={ref}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0) translateY(0)' : directions[index % 3],
                transition: `all 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s`,
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                border: '1px solid rgba(34, 197, 94, 0.1)',
            }}
        >
            <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
    );
}

const styles = {
    section: {
        padding: '6rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
    } as const,
    heading: {
        fontSize: 'clamp(2rem, 4vw, 3rem)',
        fontWeight: 700,
        color: '#F8FAFC',
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: '-0.03em',
        marginBottom: '1rem',
    } as const,
    subtext: {
        color: '#94A3B8',
        fontSize: '1.125rem',
        lineHeight: 1.7,
        fontFamily: "'DM Sans', sans-serif",
        maxWidth: '600px',
    } as const,
    glass: {
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
    } as const,
};

function LoginPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { login } = useAuth();
    const [selectedRole, setSelectedRole] = useState<'VIEWER' | 'ADMIN' | null>(null);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        <>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 200,
                    background: 'rgba(2, 6, 23, 0.6)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? 'auto' : 'none',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            />

            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                maxWidth: '460px',
                zIndex: 201,
                background: '#0F1729',
                borderLeft: '1px solid rgba(34, 197, 94, 0.1)',
                boxShadow: '-10px 0 60px rgba(0, 0, 0, 0.5)',
                transform: open ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
            }}>
                <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#F8FAFC', letterSpacing: '-0.03em' }}>
                            TrafficSim
                        </span>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '10px',
                                width: '40px',
                                height: '40px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94A3B8',
                                transition: 'all 0.2s',
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#F8FAFC'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94A3B8'; }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>

                    {selectedRole === null && (
                        <SelectRole onSelect={(role) => setSelectedRole(role)} onClose={onClose} />
                    )}
                    {selectedRole === 'VIEWER' && (
                        <ViewerWarning onBack={() => setSelectedRole(null)} onClose={onClose} />
                    )}
                    {selectedRole === 'ADMIN' && (
                        <AdminLogin
                            email={email} setEmail={setEmail}
                            username={username} setUsername={setUsername}
                            password={password} setPassword={setPassword}
                            error={error}
                            loading={loading}
                            onSubmit={handleSubmit}
                            onBack={() => { setSelectedRole(null); setError(''); }}
                            onClose={onClose}
                        />
                    )}

                    <div style={{ marginTop: 'auto', textAlign: 'center', paddingTop: '2rem' }}>
                        <p style={{ color: '#475569', fontSize: '0.8rem', margin: 0 }}>
                            Secure access for authorized personnel only
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

function SelectRole({ onSelect }: { onSelect: (role: 'VIEWER' | 'ADMIN') => void; onClose: () => void }) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 0.5rem' }}>
                    Select Your Role
                </div>
                <div style={{ color: '#64748B', fontSize: '0.85rem' }}>
                    Choose how you want to access the system
                </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '2rem' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                    { role: 'ADMIN' as const, label: 'Admin', desc: 'Full access to control and monitor the system.' },
                    { role: 'VIEWER' as const, label: 'Viewer', desc: 'Read-only access to view dashboards and analytics.' },
                ].map((r) => (
                    <button key={r.role} onClick={() => onSelect(r.role)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1rem 1.25rem', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                        transition: 'all 0.2s',
                    }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                        <div>
                            <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '1rem', marginBottom: '0.15rem' }}>{r.label}</div>
                            <div style={{ color: '#64748B', fontSize: '0.8rem' }}>{r.desc}</div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    );
}

function ViewerWarning({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '2rem' }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '56px', height: '56px', borderRadius: '14px',
                background: 'rgba(245, 158, 11, 0.08)',
                margin: '0 auto 1.25rem',
            }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <path d="M12 9v4" /><path d="M12 17h.01" />
                </svg>
            </div>

            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC', textAlign: 'center', marginBottom: '0.75rem' }}>
                Viewer Mode Unavailable
            </div>

            <div style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, textAlign: 'center', marginBottom: '2rem' }}>
                The viewer role is currently under development. Please sign in as an admin to access the traffic control system.
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '1.5rem' }} />

            <button onClick={onBack} style={{
                padding: '0.875rem', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#F8FAFC', fontSize: '0.9rem', cursor: 'pointer',
                marginBottom: '0.75rem', transition: 'all 0.2s',
            }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
                Try Different Role
            </button>
            <button onClick={onClose} style={{
                padding: '0.875rem', borderRadius: '10px',
                border: 'none', background: 'transparent',
                color: '#64748B', fontSize: '0.85rem', cursor: 'pointer',
                transition: 'color 0.2s',
            }}
                onMouseOver={e => { e.currentTarget.style.color = '#94A3B8'; }}
                onMouseOut={e => { e.currentTarget.style.color = '#64748B'; }}
            >
                Cancel
            </button>
        </div>
    );
}

function AdminLogin({
    email, setEmail,
    username, setUsername,
    password, setPassword,
    error, loading, onSubmit, onBack, onClose,
}: {
    email: string; setEmail: (v: string) => void;
    username: string; setUsername: (v: string) => void;
    password: string; setPassword: (v: string) => void;
    error: string; loading: boolean;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    onBack: () => void; onClose: () => void;
}) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        width: '40px', height: '40px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#94A3B8',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#F8FAFC'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94A3B8'; }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '1.1rem', fontFamily: "'DM Sans', sans-serif" }}>
                        Admin Access
                    </div>
                    <div style={{ color: '#64748B', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif" }}>
                        Sign in to your account
                    </div>
                </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '1.5rem' }} />

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#fca5a5', padding: '0.75rem',
                    borderRadius: '8px', marginBottom: '1rem',
                    fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><path d="M15 9 9 15" /><path d="M9 9l6 6" />
                    </svg>
                    {error}
                </div>
            )}

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>Email</label>
                    <input type="email" placeholder="admin@trafficcontrol.io" value={email} onChange={e => setEmail(e.target.value)} required style={{
                        width: '100%', padding: '0.875rem 1rem', borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#F8FAFC', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>Username</label>
                    <input type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} required style={{
                        width: '100%', padding: '0.875rem 1rem', borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#F8FAFC', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>Password</label>
                    <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{
                        width: '100%', padding: '0.875rem 1rem', borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#F8FAFC', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>

                <button type="submit" disabled={loading} style={{
                    marginTop: '0.75rem', padding: '0.875rem',
                    border: 'none', borderRadius: '10px',
                    color: '#020617', fontSize: '1rem', fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    background: '#22C55E',
                    transition: 'all 0.2s',
                }}
                    onMouseOver={e => { if (!loading) { e.currentTarget.style.background = '#1a9e4b'; }}}
                    onMouseOut={e => { if (!loading) { e.currentTarget.style.background = '#22C55E'; }}}
                >
                    {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                            Signing in...
                        </span>
                    ) : 'Sign In'}
                </button>
            </form>
        </div>
    );
}

function Nav({ onOpenLogin }: { onOpenLogin: () => void }) {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            zIndex: 100,
            backgroundColor: scrolled ? 'rgba(2, 6, 23, 0.85)' : 'transparent',
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            borderBottom: scrolled ? '1px solid rgba(34, 197, 94, 0.08)' : '1px solid transparent',
            transition: 'all 0.3s ease',
        }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: '#22C55E',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#020617" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#F8FAFC' }}>
                    TrafficSim
                </span>
            </Link>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <a href="#features" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.color = '#F8FAFC'}
                    onMouseOut={e => e.currentTarget.style.color = '#94A3B8'}>
                    Features
                </a>
                <a href="#how-it-works" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.color = '#F8FAFC'}
                    onMouseOut={e => e.currentTarget.style.color = '#94A3B8'}>
                    How It Works
                </a>
                <button onClick={onOpenLogin} style={{
                    color: '#020617', fontWeight: 600, fontSize: '0.9rem',
                    background: '#22C55E', padding: '0.5rem 1.5rem', borderRadius: '8px',
                    border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
                }}
                    onMouseOver={e => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#22C55E'; e.currentTarget.style.transform = 'none'; }}>
                    Get Started
                </button>
            </div>
        </nav>
    );
}

function Hero({ onOpenLogin }: { onOpenLogin: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const v = videoRef.current;
        if (v) {
            v.play().catch(() => {});
        }
    }, []);

    return (
        <section style={{
            position: 'relative',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: '#020617',
        }}>
            <div style={{
                position: 'absolute',
                inset: 0,
                animation: 'videoFadeIn 1.5s ease forwards',
            }}>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="/assets/hero-bg.webp"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.5,
                    }}
                >
                    <source src="/assets/demo.mp4" type="video/mp4" />
                </video>
            </div>

            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(2, 6, 35, 0.85) 0%, rgba(2, 6, 35, 0.6) 50%, rgba(2, 6, 35, 0.85) 100%)',
            }} />

            <div style={{
                position: 'relative',
                zIndex: 2,
                textAlign: 'center',
                maxWidth: '800px',
                padding: '0 2rem',
                animation: 'heroFadeIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                opacity: 0,
            }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)',
                    padding: '0.5rem 1.25rem', borderRadius: '100px',
                    marginBottom: '2rem',
                }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 10px #22C55E' }} />
                    <span style={{ color: '#22C55E', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Real-Time AI Traffic Management
                    </span>
                </div>

                <h1 style={{
                    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                    fontWeight: 700,
                    color: '#F8FAFC',
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: '-0.04em',
                    lineHeight: 1.1,
                    marginBottom: '1.5rem',
                    textShadow: '0 0 40px rgba(34, 197, 94, 0.15)',
                }}>
                    Intelligent Traffic<br />
                    <span style={{ color: '#22C55E' }}>Control System</span>
                </h1>

                <p style={{
                    color: '#94A3B8',
                    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                    lineHeight: 1.7,
                    fontFamily: "'DM Sans', sans-serif",
                    maxWidth: '600px',
                    margin: '0 auto 2.5rem auto',
                }}>
                    Advanced adaptive traffic management powered by real-time queue modeling,
                    AI-driven signal optimization, and live WebSocket monitoring.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={onOpenLogin} style={{
                        padding: '1rem 2.5rem', border: 'none', borderRadius: '12px',
                        color: '#020617', fontSize: '1rem', fontWeight: 600,
                        cursor: 'pointer', background: '#22C55E',
                        transition: 'all 0.2s',
                    }}
                        onMouseOver={e => { e.currentTarget.style.background = '#1a9e4b'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#22C55E'; }}>
                        Launch Dashboard
                    </button>
                    <a href="#how-it-works" style={{
                        padding: '1rem 2.5rem', borderRadius: '12px',
                        color: '#F8FAFC', fontSize: '1rem', fontWeight: 500,
                        fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                    }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                        Learn More
                    </a>
                </div>
            </div>

            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '150px',
                background: 'linear-gradient(to top, #020617, transparent)',
                zIndex: 1,
            }} />

            <style>{`
                @keyframes heroFadeIn {
                    from { opacity: 0; transform: translateY(30px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes videoFadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }

            `}</style>
        </section>
    );
}

const features = [
    {
        icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
        title: 'Real-Time Queue Modeling',
        desc: 'Monitor queue lengths, wait times, and utilization in real time across multiple intersections using M/M/1 and M/M/c queuing models.',
    },
    {
        icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
        title: 'AI-Driven Signal Optimization',
        desc: 'Adaptive signal control algorithm dynamically adjusts green light timing based on real-time traffic conditions to minimize congestion.',
    },
    {
        icon: 'M12 6v6l4 2 M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20',
        title: 'Live WebSocket Streaming',
        desc: 'Bi-directional real-time data flow between the simulation engine and dashboard ensures sub-second latency for all monitoring and controls.',
    },
    {
        icon: 'M2 12h20M12 2v20M4 6h16M4 18h16',
        title: 'Historical Analytics',
        desc: 'Persistent PostgreSQL storage with rich querying capabilities — analyze trends, generate reports, and export data for further analysis.',
    },
    {
        icon: 'M12 20V10M18 20V4M6 20v-4',
        title: 'Configurable Parameters',
        desc: 'Tune arrival rates (λ), service rates (μ), simulation speed, and adaptive thresholds in real time to model different traffic scenarios.',
    },
    {
        icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
        title: 'Multi-Intersection View',
        desc: 'Visual dashboard with four-lane intersection layout, signal state indicators, queue bars, and live metrics for each signal group.',
    },
];

function Features() {
    return (
        <section id="features" style={{ ...styles.section, paddingTop: '8rem' }}>
            <FadeInSection>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <span style={{ color: '#22C55E', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Platform Capabilities
                    </span>
                    <h2 style={styles.heading}>Everything You Need to Manage Traffic</h2>
                    <p style={{ ...styles.subtext, margin: '0 auto' }}>
                        From real-time monitoring to AI-powered optimization, our platform provides comprehensive tools for modern traffic management.
                    </p>
                </div>
            </FadeInSection>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem',
            }}>
                {features.map((f, i) => (
                    <FadeInSection key={i} delay={i * 0.1}>
                        <div style={{
                            ...styles.glass,
                            padding: '2rem',
                            height: '100%',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'default',
                        }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.2)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(34, 197, 94, 0.05)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.boxShadow = 'none'; }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '10px',
                                background: 'rgba(34, 197, 94, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1.25rem',
                            }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={f.icon} />
                                </svg>
                            </div>
                            <h3 style={{ color: '#F8FAFC', fontSize: '1.15rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginBottom: '0.75rem' }}>
                                {f.title}
                            </h3>
                            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                                {f.desc}
                            </p>
                        </div>
                    </FadeInSection>
                ))}
            </div>
        </section>
    );
}

function HowItWorks() {
    const steps = [
        {
            title: '1. Configure Parameters',
            desc: 'Set arrival rates (λ), service rates (μ), simulation speed, and choose between FIXED or ADAPTIVE signal control modes.',
            image: '/assets/traffic-flow.jpg',
        },
        {
            title: '2. Start Simulation',
            desc: 'Launch the simulation engine — vehicles arrive at intersections following a Poisson process, queues form and dissipate in real time.',
            image: '/assets/dashboard-preview.png',
        },
        {
            title: '3. Monitor & Optimize',
            desc: 'Watch live metrics update in real time via WebSocket. The adaptive algorithm adjusts signal timing when utilization exceeds configurable thresholds.',
            image: '/assets/safety-control.webp',
        },
    ];

    return (
        <section id="how-it-works" style={{ ...styles.section, paddingTop: '6rem', paddingBottom: '6rem' }}>
            <FadeInSection>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <span style={{ color: '#22C55E', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        How It Works
                    </span>
                    <h2 style={styles.heading}>Three Simple Steps</h2>
                    <p style={{ ...styles.subtext, margin: '0 auto' }}>
                        From configuration to real-time optimization — get your traffic simulation running in minutes.
                    </p>
                </div>
            </FadeInSection>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                {steps.map((step, i) => {
                    const isReversed = i % 2 === 1;
                    return (
                        <FadeInSection key={i} delay={i * 0.15}>
                            <div style={{
                                display: 'flex',
                                flexDirection: isReversed ? 'row-reverse' : 'row',
                                gap: '3rem',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                            }}>
                                <div style={{ flex: '1 1 300px', maxWidth: '500px' }}>
                                    <h3 style={{
                                        fontSize: '1.5rem', fontWeight: 600, color: '#F8FAFC',
                                        fontFamily: "'DM Sans', sans-serif", marginBottom: '1rem',
                                    }}>
                                        {step.title}
                                    </h3>
                                    <p style={{ color: '#94A3B8', fontSize: '1rem', lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                                        {step.desc}
                                    </p>
                                </div>
                                <div style={{
                                    flex: '1 1 300px', maxWidth: '500px',
                                    height: '280px',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(34, 197, 94, 0.1)',
                                }}>
                                    <img
                                        src={step.image}
                                        alt={step.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                </div>
                            </div>
                        </FadeInSection>
                    );
                })}
            </div>
        </section>
    );
}

const metrics = [
    { value: 'Real-Time', label: 'WebSocket Streaming' },
    { value: '4', label: 'Intersection Lanes' },
    { value: 'AI-Powered', label: 'Adaptive Control' },
    { value: 'PostgreSQL', label: 'Persistent Storage' },
];

function MetricsBar() {
    return (
        <FadeInSection>
            <div style={{
                ...styles.glass,
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '2rem',
                padding: '3rem 2rem',
                margin: '0 2rem',
                maxWidth: '1000px',
                marginLeft: 'auto',
                marginRight: 'auto',
            }}>
                {metrics.map((m, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#22C55E', fontFamily: "'DM Sans', sans-serif", marginBottom: '0.25rem' }}>
                            {m.value}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748B', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                            {m.label}
                        </div>
                    </div>
                ))}
            </div>
        </FadeInSection>
    );
}

function PreviewGallery() {
    const images = [
        { src: '/assets/isometric.avif', alt: 'Isometric traffic system illustration' },
        { src: '/assets/hero-bg.webp', alt: 'Traffic control dashboard preview' },
        { src: '/assets/safety-control.webp', alt: 'Integrated safety control system' },
    ];

    return (
        <section style={{ ...styles.section, paddingTop: '2rem', paddingBottom: '6rem' }}>
            <FadeInSection>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={styles.heading}>Visual Overview</h2>
                    <p style={{ ...styles.subtext, margin: '0 auto' }}>
                        See the system in action through our dashboard previews and system visualizations.
                    </p>
                </div>
            </FadeInSection>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
            }}>
                {images.map((img, i) => (
                    <StaggeredImage key={i} src={img.src} alt={img.alt} index={i} />
                ))}
            </div>
        </section>
    );
}

function CtaSection({ onOpenLogin }: { onOpenLogin: () => void }) {
    return (
        <FadeInSection>
            <div style={{
                ...styles.glass,
                textAlign: 'center',
                padding: '4rem 2rem',
                margin: '0 2rem 4rem',
                maxWidth: '900px',
                marginLeft: 'auto',
                marginRight: 'auto',
                border: '1px solid rgba(34, 197, 94, 0.15)',
            }}>
                <h2 style={{ ...styles.heading, marginBottom: '1rem' }}>
                    Ready to Optimize Your Traffic?
                </h2>
                <p style={{ ...styles.subtext, margin: '0 auto 2rem auto', maxWidth: '500px' }}>
                    Launch the dashboard to start monitoring and controlling your traffic simulation in real time.
                </p>
                <button onClick={onOpenLogin} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                    padding: '1rem 2.5rem', border: 'none', borderRadius: '12px',
                    color: '#020617', fontSize: '1rem', fontWeight: 600,
                    cursor: 'pointer', background: '#22C55E',
                    transition: 'all 0.2s',
                }}
                    onMouseOver={e => { e.currentTarget.style.background = '#1a9e4b'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#22C55E'; }}>
                    <span>Get Started</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                    </svg>
                </button>
            </div>
        </FadeInSection>
    );
}

function Footer() {
    return (
        <footer style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            padding: '2rem',
            textAlign: 'center',
            color: '#475569',
            fontSize: '0.85rem',
            fontFamily: "'DM Sans', sans-serif",
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{
                    width: '20px', height: '20px', borderRadius: '4px',
                    background: '#22C55E',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#020617" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                </div>
                <span style={{ fontWeight: 600, color: '#64748B' }}>TrafficSim</span>
            </div>
            <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Traffic Control System. All rights reserved.</p>
        </footer>
    );
}

export default function LandingPage() {
    const [loginOpen, setLoginOpen] = useState(false);

    return (
        <div style={{ background: '#020617', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
            <Nav onOpenLogin={() => setLoginOpen(true)} />
            <Hero onOpenLogin={() => setLoginOpen(true)} />
            <Features />
            <MetricsBar />
            <HowItWorks />
            <PreviewGallery />
            <CtaSection onOpenLogin={() => setLoginOpen(true)} />
            <Footer />
            <LoginPanel open={loginOpen} onClose={() => setLoginOpen(false)} />
        </div>
    );
}
