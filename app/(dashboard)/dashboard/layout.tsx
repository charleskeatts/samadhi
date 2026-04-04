'use client';

import { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Detect mobile on mount + resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = open ? 'hidden' : '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open, isMobile]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>

      {/* ── SIDEBAR OVERLAY (mobile only, state-driven) ── */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 39,
          }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        style={{
          width: 220,
          minWidth: 220,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          // Desktop: sticky in normal flow
          // Mobile: fixed, slides in/out via transform
          ...(isMobile ? {
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: 40,
            transform: open ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
          } : {
            position: 'sticky',
            top: 0,
            height: '100vh',
          }),
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '1.8rem 1.4rem 1.4rem',
          borderBottom: '1px solid rgba(240,235,225,0.1)',
        }}>
          <div style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1.7rem',
            fontWeight: 300,
            letterSpacing: '0.22em',
            color: 'var(--ink)',
            lineHeight: 1,
          }}>
            CL<span className="logo-ai">AI</span>RIO
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
                  background: active ? 'rgba(124, 58, 237,0.08)' : 'transparent',
                  borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(240,235,225,0.75)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(240,235,225,0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = 'rgba(240,235,225,0.45)';
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
        <div style={{ padding: '0.9rem 0.75rem', borderTop: '1px solid rgba(240,235,225,0.1)' }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              background: 'none',
              border: '1px solid rgba(240,235,225,0.15)',
              color: 'rgba(240,235,225,0.35)',
              fontFamily: '"DM Mono", monospace',
              fontSize: '9px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,235,225,0.4)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(240,235,225,0.75)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,235,225,0.15)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(240,235,225,0.35)';
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER (state-driven visibility) ── */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'var(--sidebar-bg)',
            borderBottom: '1px solid rgba(240,235,225,0.1)',
            padding: '0 1.2rem',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1.3rem',
            fontWeight: 300,
            letterSpacing: '0.22em',
            color: '#f0ebe1',
          }}>
            CL<span className="logo-ai">AI</span>RIO
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              background: 'none',
              border: '1px solid rgba(240,235,225,0.2)',
              color: 'rgba(240,235,225,0.5)',
              padding: '0.3rem 0.65rem',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: 1,
              minWidth: 38,
              minHeight: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      )}

      {/* ── MAIN ── */}
      <main
        className="dashboard-main"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          // On mobile, push content below the fixed header
          ...(isMobile ? { paddingTop: 56 } : {}),
        }}
      >
        <div style={{ flex: 1, padding: isMobile ? '1.5rem 1rem 2rem' : '2.5rem 2.5rem 3rem' }}>
          {children}
        </div>
        <footer style={{
          padding: '0.7rem 2.5rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
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
