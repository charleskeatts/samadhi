/**
 * Feedback page
 * Since the "feedback" table does not exist in the actual DB schema,
 * this page shows feature requests as the primary customer signal input.
 * The form submits directly to feature_requests.
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FeatureRequestWithAccount } from '@/types';
import { formatARR, timeAgo } from '@/lib/utils';

export default function FeedbackPage() {
  const [features, setFeatures] = useState<FeatureRequestWithAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchData = async () => {
      try {
        const { data } = await supabase
          .from('feature_requests')
          .select('*, accounts:account_id (id, name, arr)')
          .order('created_at', { ascending: false });

        setFeatures((data as FeatureRequestWithAccount[]) || []);
      } catch (error) {
        console.error('Error fetching feature requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <div>
        <h1 className="page-title">Customer Signals</h1>
        <p className="page-subtitle">Feature requests captured from sales conversations</p>
      </div>

      {/* Table */}
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
                      <span className="chip" style={{ fontSize: '8px', color: 'var(--gold-dim)', borderColor: 'rgba(200,152,43,0.35)' }}>
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span className="chip" style={{ fontSize: '8px' }}>
                        {item.deal_stage ?? 'discovery'}
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
                  No feature requests yet. Data will appear here once submitted.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
