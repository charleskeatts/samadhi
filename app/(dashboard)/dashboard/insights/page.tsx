/**
 * AI Insights page
 * Shows feature requests ranked by blocker score and account ARR.
 * Uses actual DB schema: feature_requests joined with accounts.
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FeatureRequestWithAccount } from '@/types';
import { formatARR } from '@/lib/utils';

export default function InsightsPage() {
  const [features, setFeatures] = useState<FeatureRequestWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRequestWithAccount | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const fetchFeatures = async () => {
      try {
        const { data } = await supabase
          .from('feature_requests')
          .select('*, accounts:account_id (id, name, arr)')
          .order('blocker_score', { ascending: false });

        setFeatures((data as FeatureRequestWithAccount[]) || []);
      } catch (error) {
        console.error('Error fetching features:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  const getARR = (f: FeatureRequestWithAccount) => f.accounts?.arr ?? 0;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-muted)', fontSize: '11px', letterSpacing: '0.12em' }}>
        Loading insights...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 className="page-title">AI Insights</h1>
        <p className="page-subtitle">Feature requests ranked by blocker severity and account revenue</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Features list */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '2px solid var(--gold-dim)' }}>
          <div style={{
            padding: '0.85rem 1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
              Features
            </span>
            <span style={{ fontSize: '9px', color: 'var(--border-bright)', letterSpacing: '0.08em' }}>
              {features.length}
            </span>
          </div>
          <div style={{ maxHeight: '28rem', overflowY: 'auto' }}>
            {features.length > 0 ? (
              features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => setSelectedFeature(feature)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.85rem 1rem',
                    borderBottom: '1px solid var(--border)',
                    background: selectedFeature?.id === feature.id ? 'rgba(232,184,75,0.06)' : 'transparent',
                    borderLeft: selectedFeature?.id === feature.id ? '2px solid var(--gold)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedFeature?.id !== feature.id) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedFeature?.id !== feature.id) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }
                  }}
                >
                  <p style={{ fontSize: '12px', color: 'var(--ink-dim)', lineHeight: 1.4, marginBottom: '0.35rem' }}>
                    {feature.feature_name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '10px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                      {formatARR(getARR(feature))}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--ink-muted)', letterSpacing: '0.06em' }}>
                      {feature.accounts?.name ?? 'Unknown'}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                  No features yet
                </p>
                <p style={{ fontSize: '10px', color: 'var(--border-bright)', lineHeight: 1.6, marginBottom: '1rem' }}>
                  Feature requests will appear here once data is submitted.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Feature detail */}
        <div>
          {selectedFeature ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card">
                <div style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: '1.3rem',
                  fontWeight: 300,
                  color: 'var(--ink)',
                  letterSpacing: '0.04em',
                  marginBottom: '0.75rem',
                }}>
                  {selectedFeature.feature_name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '11px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                    {formatARR(getARR(selectedFeature))} ARR
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--ink-muted)', letterSpacing: '0.08em' }}>
                    {selectedFeature.accounts?.name ?? 'Unknown'}
                  </span>
                  <span className="chip">
                    {selectedFeature.deal_stage ?? 'backlog'}
                  </span>
                  {selectedFeature.category && (
                    <span className="chip" style={{ color: 'var(--gold-dim)', borderColor: 'rgba(200,152,43,0.35)' }}>
                      {selectedFeature.category}
                    </span>
                  )}
                </div>

                {selectedFeature.notes && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '8px', color: 'var(--ink-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Notes
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {selectedFeature.notes}
                    </p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '8px', color: 'var(--ink-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                      Blocker Score
                    </div>
                    <div style={{ fontSize: '18px', color: selectedFeature.blocker_score >= 4 ? 'var(--red)' : 'var(--gold)', fontFamily: '"DM Mono", monospace' }}>
                      {selectedFeature.blocker_score}/5
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '8px', color: 'var(--ink-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                      Confidence
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-dim)' }}>
                      {selectedFeature.confidence != null ? `${selectedFeature.confidence}/5` : 'Not rated'}
                    </div>
                    {selectedFeature.confidence_note && (
                      <div style={{ fontSize: '10px', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                        {selectedFeature.confidence_note}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '8px', color: 'var(--ink-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                      Source
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-dim)' }}>
                      {selectedFeature.source ?? 'Manual'}
                    </div>
                    {selectedFeature.submitted_by && (
                      <div style={{ fontSize: '10px', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                        by {selectedFeature.submitted_by}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '9px', color: 'var(--border-bright)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Select a feature to view details
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
