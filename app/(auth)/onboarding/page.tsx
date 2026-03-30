'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';

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

  const inputStyle = {
    backgroundColor: '#0D1B3E',
    borderColor: '#1565C0',
    fontFamily: 'Calibri, sans-serif',
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
            Set up your workspace
          </h2>
          <p className="text-sm mb-6" style={{ color: '#7A9CC0' }}>
            Tell us a bit about yourself and your company.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-white mb-1">
                Your name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                required
                autoFocus
                className="w-full px-4 py-2 rounded-lg border text-white placeholder-slate-400 focus:outline-none focus:ring-2"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-white mb-1">
                Your role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="w-full px-4 py-2 rounded-lg border text-white focus:outline-none focus:ring-2"
                style={inputStyle}
              >
                <option value="sales_rep">Sales Representative</option>
                <option value="product_manager">Product Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-white mb-1">
                Company name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                required
                className="w-full px-4 py-2 rounded-lg border text-white placeholder-slate-400 focus:outline-none focus:ring-2"
                style={inputStyle}
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
              disabled={loading || !companyName.trim() || !fullName.trim()}
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
