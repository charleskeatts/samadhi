'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'sales_rep' | 'product_manager'>('sales_rep');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: Math.random().toString(36).slice(2),
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (signUpError) throw signUpError;

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
            CL<span style={{ color: 'var(--gold)' }}>A</span>IRIO
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
                marginBottom: '0.25rem',
              }}>
                Create account
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '1.8rem' }}>
                Passwordless · Magic link sent to your email
              </div>

              <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="label" htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="input"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label" htmlFor="email">Work email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="role">Your role</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'sales_rep' | 'product_manager')}
                    className="input"
                  >
                    <option value="sales_rep">Sales Representative</option>
                    <option value="product_manager">Product Manager</option>
                  </select>
                </div>

                {error && (
                  <div style={{ padding: '0.6rem 0.8rem', border: '1px solid #5a2020', background: '#120808', fontSize: '10px', color: '#ee8870', letterSpacing: '0.06em' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.3rem', padding: '0.75rem' }}
                >
                  {loading ? 'Creating account...' : 'Create Account →'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '10px', color: 'var(--ink-muted)' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: 'var(--gold-dim)' }}>Sign in</Link>
                {' · '}
                <Link href="/demo" style={{ color: 'var(--gold-dim)' }}>Try demo</Link>
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
                Confirmation link sent to <span style={{ color: 'var(--ink-dim)' }}>{email}</span><br />
                Click the link to activate your account. Expires in 24 hours.
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
          Secured by Supabase · Passwordless sign-in
        </div>
      </div>
    </div>
  );
}
