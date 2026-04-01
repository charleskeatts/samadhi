'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'sales_rep' | 'product_manager'>('sales_rep');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });

      if (signUpError) throw signUpError;

      // Sign them in immediately after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;

      router.push('/onboarding');
      router.refresh();
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
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '2.4rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            lineHeight: 1,
          }}>
            Cl<span style={{ color: 'var(--teal)', fontStyle: 'italic' }}>ai</span>rio
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
          <div style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
            marginBottom: '0.25rem',
          }}>
            Create account
          </div>
          <div style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '1.8rem' }}>
            No email confirmation required
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
              <label className="label" htmlFor="email">Email</label>
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
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
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
              <div style={{ padding: '0.6rem 0.8rem', border: '1px solid rgba(201,64,64,0.3)', background: 'rgba(201,64,64,0.06)', fontSize: '10px', color: 'var(--red)', letterSpacing: '0.06em' }}>
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
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '9px', letterSpacing: '0.12em', color: 'var(--ink-muted)' }}>
          Secured by Supabase
        </div>
      </div>
    </div>
  );
}
