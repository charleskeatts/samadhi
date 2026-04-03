'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/dashboard',           label: 'Overview',  abbr: 'OV' },
  { href: '/dashboard/feedback',  label: 'Feedback',  abbr: 'FB' },
  { href: '/dashboard/insights',  label: 'Insights',  abbr: 'AI' },
  { href: '/dashboard/backlog',   label: 'Backlog',   abbr: 'BL' },
  { href: '/dashboard/roadmap',   label: 'Roadmap',   abbr: 'RM' },
  { href: '/dashboard/settings',  label: 'Settings',  abbr: 'ST' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── SIDEBAR ── */}
      <aside className="dash-sidebar" style={{
        width: 220,
        minWidth: 220,
        background: 'var(--ink)',
        borderRight: '2px solid var(--ink)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>

        {/* Logo */}
        <div style={{
          padding: '1.8rem 1.4rem 1.4rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            lineHeight: 1,
          }}>
            Cl<span style={{ color: 'var(--teal)', fontStyle: 'italic' }}>ai</span>rio
          </div>
          <div style={{
            fontSize: '9px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginTop: '0.35rem',
            fontFamily: '"DM Mono", monospace',
          }}>
            Revenue Intelligence
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.55rem 0.7rem',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontFamily: '"DM Mono", monospace',
                  color: active ? 'var(--teal)' : 'rgba(255,255,255,0.45)',
                  background: active ? 'rgba(0,184,160,0.1)' : 'transparent',
                  borderLeft: active ? '2px solid var(--teal)' : '2px solid transparent',
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                <span style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '11px',
                  fontStyle: 'italic',
                  color: active ? 'var(--teal-dk)' : 'rgba(255,255,255,0.2)',
                  minWidth: '1.4rem',
                }}>
                  {item.abbr}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '0.9rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              background: 'none',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.35)',
              fontFamily: '"DM Mono", monospace',
              fontSize: '9px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--red)';
              (e.currentTarget as HTMLElement).style.color = 'var(--red)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)';
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <div className="mobile-hdr" style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'var(--ink)',
        borderBottom: '2px solid var(--ink)',
        padding: '0.9rem 1.2rem',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
          Cl<span style={{ color: 'var(--teal)', fontStyle: 'italic' }}>ai</span>rio
        </span>
        <button
          onClick={() => setOpen(!open)}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '11px' }}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <div className="dash-main-content" style={{ flex: 1, padding: '2.5rem 2.5rem 3rem' }}>
          {children}
        </div>
        <footer style={{
          padding: '0.7rem 2.5rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9px',
          letterSpacing: '0.12em',
          color: 'var(--ink-muted)',
          fontFamily: '"DM Mono", monospace',
        }}>
          <span>Clairio · Revenue-Weighted Product Intelligence</span>
          <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '11px' }}>Samadhi Consulting LLC</span>
        </footer>
      </main>
    </div>
  );
}
