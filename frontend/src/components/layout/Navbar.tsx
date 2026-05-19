'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'History', path: '/history' },
    { name: 'Config', path: '/config' },
    { name: 'Analytics', path: '/analytics' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '4rem',
      backgroundColor: 'rgba(15, 17, 21, 0.75)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 2rem',
      zIndex: 50,
      justifyContent: 'space-between',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '6px', 
            background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span style={{ 
            fontWeight: 700, 
            fontSize: '1.25rem', 
            color: '#f8fafc',
            letterSpacing: '-0.03em'
          }}>
            TrafficSim
          </span>
        </Link>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {user && links.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link key={link.path} href={link.path} style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                color: isActive ? '#f8fafc' : '#94A3B8',
                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => {
                if(!isActive) {
                    e.currentTarget.style.color = '#e2e8f0';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseOut={(e) => {
                if(!isActive) {
                    e.currentTarget.style.color = '#94A3B8';
                    e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}>
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', fontSize: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', boxShadow: '0 0 8px #3B82F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Live Feed</span>
        </div>
        
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>

        {user ? (
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.375rem 0.375rem 0.375rem 1rem', borderRadius: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{user.username}</span>
                <span style={{ color: '#3B82F6', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role}</span>
            </div>
            <button 
              onClick={logout} 
              style={{ 
                color: '#ef4444', 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link 
            href="/login?action=login" 
            style={{ 
              color: '#f8fafc', 
              fontWeight: 600,
              background: '#1E40AF',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'all 0.2s',
              border: '1px solid #3B82F6',
              boxShadow: '0 4px 14px 0 rgba(30, 64, 175, 0.4)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#1e3a8a'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#1E40AF'; e.currentTarget.style.transform = 'none'; }}
          >
            Login
          </Link>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}} />
    </nav>
  );
}
