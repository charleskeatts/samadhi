'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';

export default function OnboardingPage() {
  const [companyName, setCompanyName] = useState('');
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
        body: JSON.stringify({ company_name: companyName.trim() }),
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
            One last step — set up your workspace
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl shadow-2xl p-8 border"
          style={{ backgroundColor: '#0A1628', borderColor: '#1565C0' }}
        >
          <h2
            className="text-xl font-semibold text-white mb-2"
            style={{ fontFamily: 'Trebuchet MS, sans-serif' }}
          >
            What&apos;s your company called?
          </h2>
          <p className="text-sm mb-6" style={{ color: '#7A9CC0' }}>
            This creates your Clairio workspace.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-white mb-1"
              >
                Company name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                required
                autoFocus
                className="w-full px-4 py-2 rounded-lg border text-white placeholder-slate-400 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: '#0D1B3E',
                  borderColor: '#1565C0',
                  fontFamily: 'Calibri, sans-serif',
                }}
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
              disabled={loading || !companyName.trim()}
              className="w-full py-2 px-4 rounded-lg font-semibold text-white transition-opacity disabled:opacity-50"
              style={{
                backgroundColor: '#1565C0',
                fontFamily: 'Trebuchet MS, sans-serif',
              }}
            >
              {loading ? 'Setting up your workspace...' : 'Get Started →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
