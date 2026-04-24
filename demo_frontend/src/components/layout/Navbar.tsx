'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'History', path: '/history' },
    { name: 'Config', path: '/config' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      minHeight: '4rem',
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem 1.5rem',
      zIndex: 50,
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '6px', 
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span style={{ 
            fontWeight: 700, 
            fontSize: '1.25rem', 
            color: 'var(--text-primary)',
          }}>
            TrafficSim Demo
          </span>
        </Link>
        
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {links.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link key={link.path} href={link.path} style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => {
                if(!isActive) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.04)';
                }
              }}
              onMouseOut={(e) => {
                if(!isActive) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Demo Data</span>
        </div>
      </div>
    </nav>
  );
}
