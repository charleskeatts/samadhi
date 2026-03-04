'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'sales_rep' | 'product_manager'>('sales_rep');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: Math.random().toString(36).slice(2), // Random password (unused — magic link auth)
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
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
                Create your account
              </h2>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-white mb-1">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full px-4 py-2 rounded-lg border text-white placeholder-slate-400 focus:outline-none focus:ring-2"
                    style={{ backgroundColor: '#0D1B3E', borderColor: '#1565C0' }}
                  />
                </div>

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

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-white mb-1">
                    Your role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'sales_rep' | 'product_manager')}
                    className="w-full px-4 py-2 rounded-lg border text-white focus:outline-none focus:ring-2"
                    style={{ backgroundColor: '#0D1B3E', borderColor: '#1565C0' }}
                  >
                    <option value="sales_rep">Sales Representative</option>
                    <option value="product_manager">Product Manager</option>
                  </select>
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
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-sm mt-6" style={{ color: '#7A9CC0' }}>
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium hover:underline"
                  style={{ color: '#1E88E5' }}
                >
                  Sign in
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
                We sent a confirmation link to{' '}
                <span className="font-medium text-white">{email}</span>
              </p>
              <p className="text-xs" style={{ color: '#7A9CC0' }}>
                Click the link to confirm your account and sign in. It expires in 24 hours.
              </p>
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
