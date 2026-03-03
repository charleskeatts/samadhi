/**
 * Feedback submission form component
 * Captures account, ARR, and raw feedback text
 * Submits to /api/feedback endpoint
 */

'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

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

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card border-2 border-green-200 bg-green-50">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Feedback logged!</p>
            <p className="text-sm text-green-700">AI is classifying and analyzing...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Log Feedback</h2>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="accountName" className="label">
            Account Name
          </label>
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
          <label htmlFor="arr" className="label">
            Annual Revenue ($)
          </label>
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
        <label htmlFor="rawText" className="label">
          What did the customer say?
        </label>
        <textarea
          id="rawText"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste the customer feedback here... (notes from call, Slack message, etc.)"
          required
          rows={5}
          className="input resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn btn-primary bg-sky-500 hover:bg-sky-600 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
}
