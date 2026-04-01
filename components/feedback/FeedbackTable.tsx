'use client';

import { useState } from 'react';
import { formatARR, timeAgo } from '@/lib/utils';
import FeedbackForm from './FeedbackForm';

interface FeatureRow {
  id: string;
  feature_name: string;
  category: string | null;
  deal_stage: string;
  blocker_score: number;
  notes: string | null;
  created_at: string;
  accounts?: { name: string; arr: number } | null;
}

const STAGE_COLOR: Record<string, string> = {
  backlog: 'var(--border-bright)', planned: '#3a7bd5', in_progress: 'var(--gold-dim)', shipped: 'var(--green)',
};
const BLOCKER_COLOR: Record<number, string> = {
  5: 'var(--red)', 4: 'var(--orange)', 3: 'var(--gold)', 2: 'var(--green)', 1: 'var(--border-bright)',
};
const BLOCKER_LABEL: Record<number, string> = {
  5: 'Critical', 4: 'High', 3: 'Medium', 2: 'Low', 1: 'Minimal',
};

export default function FeatureRequestTable({ initialData }: { initialData: FeatureRow[] }) {
  const [features, setFeatures] = useState<FeatureRow[]>(initialData);
  const [showForm, setShowForm] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStageChange = async (id: string, newStage: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal_stage: newStage }),
      });
      if (res.ok) {
        setFeatures(features.map((f) => f.id === id ? { ...f, deal_stage: newStage } : f));
      }
    } catch (e) {
      console.error('Failed to update stage:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div>
        <button onClick={() => setShowForm(!showForm)}
          className={showForm ? 'btn' : 'btn btn-primary'} style={{ fontSize: '9px' }}>
          {showForm ? 'Cancel' : 'Log Feature Request →'}
        </button>
      </div>

      {showForm && (
        <FeedbackForm onSuccess={() => { setShowForm(false); window.location.reload(); }} />
      )}

      <div style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Account</th>
              <th>Feature</th>
              <th>Category</th>
              <th>Blocker</th>
              <th>Stage</th>
              <th>ARR</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {features.length > 0 ? (
              features.map((item) => {
                const score = item.blocker_score ?? 3;
                const blockerColor = BLOCKER_COLOR[score] || 'var(--border-bright)';
                return (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--ink-dim)', fontSize: '12px' }}>
                      {item.accounts?.name || 'Unknown'}
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--ink-muted)' }}>
                        {item.feature_name}
                      </span>
                    </td>
                    <td>
                      {item.category && (
                        <span className="chip" style={{ fontSize: '8px', color: 'var(--gold-dim)', borderColor: 'rgba(200,152,43,0.35)' }}>
                          {item.category}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="chip" style={{ fontSize: '8px', color: blockerColor, borderColor: blockerColor }}>
                        {BLOCKER_LABEL[score] || score}
                      </span>
                    </td>
                    <td>
                      <select
                        value={item.deal_stage}
                        onChange={(e) => handleStageChange(item.id, e.target.value)}
                        disabled={updatingId === item.id}
                        className="input"
                        style={{ fontSize: '10px', padding: '0.25rem 0.5rem', width: 'auto',
                          color: STAGE_COLOR[item.deal_stage] || 'var(--ink-muted)' }}
                      >
                        <option value="backlog">Backlog</option>
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="shipped">Shipped</option>
                      </select>
                    </td>
                    <td style={{ color: 'var(--green)', fontFamily: '"DM Mono", monospace', fontSize: '11px' }}>
                      {item.accounts?.arr ? formatARR(item.accounts.arr) : '—'}
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
                  No feature requests yet — click &ldquo;Log Feature Request&rdquo; to add the first entry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
