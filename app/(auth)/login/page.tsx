'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Mode = 'password' | 'magic';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();

      if (mode === 'password') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: `${window.location.origin}/callback` },
        });
        if (error) throw error;
        setSubmitted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '2.8rem',
            fontWeight: 300,
            letterSpacing: '0.3em',
            color: 'var(--ink)',
            lineHeight: 1,
          }}>
            CL<span className="logo-ai">AI</span>RIO
          </div>
          <div style={{
            fontSize: '9px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
            marginTop: '0.5rem',
          }}>
            Revenue-Weighted Product Intelligence
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderTop: '2px solid var(--gold-dim)',
          padding: '2.2rem',
        }}>
          {!submitted ? (
            <>
              <div style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '1.2rem',
                fontWeight: 300,
                color: 'var(--ink)',
                letterSpacing: '0.08em',
                marginBottom: '1.4rem',
              }}>
                Sign in
              </div>

              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '1.4rem' }}>
                {(['password', 'magic'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setError(''); }}
                    style={{
                      flex: 1,
                      padding: '0.4rem',
                      fontSize: '9px',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      background: mode === m ? 'rgba(124, 58, 237,0.08)' : 'transparent',
                      color: mode === m ? 'var(--gold)' : 'var(--ink-muted)',
                      border: mode === m ? '1px solid rgba(124, 58, 237,0.3)' : '1px solid var(--border)',
                      fontFamily: '"DM Mono", monospace',
                    }}
                  >
                    {m === 'password' ? 'Password' : 'Magic Link'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="input"
                    autoFocus
                  />
                </div>

                {mode === 'password' && (
                  <div>
                    <label className="label" htmlFor="password">Password</label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="input"
                    />
                  </div>
                )}

                {error && (
                  <div style={{ padding: '0.6rem 0.8rem', border: '1px solid #3a1515', background: '#1a0a0a', fontSize: '10px', color: '#f87171', letterSpacing: '0.06em' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.3rem', padding: '0.75rem' }}
                >
                  {loading
                    ? 'Signing in...'
                    : mode === 'password' ? 'Sign In →' : 'Send Magic Link →'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '10px', color: 'var(--ink-muted)' }}>
                No account yet?{' '}
                <Link href="/signup" style={{ color: 'var(--gold-dim)' }}>Create one</Link>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '2.5rem',
                color: 'var(--gold)',
                fontStyle: 'italic',
                marginBottom: '1rem',
              }}>✓</div>
              <div style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '1.1rem',
                fontWeight: 300,
                color: 'var(--ink)',
                letterSpacing: '0.08em',
                marginBottom: '0.5rem',
              }}>
                Check your email
              </div>
              <div style={{ fontSize: '10px', color: 'var(--ink-muted)', lineHeight: 1.8 }}>
                Magic link sent to <span style={{ color: 'var(--ink-dim)' }}>{email}</span><br />
                Click the link to sign in. Expires in 24 hours.
              </div>
              <button
                onClick={() => { setSubmitted(false); setEmail(''); }}
                className="btn"
                style={{ marginTop: '1.5rem' }}
              >
                Try a different email
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '9px', letterSpacing: '0.12em', color: 'var(--ink-muted)' }}>
          Secured by Supabase
        </div>
      </div>
    </div>
  );
}
