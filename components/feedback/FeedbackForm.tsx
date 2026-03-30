/**
 * Feedback submission form component
 * Captures account, ARR, and raw feedback text
 * Submits to /api/feedback endpoint
 */

'use client';

import { useState } from 'react';

interface FeedbackFormProps {
  onSuccess?: () => void;
}

export default function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const [accountName, setAccountName] = useState('');
  const [arr, setArr] = useState('');
  const [rawText, setRawText] = useState('');
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
          raw_text: rawText.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSuccess(true);
      setAccountName('');
      setArr('');
      setRawText('');

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
        <div style={{ fontSize: '11px', color: 'var(--ink-dim)', letterSpacing: '0.08em' }}>Feedback logged</div>
        <div style={{ fontSize: '10px', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>AI is classifying and analyzing...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{
        fontFamily: '"Cormorant Garamond", serif',
        fontSize: '1rem',
        fontWeight: 300,
        color: 'var(--ink)',
        letterSpacing: '0.06em',
        marginBottom: '0.25rem',
      }}>
        Log Feedback
      </div>

      {error && (
        <div style={{ padding: '0.6rem 0.8rem', border: '1px solid #5a2020', background: '#120808', fontSize: '10px', color: '#ee8870', letterSpacing: '0.06em' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="accountName" className="label">Account Name</label>
          <input
            id="accountName"
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Acme Corp"
            required
            className="input"
          />
        </div>
        <div>
          <label htmlFor="arr" className="label">Annual Revenue ($)</label>
          <input
            id="arr"
            type="number"
            value={arr}
            onChange={(e) => setArr(e.target.value)}
            placeholder="50000"
            required
            className="input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="rawText" className="label">What did the customer say?</label>
        <textarea
          id="rawText"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste the customer feedback here... (notes from call, Slack message, etc.)"
          required
          rows={5}
          className="input"
          style={{ resize: 'none' }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{ alignSelf: 'flex-start', padding: '0.65rem 1.4rem', opacity: loading ? 0.5 : 1 }}
      >
        {loading ? 'Submitting...' : 'Submit Feedback →'}
      </button>
    </form>
  );
}
