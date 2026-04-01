'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'sales_rep' | 'product_manager' | 'admin'>('sales_rep');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim(),
          full_name: fullName.trim(),
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
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
            One last step — set up your workspace
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
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1.2rem',
            fontWeight: 300,
            color: 'var(--ink)',
            letterSpacing: '0.08em',
            marginBottom: '0.25rem',
          }}>
            Set up your workspace
          </div>
          <div style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '1.8rem' }}>
            Tell us about yourself and your company
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label" htmlFor="fullName">Your name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                required
                autoFocus
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="role">Your role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="input"
              >
                <option value="sales_rep">Sales Representative</option>
                <option value="product_manager">Product Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="companyName">Company name</label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                required
                className="input"
              />
            </div>

            {error && (
              <div style={{ padding: '0.6rem 0.8rem', border: '1px solid #3a1515', background: '#1a0a0a', fontSize: '10px', color: '#f87171', letterSpacing: '0.06em' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !companyName.trim() || !fullName.trim()}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.3rem', padding: '0.75rem' }}
            >
              {loading ? 'Setting up workspace...' : 'Get Started →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
