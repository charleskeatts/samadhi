'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type DemoStage = 'idle' | 'creating' | 'signing-in' | 'ready' | 'error';

export default function DemoPage() {
  const [stage, setStage] = useState<DemoStage>('idle');
  const [error, setError] = useState('');
  const router = useRouter();

  const stageLabels: Record<DemoStage, string> = {
    idle: 'Explore Demo →',
    creating: 'Creating workspace...',
    'signing-in': 'Signing you in...',
    ready: 'Redirecting...',
    error: 'Try Again →',
  };

  const handleLaunchDemo = async () => {
    setError('');
    setStage('creating');

    try {
      // 1. Create demo user + org + seed data on the server
      const res = await fetch('/api/demo', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create demo environment');
      }

      // 2. Sign in with the returned credentials
      setStage('signing-in');
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      // 3. Redirect to dashboard
      setStage('ready');
      router.push('/dashboard');
    } catch (err) {
      console.error('[demo] launch failed:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStage('error');
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
      <div style={{ width: '100%', maxWidth: 440 }}>

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
          padding: '2.4rem',
        }}>
          <div style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1.3rem',
            fontWeight: 300,
            color: 'var(--ink)',
            letterSpacing: '0.08em',
            marginBottom: '0.3rem',
          }}>
            Try the Demo
          </div>
          <div style={{
            fontSize: '9px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
            marginBottom: '1.6rem',
          }}>
            No signup required · Pre-loaded with sample data
          </div>

          {/* Description */}
          <div style={{
            fontSize: '12px',
            color: 'var(--ink-dim)',
            lineHeight: 1.7,
            marginBottom: '1.8rem',
          }}>
            Instantly create a demo workspace with realistic feedback data from
            5 accounts representing $600K+ in ARR. Explore the dashboard,
            review revenue-weighted features, and see AI-powered insights in action.
          </div>

          {/* What's included */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.6rem',
            marginBottom: '1.8rem',
          }}>
            {[
              '5 demo accounts',
              '10 feature requests',
              'Blocker scoring',
              'Revenue rankings',
            ].map((item) => (
              <div
                key={item}
                style={{
                  fontSize: '10px',
                  color: 'var(--ink-muted)',
                  letterSpacing: '0.06em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span style={{ color: 'var(--gold-dim)', fontSize: '9px' }}>✦</span>
                {item}
              </div>
            ))}
          </div>

          {/* Launch button */}
          <button
            onClick={handleLaunchDemo}
            disabled={stage === 'creating' || stage === 'signing-in' || stage === 'ready'}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '11px',
              position: 'relative',
            }}
          >
            {stageLabels[stage]}
          </button>

          {/* Progress indicator */}
          {(stage === 'creating' || stage === 'signing-in') && (
            <div style={{
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
            }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: stage === 'creating' ? 'var(--gold)' : 'var(--green)',
                animation: 'blink 1.2s ease-in-out infinite',
              }} />
              <span style={{
                fontSize: '9px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--ink-muted)',
              }}>
                {stage === 'creating' ? 'Setting up your demo workspace...' : 'Almost there...'}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.6rem 0.8rem',
              border: '1px solid #3a1515',
              background: '#1a0a0a',
              fontSize: '10px',
              color: '#f87171',
              letterSpacing: '0.06em',
            }}>
              {error}
            </div>
          )}

          {/* Separator */}
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.6rem 0' }} />

          {/* Existing account link */}
          <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--ink-muted)' }}>
            Have an account?{' '}
            <Link href="/login" style={{ color: 'var(--gold-dim)' }}>Sign in</Link>
            {' · '}
            <Link href="/signup" style={{ color: 'var(--gold-dim)' }}>Create account</Link>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.2rem',
          fontSize: '9px',
          letterSpacing: '0.12em',
          color: 'var(--ink-muted)',
        }}>
          Demo data resets periodically · Not for production use
        </div>
      </div>
    </div>
  );
}
