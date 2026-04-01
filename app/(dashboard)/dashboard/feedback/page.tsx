/**
 * Customer Signals page
 * Shows all feature requests + forms to add new feature requests & accounts.
 *
 * VALID ENUMS:
 *   category:   Integration | Analytics | Security | Performance
 *   deal_stage: Prospect | Qualified | Negotiation
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { FeatureRequestWithAccount } from '@/types';
import { formatARR, timeAgo } from '@/lib/utils';

const CATEGORIES = ['Integration', 'Analytics', 'Security', 'Performance'] as const;
const DEAL_STAGES = ['Prospect', 'Qualified', 'Negotiation'] as const;

type Account = { id: string; name: string; arr: number };

export default function FeedbackPage() {
  const [features, setFeatures] = useState<FeatureRequestWithAccount[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Feature request form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    account_id: '',
    feature_name: '',
    category: 'Integration' as string,
    deal_stage: 'Prospect' as string,
    notes: '',
    blocker_score: 3,
    source: 'manual',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // New account form
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountARR, setNewAccountARR] = useState('');
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [accountError, setAccountError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [featuresRes, accountsRes] = await Promise.all([
        fetch('/api/features').then(r => r.json()),
        fetch('/api/accounts').then(r => r.json()),
      ]);

      setFeatures(Array.isArray(featuresRes) ? featuresRes : []);
      setAccounts(Array.isArray(accountsRes) ? accountsRes : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create feature request');
      }

      // Reset form and refresh
      setFormData({
        account_id: '',
        feature_name: '',
        category: 'Integration',
        deal_stage: 'Prospect',
        notes: '',
        blocker_score: 3,
        source: 'manual',
      });
      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountSubmitting(true);
    setAccountError('');

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAccountName.trim(),
          arr: parseFloat(newAccountARR) || 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create account');
      }

      const newAccount = await res.json();
      setAccounts((prev) => [newAccount, ...prev]);
      setNewAccountName('');
      setNewAccountARR('');
      setShowAccountForm(false);
      // Auto-select the new account in the feature form
      setFormData((prev) => ({ ...prev, account_id: newAccount.id }));
    } catch (err: any) {
      setAccountError(err.message);
    } finally {
      setAccountSubmitting(false);
    }
  };

  const getARR = (f: FeatureRequestWithAccount) => f.accounts?.arr ?? 0;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-muted)', fontSize: '11px', letterSpacing: '0.12em' }}>
        Loading signals...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Customer Signals</h1>
          <p className="page-subtitle">Feature requests captured from sales conversations</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => { setShowAccountForm(!showAccountForm); setShowForm(false); }}
            className="btn"
            style={{ fontSize: '9px' }}
          >
            + Account
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowAccountForm(false); }}
            className="btn btn-primary"
            style={{ fontSize: '9px' }}
          >
            + Feature Request
          </button>
        </div>
      </div>

      {/* New Account Form */}
      {showAccountForm && (
        <div className="card" style={{ padding: '1.4rem 1.6rem' }}>
          <div style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1rem',
            fontWeight: 300,
            color: 'var(--ink)',
            letterSpacing: '0.06em',
            marginBottom: '1.2rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border)',
          }}>
            New Account
          </div>
          <form onSubmit={handleSubmitAccount} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="label">Company Name</label>
              <input
                className="input"
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g. Acme Corp"
                required
              />
            </div>
            <div style={{ width: '160px' }}>
              <label className="label">ARR ($)</label>
              <input
                className="input"
                type="number"
                value={newAccountARR}
                onChange={(e) => setNewAccountARR(e.target.value)}
                placeholder="e.g. 120000"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={accountSubmitting} className="btn btn-primary" style={{ fontSize: '9px', opacity: accountSubmitting ? 0.5 : 1 }}>
                {accountSubmitting ? 'Creating...' : 'Create Account'}
              </button>
              <button type="button" onClick={() => setShowAccountForm(false)} className="btn" style={{ fontSize: '9px' }}>
                Cancel
              </button>
            </div>
          </form>
          {accountError && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', border: '1px solid #3a1515', background: '#1a0a0a', fontSize: '10px', color: '#f87171', letterSpacing: '0.06em' }}>
              {accountError}
            </div>
          )}
        </div>
      )}

      {/* New Feature Request Form */}
      {showForm && (
        <div className="card" style={{ padding: '1.4rem 1.6rem' }}>
          <div style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1rem',
            fontWeight: 300,
            color: 'var(--ink)',
            letterSpacing: '0.06em',
            marginBottom: '1.2rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border)',
          }}>
            New Feature Request
          </div>
          <form onSubmit={handleSubmitFeature} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Account</label>
                <select
                  className="input"
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  required
                >
                  <option value="">Select account...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatARR(acc.arr)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Feature Name</label>
                <input
                  className="input"
                  type="text"
                  value={formData.feature_name}
                  onChange={(e) => setFormData({ ...formData, feature_name: e.target.value })}
                  placeholder="e.g. Salesforce Integration"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Deal Stage</label>
                <select
                  className="input"
                  value={formData.deal_stage}
                  onChange={(e) => setFormData({ ...formData, deal_stage: e.target.value })}
                >
                  {DEAL_STAGES.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Blocker Score (1-5)</label>
                <select
                  className="input"
                  value={formData.blocker_score}
                  onChange={(e) => setFormData({ ...formData, blocker_score: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} — {n === 1 ? 'Nice-to-have' : n === 2 ? 'Low impact' : n === 3 ? 'Moderate' : n === 4 ? 'Important' : 'Deal breaker'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Context from the sales conversation..."
                rows={3}
                style={{ resize: 'vertical', minHeight: '70px' }}
              />
            </div>

            {formError && (
              <div style={{ padding: '0.6rem 0.8rem', border: '1px solid #3a1515', background: '#1a0a0a', fontSize: '10px', color: '#f87171', letterSpacing: '0.06em' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.25rem' }}>
              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ fontSize: '9px', opacity: submitting ? 0.5 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit Feature Request'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn" style={{ fontSize: '9px' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feature Requests Table */}
      <div style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Account</th>
              <th>Feature</th>
              <th>Category</th>
              <th>Deal Stage</th>
              <th>Blocker</th>
              <th>ARR</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {features.length > 0 ? (
              features.map((item) => {
                const score = item.blocker_score ?? 3;
                const blockerColor = score >= 5 ? 'var(--red)' : score >= 4 ? 'var(--orange)' : score >= 3 ? 'var(--gold)' : 'var(--green)';
                return (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--ink-dim)', fontSize: '12px' }}>
                      {item.accounts?.name || 'Unknown'}
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--ink-muted)' }}>
                        {item.feature_name}
                      </span>
                      {item.notes && (
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10px', color: 'var(--border-bright)', marginTop: '2px' }}>
                          {item.notes}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="chip" style={{ fontSize: '8px', color: 'var(--accent)', borderColor: 'rgba(56,189,248,0.35)' }}>
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span className="chip" style={{ fontSize: '8px' }}>
                        {item.deal_stage ?? 'Prospect'}
                      </span>
                    </td>
                    <td>
                      <span className="chip" style={{ fontSize: '8px', color: blockerColor, borderColor: blockerColor }}>
                        {score}/5
                      </span>
                    </td>
                    <td style={{ color: 'var(--green)', fontFamily: '"DM Mono", monospace', fontSize: '11px' }}>
                      {formatARR(getARR(item))}
                    </td>
                    <td style={{ fontSize: '10px', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                      {timeAgo(item.created_at)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.12em' }}>
                  No feature requests yet. Click &ldquo;+ Feature Request&rdquo; to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
