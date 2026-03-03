'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
      // Sign up user
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: Math.random().toString(36).slice(2), // Random password (won't be used with magic link)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-10 h-10 text-sky-400" />
            <h1 className="text-3xl font-bold text-white">Samadhi</h1>
          </div>
          <p className="text-sky-200 font-medium">Sales-to-Product Intelligence</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
          {!submitted ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">
                Create your account
              </h2>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="label text-white">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="input bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="label text-white">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="input bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="label text-white">
                    Your role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'sales_rep' | 'product_manager')}
                    className="input bg-slate-700 border-slate-600 text-white focus:ring-sky-400"
                  >
                    <option value="sales_rep">Sales Representative</option>
                    <option value="product_manager">Product Manager</option>
                  </select>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-900 border border-red-700 text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed bg-sky-500 hover:bg-sky-600"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-slate-400 text-sm mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Check your email</h3>
              <p className="text-slate-400 mb-4">
                We sent a confirmation link to <span className="font-medium text-white">{email}</span>
              </p>
              <p className="text-sm text-slate-500">
                Click the link in your email to confirm your account and sign in. The link will expire in 24 hours.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
