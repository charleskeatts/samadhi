/**
 * Feedback table component
 * Displays all feedback with sorting and status filters
 */

'use client';

import { useState } from 'react';
import { FeedbackWithAccount, FeedbackStatus } from '@/types';
import { formatARR, timeAgo, capitalize } from '@/lib/utils';
import FeedbackForm from './FeedbackForm';

interface FeedbackTableProps {
  initialData: FeedbackWithAccount[];
}

export default function FeedbackTable({ initialData }: FeedbackTableProps) {
  const [feedback, setFeedback] = useState<FeedbackWithAccount[]>(initialData);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setFeedback(feedback.map((f) => f.id === id ? { ...f, status: newStatus } : f));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Log feedback toggle */}
      <div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={showForm ? 'btn' : 'btn btn-primary'}
          style={{ fontSize: '9px' }}
        >
          {showForm ? 'Cancel' : 'Log Feedback →'}
        </button>
      </div>

      {showForm && (
        <FeedbackForm onSuccess={() => {
          setShowForm(false);
          window.location.reload();
        }} />
      )}

      {/* Table */}
      <div style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Account</th>
              <th>Feedback</th>
              <th>Category</th>
              <th>Sentiment</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>ARR</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {feedback.length > 0 ? (
              feedback.map((item) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--ink-dim)', fontSize: '12px' }}>
                    {(item.account as any)?.name || 'Unknown'}
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--ink-muted)' }}>
                      {item.raw_text}
                    </span>
                  </td>
                  <td>
                    <span className="chip" style={{ fontSize: '8px', color: 'var(--gold-dim)', borderColor: 'rgba(200,152,43,0.35)' }}>
                      {item.category}
                    </span>
                  </td>
                  <td>
                    <span className="chip" style={{
                      fontSize: '8px',
                      color: item.sentiment === 'positive' ? 'var(--green)' : item.sentiment === 'negative' ? 'var(--red)' : 'var(--border-bright)',
                      borderColor: item.sentiment === 'positive' ? 'rgba(74,170,106,0.3)' : item.sentiment === 'negative' ? 'rgba(204,85,72,0.3)' : 'var(--border)',
                    }}>
                      {capitalize(item.sentiment)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: 3,
                            height: 14,
                            background: i < item.urgency_score
                              ? item.urgency_score >= 8 ? 'var(--red)' : item.urgency_score >= 5 ? 'var(--gold)' : 'var(--green)'
                              : 'var(--border)',
                          }}
                        />
                      ))}
                    </div>
                  </td>
                  <td>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as FeedbackStatus)}
                      disabled={updatingId === item.id}
                      className="input"
                      style={{ fontSize: '10px', padding: '0.25rem 0.5rem', width: 'auto' }}
                    >
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="in_roadmap">In Roadmap</option>
                      <option value="shipped">Shipped</option>
                    </select>
                  </td>
                  <td style={{ color: 'var(--green)', fontFamily: '"DM Mono", monospace', fontSize: '11px' }}>
                    {formatARR(item.revenue_weight)}
                  </td>
                  <td style={{ fontSize: '10px', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                    {timeAgo(item.created_at)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.12em' }}>
                  No feedback yet — click &ldquo;Log Feedback&rdquo; to add your first entry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
