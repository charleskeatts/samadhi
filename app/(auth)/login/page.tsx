'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #1565C0 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-10 h-10" style={{ color: '#F0A500' }} />
            <h1
              className="text-3xl font-bold text-white"
              style={{ fontFamily: 'Trebuchet MS, sans-serif' }}
            >
              Clairio
            </h1>
          </div>
          <p style={{ color: '#CADCFC' }} className="font-medium">
            Revenue-weighted product intelligence
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl shadow-2xl p-8 border"
          style={{ backgroundColor: '#0A1628', borderColor: '#1565C0' }}
        >
          {!submitted ? (
            <>
              <h2
                className="text-xl font-semibold text-white mb-6"
                style={{ fontFamily: 'Trebuchet MS, sans-serif' }}
              >
                Sign in to your account
              </h2>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-2 rounded-lg border text-white placeholder-slate-400 focus:outline-none focus:ring-2"
                    style={{ backgroundColor: '#0D1B3E', borderColor: '#1565C0' }}
                  />
                </div>

                {error && (
                  <div
                    className="p-3 rounded-lg text-sm"
                    style={{ backgroundColor: '#3B0000', color: '#FCA5A5' }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#1565C0', fontFamily: 'Trebuchet MS, sans-serif' }}
                >
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>

              <p className="text-center text-sm mt-6" style={{ color: '#7A9CC0' }}>
                New to Clairio?{' '}
                <Link
                  href="/signup"
                  className="font-medium hover:underline"
                  style={{ color: '#1E88E5' }}
                >
                  Create account
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#00897B' }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3
                className="text-lg font-semibold text-white mb-2"
                style={{ fontFamily: 'Trebuchet MS, sans-serif' }}
              >
                Check your email
              </h3>
              <p className="text-sm mb-4" style={{ color: '#7A9CC0' }}>
                We sent a magic link to{' '}
                <span className="font-medium text-white">{email}</span>
              </p>
              <p className="text-xs" style={{ color: '#7A9CC0' }}>
                Click the link to sign in. It expires in 24 hours.
              </p>
              <button
                onClick={() => { setSubmitted(false); setEmail(''); }}
                className="mt-6 text-sm font-medium hover:underline"
                style={{ color: '#1E88E5' }}
              >
                Try a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#7A9CC0' }}>
          Secured by Supabase · Passwordless sign-in
        </p>
      </div>
    </div>
  );
}
