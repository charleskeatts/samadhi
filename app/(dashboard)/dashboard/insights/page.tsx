'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatARR } from '@/lib/utils';

interface Feature {
  id: string;
  feature_name: string;
  notes: string | null;
  category: string | null;
  deal_stage: string;
  blocker_score: number;
  confidence: string | null;
  accounts?: { name: string; arr: number } | null;
}

const BLOCKER_COLOR: Record<number, string> = {
  5: 'var(--red)', 4: 'var(--orange)', 3: 'var(--gold)', 2: 'var(--green)', 1: 'var(--border-bright)',
};
const BLOCKER_LABEL: Record<number, string> = {
  5: 'Critical', 4: 'High', 3: 'Medium', 2: 'Low', 1: 'Minimal',
};

export default function InsightsPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Feature | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('feature_requests')
      .select('*, accounts:account_id(name, arr)')
      .order('blocker_score', { ascending: false })
      .then(({ data }) => {
        setFeatures(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-muted)', fontSize: '11px', letterSpacing: '0.12em' }}>
        Loading insights...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="page-title">AI Insights</h1>
        <p className="page-subtitle">Feature requests ranked by deal impact and blocker score</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* List */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '2px solid var(--gold-dim)' }}>
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Features</span>
            <span style={{ fontSize: '9px', color: 'var(--border-bright)' }}>{features.length}</span>
          </div>
          <div style={{ maxHeight: '28rem', overflowY: 'auto' }}>
            {features.length > 0 ? features.map((f) => (
              <button key={f.id} onClick={() => setSelected(f)} style={{
                width: '100%', textAlign: 'left', padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--border)',
                background: selected?.id === f.id ? 'rgba(232,184,75,0.06)' : 'transparent',
                borderLeft: selected?.id === f.id ? '2px solid var(--gold)' : '2px solid transparent',
                cursor: 'pointer',
              }}>
                <p style={{ fontSize: '12px', color: 'var(--ink-dim)', lineHeight: 1.4, marginBottom: '0.35rem' }}>
                  {f.feature_name}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {f.accounts?.arr ? (
                    <span style={{ fontSize: '10px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                      {formatARR(f.accounts.arr)}
                    </span>
                  ) : null}
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: BLOCKER_COLOR[f.blocker_score] || 'var(--border-bright)', display: 'inline-block' }} />
                  <span style={{ fontSize: '9px', color: 'var(--ink-muted)' }}>{BLOCKER_LABEL[f.blocker_score] || f.blocker_score}</span>
                </div>
              </button>
            )) : (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>No features yet</p>
                <a href="/dashboard/feedback" className="btn btn-primary" style={{ fontSize: '9px' }}>Log Feature Request</a>
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div>
          {selected ? (
            <div className="card">
              <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                {selected.feature_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                {selected.accounts?.arr ? (
                  <span style={{ fontSize: '11px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                    {formatARR(selected.accounts.arr)} ARR
                  </span>
                ) : null}
                {selected.accounts?.name && (
                  <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>{selected.accounts.name}</span>
                )}
                {selected.category && <span className="chip">{selected.category}</span>}
                <span className="chip" style={{ color: BLOCKER_COLOR[selected.blocker_score], borderColor: BLOCKER_COLOR[selected.blocker_score] }}>
                  {BLOCKER_LABEL[selected.blocker_score]}
                </span>
              </div>
              {selected.notes && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.6rem' }}>
                    Customer Notes
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--ink-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {selected.notes}
                  </p>
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
