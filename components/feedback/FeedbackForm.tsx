'use client';

import { useState } from 'react';

interface FeedbackFormProps {
  onSuccess?: () => void;
}

export default function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const [accountName, setAccountName] = useState('');
  const [arr, setArr] = useState('');
  const [featureName, setFeatureName] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [blockerScore, setBlockerScore] = useState('3');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_name: accountName.trim(),
          arr: parseFloat(arr) || 0,
          feature_name: featureName.trim(),
          notes: notes.trim(),
          category: category || undefined,
          blocker_score: parseInt(blockerScore) || 3,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setSuccess(true);
      setAccountName(''); setArr(''); setFeatureName(''); setNotes(''); setCategory(''); setBlockerScore('3');

      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card" style={{ borderTop: '2px solid var(--green)', textAlign: 'center', padding: '1.5rem' }}>
        <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', color: 'var(--green)', marginBottom: '0.5rem' }}>✓</div>
        <div style={{ fontSize: '11px', color: 'var(--ink-dim)', letterSpacing: '0.08em' }}>Feature request logged</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', fontWeight: 300, color: 'var(--ink)', letterSpacing: '0.06em' }}>
        Log Feature Request
      </div>

      {error && (
        <div style={{ padding: '0.6rem 0.8rem', border: '1px solid #5a2020', background: '#120808', fontSize: '10px', color: '#ee8870', letterSpacing: '0.06em' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label className="label" htmlFor="accountName">Account Name</label>
          <input id="accountName" type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)}
            placeholder="Acme Corp" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="arr">Account ARR ($)</label>
          <input id="arr" type="number" value={arr} onChange={(e) => setArr(e.target.value)}
            placeholder="120000" required className="input" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="featureName">Feature Requested</label>
        <input id="featureName" type="text" value={featureName} onChange={(e) => setFeatureName(e.target.value)}
          placeholder="e.g. Salesforce Integration" required className="input" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            <option value="">Select...</option>
            <option value="Integration">Integration</option>
            <option value="Analytics">Analytics</option>
            <option value="Core Product">Core Product</option>
            <option value="Performance">Performance</option>
            <option value="UX">UX</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="blockerScore">Deal Blocker (1–5)</label>
          <select id="blockerScore" value={blockerScore} onChange={(e) => setBlockerScore(e.target.value)} className="input">
            <option value="5">5 — Critical blocker</option>
            <option value="4">4 — High priority</option>
            <option value="3">3 — Medium</option>
            <option value="2">2 — Low</option>
            <option value="1">1 — Nice to have</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="notes">Notes from call / email</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="What exactly did the customer say? Paste verbatim if possible."
          required rows={4} className="input" style={{ resize: 'none' }} />
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary"
        style={{ alignSelf: 'flex-start', padding: '0.65rem 1.4rem', opacity: loading ? 0.5 : 1 }}>
        {loading ? 'Submitting...' : 'Submit →'}
      </button>
    </form>
  );
}
