/**
 * AI Insights page
 * Shows consolidated feature requests ranked by revenue impact
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FeatureRequest } from '@/types';
import { formatARR } from '@/lib/utils';

export default function InsightsPage() {
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRequest | null>(null);
  const [generatingBrief, setGeneratingBrief] = useState<string | null>(null);
  const [briefError, setBriefError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const fetchFeatures = async () => {
      try {
        const { data } = await supabase
          .from('feature_requests')
          .select('*')
          .order('total_revenue_weight', { ascending: false });

        setFeatures(data || []);
      } catch (error) {
        console.error('Error fetching features:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  const handleGenerateBrief = async (featureId: string) => {
    setGeneratingBrief(featureId);
    setBriefError(null);
    try {
      const feature = features.find((f) => f.id === featureId);
      if (!feature) return;

      const response = await fetch('/api/ai/roadmap-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_request_id: featureId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${response.status})`);
      }

      const brief = await response.json();
      setSelectedFeature({
        ...feature,
        description: `${feature.description}\n\n## Roadmap Brief\n\n${brief.one_pager_md}`,
      });
    } catch (error) {
      setBriefError(error instanceof Error ? error.message : 'Failed to generate brief. Please try again.');
    } finally {
      setGeneratingBrief(null);
    }
  };

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
        <p className="page-subtitle">Feature requests consolidated and ranked by revenue impact</p>
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
                    {feature.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '10px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                      {formatARR(feature.total_revenue_weight)}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--ink-muted)', letterSpacing: '0.06em' }}>
                      {feature.account_count} account{feature.account_count !== 1 ? 's' : ''}
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
                  AI consolidates feedback into features overnight. Add feedback first.
                </p>
                <a href="/dashboard/feedback" className="btn btn-primary" style={{ fontSize: '9px' }}>
                  Add Feedback
                </a>
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
                  {selectedFeature.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '11px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                    {formatARR(selectedFeature.total_revenue_weight)} ARR
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--ink-muted)', letterSpacing: '0.08em' }}>
                    {selectedFeature.account_count} account{selectedFeature.account_count !== 1 ? 's' : ''}
                  </span>
                  <span className="chip">
                    {selectedFeature.roadmap_status}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {selectedFeature.description}
                </p>
              </div>

              <button
                onClick={() => handleGenerateBrief(selectedFeature.id)}
                disabled={generatingBrief === selectedFeature.id}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  opacity: generatingBrief === selectedFeature.id ? 0.5 : 1,
                }}
              >
                {generatingBrief === selectedFeature.id
                  ? 'Generating brief...'
                  : 'Generate Roadmap Brief →'}
              </button>

              {briefError && (
                <div style={{ padding: '0.6rem 0.8rem', border: '1px solid #5a2020', background: '#120808', fontSize: '10px', color: '#ee8870', letterSpacing: '0.06em' }}>
                  {briefError}
                </div>
              )}
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
