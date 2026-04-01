'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type SortKey = 'arr' | 'blocker';
type View = 'table' | 'kanban';

interface Feature {
  id: string;
  feature_name: string;
  category: string | null;
  deal_stage: string;
  blocker_score: number;
  notes: string | null;
  source: string | null;
  accounts?: { name: string; arr: number } | null;
}

const BLOCKER_LABEL: Record<number, string> = { 5: 'Critical', 4: 'High', 3: 'Medium', 2: 'Low', 1: 'Minimal' };
const BLOCKER_COLOR: Record<number, string> = {
  5: 'var(--red)', 4: 'var(--orange)', 3: 'var(--gold)', 2: 'var(--green)', 1: 'var(--border-bright)',
};
const STAGE_COLOR: Record<string, string> = {
  backlog: 'var(--border-bright)', planned: '#3a7bd5', in_progress: 'var(--gold-dim)', shipped: 'var(--green)',
};
const STAGE_LABEL: Record<string, string> = {
  backlog: 'Not Started', planned: 'Planned', in_progress: 'In Progress', shipped: 'Shipped',
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function BacklogPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('table');
  const [sortBy, setSortBy] = useState<SortKey>('blocker');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('feature_requests')
      .select('*, accounts:account_id(name, arr)')
      .order('blocker_score', { ascending: false })
      .then(({ data }) => { setFeatures(data || []); setLoading(false); });
  }, []);

  const categories = ['All', ...Array.from(new Set(features.map((f) => f.category ?? 'General')))];

  const filtered = [...features]
    .filter((f) => filterCategory === 'All' || (f.category ?? 'General') === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'arr') return (b.accounts?.arr || 0) - (a.accounts?.arr || 0);
      return (b.blocker_score ?? 3) - (a.blocker_score ?? 3);
    });

  const totalARR = features.reduce((s, f) => s + (f.accounts?.arr || 0), 0);
  const criticalCount = features.filter((f) => f.blocker_score === 5).length;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-muted)', fontSize: '11px', letterSpacing: '0.12em' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Revenue Priority</h1>
          <p className="page-subtitle">Feature requests ranked by deal impact</p>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['table', 'kanban'] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={view === v ? 'btn btn-primary' : 'btn'} style={{ fontSize: '9px' }}>
              {v === 'table' ? 'Backlog' : 'Board'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total ARR Tracked', value: fmt(totalARR), accent: 'var(--gold)' },
          { label: 'Critical Blockers', value: String(criticalCount), accent: 'var(--red)' },
          { label: 'Total Features', value: String(features.length), accent: 'var(--gold-dim)' },
          { label: 'Filtered', value: String(filtered.length), accent: 'var(--green)' },
        ].map((kpi) => (
          <div key={kpi.label} className="card" style={{ borderTop: `2px solid ${kpi.accent}`, borderLeft: 'none', padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.5rem' }}>
              {kpi.label}
            </div>
            <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.8rem', fontWeight: 300, color: kpi.accent, lineHeight: 1 }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)} style={{
              padding: '0.3rem 0.75rem', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
              background: filterCategory === cat ? 'rgba(232,184,75,0.08)' : 'transparent',
              color: filterCategory === cat ? 'var(--gold)' : 'var(--ink-muted)',
              border: filterCategory === cat ? '1px solid rgba(232,184,75,0.3)' : '1px solid var(--border)',
              fontFamily: '"DM Mono", monospace',
            }}>{cat}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: 'var(--ink-muted)', letterSpacing: '0.12em' }}>Sort:</span>
          {([['arr', 'ARR'], ['blocker', 'Blocker']] as [SortKey, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)} style={{
              padding: '0.3rem 0.75rem', fontSize: '9px', cursor: 'pointer',
              background: sortBy === key ? 'rgba(232,184,75,0.08)' : 'transparent',
              color: sortBy === key ? 'var(--gold)' : 'var(--ink-muted)',
              border: sortBy === key ? '1px solid rgba(232,184,75,0.3)' : '1px solid var(--border)',
              fontFamily: '"DM Mono", monospace',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {view === 'table' ? (
        <div style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 100px 90px 110px 100px',
            padding: '0.65rem 1.1rem', borderBottom: '1px solid var(--border)',
            fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--ink-muted)', gap: '0.75rem',
          }}>
            <div>#</div><div>Feature</div><div style={{ textAlign: 'right' }}>ARR</div>
            <div style={{ textAlign: 'center' }}>Blocker</div><div style={{ textAlign: 'center' }}>Stage</div>
            <div style={{ textAlign: 'center' }}>Source</div>
          </div>
          {filtered.map((f, i) => {
            const isSelected = selectedId === f.id;
            const blockerColor = BLOCKER_COLOR[f.blocker_score] || 'var(--border-bright)';
            return (
              <div key={f.id}>
                <div onClick={() => setSelectedId(isSelected ? null : f.id)} style={{
                  display: 'grid', gridTemplateColumns: '36px 1fr 100px 90px 110px 100px',
                  padding: '0 1.1rem', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', gap: '0.75rem', alignItems: 'center', minHeight: 52,
                  background: isSelected ? 'rgba(232,184,75,0.04)' : 'transparent',
                }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', fontStyle: 'italic', color: i < 3 ? 'var(--gold)' : 'var(--border-bright)' }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '12.5px', color: 'var(--ink-dim)' }}>{f.feature_name}</div>
                    {f.accounts?.name && <div style={{ fontSize: '9px', color: 'var(--ink-muted)', marginTop: '0.15rem' }}>{f.accounts.name}</div>}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                    {f.accounts?.arr ? fmt(f.accounts.arr) : '—'}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span className="chip" style={{ color: blockerColor, borderColor: blockerColor, fontSize: '8px' }}>
                      {BLOCKER_LABEL[f.blocker_score]}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span className="chip" style={{ color: STAGE_COLOR[f.deal_stage] || 'var(--border-bright)', borderColor: STAGE_COLOR[f.deal_stage] || 'var(--border)', fontSize: '8px' }}>
                      {STAGE_LABEL[f.deal_stage] ?? f.deal_stage}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '9px', color: 'var(--ink-muted)' }}>
                    {f.source || '—'}
                  </div>
                </div>
                {isSelected && f.notes && (
                  <div style={{ margin: '0 1.1rem 0.75rem', background: 'rgba(232,184,75,0.03)', border: '1px solid rgba(232,184,75,0.12)', padding: '1rem 1.2rem' }}>
                    <div style={{ fontSize: '8px', color: 'var(--ink-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Customer Notes</div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6 }}>{f.notes}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {(['backlog', 'planned', 'in_progress', 'shipped'] as const).map((stage) => {
            const cols = filtered.filter((f) => f.deal_stage === stage);
            return (
              <div key={stage}>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: `2px solid ${STAGE_COLOR[stage]}`,
                  padding: '0.75rem 0.9rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                    {STAGE_LABEL[stage]}
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--ink-muted)' }}>{cols.length}</span>
                </div>
                {cols.length === 0 && (
                  <div style={{ padding: '1.5rem 0', textAlign: 'center', fontSize: '9px', color: 'var(--border-bright)', letterSpacing: '0.12em' }}>empty</div>
                )}
                {cols.map((f) => (
                  <div key={f.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.85rem 0.9rem', marginBottom: '0.4rem', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--ink-dim)', lineHeight: 1.4, marginBottom: '0.5rem' }}>{f.feature_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>{f.accounts?.name || '—'}</span>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: BLOCKER_COLOR[f.blocker_score] || 'var(--border-bright)' }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--ink-muted)' }}>
        <span>Showing <span style={{ color: 'var(--ink-dim)' }}>{filtered.length} features</span></span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ color: 'var(--red)' }}>{filtered.filter((f) => f.blocker_score === 5).length} Critical</span>
          <span style={{ color: 'var(--orange)' }}>{filtered.filter((f) => f.blocker_score === 4).length} High</span>
          <span style={{ color: 'var(--gold-dim)' }}>{filtered.filter((f) => f.blocker_score === 3).length} Medium</span>
        </div>
      </div>
    </div>
  );
}
