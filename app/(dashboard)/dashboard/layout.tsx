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
      <aside style={{
        width: 220,
        minWidth: 220,
        background: '#060504',
        borderRight: '1px solid var(--border)',
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
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1.7rem',
            fontWeight: 300,
            letterSpacing: '0.22em',
            color: 'var(--ink)',
            lineHeight: 1,
          }}>
            CL<span style={{ color: 'var(--gold)' }}>A</span>IRIO
          </div>
          <div style={{
            fontSize: '8px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
            marginTop: '0.3rem',
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
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--gold)' : 'var(--ink-muted)',
                  background: active ? 'rgba(232,184,75,0.07)' : 'transparent',
                  borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--ink-dim)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--ink-muted)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                <span style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: '11px',
                  fontStyle: 'italic',
                  color: active ? 'var(--gold-dim)' : 'var(--border-bright)',
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
        <div style={{ padding: '0.9rem 0.75rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--ink-muted)',
              fontFamily: '"DM Mono", monospace',
              fontSize: '9px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--orange-dim)';
              (e.currentTarget as HTMLElement).style.color = 'var(--orange)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--ink-muted)';
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <div style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#060504',
        borderBottom: '1px solid var(--border)',
        padding: '0.9rem 1.2rem',
        alignItems: 'center',
        justifyContent: 'space-between',
      }} className="mobile-hdr">
        <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.3rem', fontWeight: 300, letterSpacing: '0.22em', color: 'var(--ink)' }}>
          CL<span style={{ color: 'var(--gold)' }}>A</span>IRIO
        </span>
        <button
          onClick={() => setOpen(!open)}
          style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--ink-muted)', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '11px' }}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ flex: 1, padding: '2.5rem 2.5rem 3rem' }}>
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
        }}>
          <span>Clairio · Revenue-Weighted Product Intelligence</span>
          <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic' }}>Samadi Consulting LLC</span>
        </footer>
      </main>
    </div>
  );
}
