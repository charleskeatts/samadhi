/**
 * Revenue Priority Backlog
 * Feature requests with table and kanban views.
 * Uses actual DB schema: feature_requests joined with accounts for ARR data.
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FeatureRequestWithAccount } from '@/types';

type View = 'table' | 'kanban';
type SortKey = 'arr' | 'blocker' | 'recent';

const BLOCKER_LABEL: Record<number, string> = { 5: 'Critical', 4: 'High', 3: 'Medium', 2: 'Low', 1: 'Minimal' };
const BLOCKER_COLOR: Record<number, string> = {
  5: 'var(--red)',
  4: 'var(--orange)',
  3: 'var(--gold)',
  2: 'var(--green)',
  1: 'var(--border-bright)',
};

const STAGE_DISPLAY: Record<string, string> = {
  discovery:    'Discovery',
  evaluation:   'Evaluation',
  negotiation:  'Negotiation',
  closed_won:   'Closed Won',
  closed_lost:  'Closed Lost',
};
const STAGE_COLOR: Record<string, string> = {
  discovery:    'var(--border-bright)',
  evaluation:   '#3a7bd5',
  negotiation:  'var(--gold-dim)',
  closed_won:   'var(--green)',
  closed_lost:  'var(--red)',
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function recommendedAction(score: number): string {
  if (score >= 5) return 'Escalate to CPO immediately — this feature is actively blocking deals this quarter.';
  if (score >= 4) return 'Add to next sprint. High probability of unlocking stalled pipeline.';
  return 'Schedule PM discovery session. Validate scope before committing engineering time.';
}

export default function BacklogPage() {
  const [features, setFeatures] = useState<FeatureRequestWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('table');
  const [sortBy, setSortBy] = useState<SortKey>('arr');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const { data: feats } = await supabase
        .from('feature_requests')
        .select('*, accounts:account_id (id, name, arr)')
        .order('blocker_score', { ascending: false });

      if (!feats?.length) { setLoading(false); return; }
      setFeatures(feats as FeatureRequestWithAccount[]);
      setLoading(false);
    };
    load();
  }, []);

  const categories = ['All', ...Array.from(new Set(features.map((f) => f.category ?? 'General')))];

  const getARR = (f: FeatureRequestWithAccount) => f.accounts?.arr ?? 0;

  const filtered = [...features]
    .filter((f) => filterCategory === 'All' || (f.category ?? 'General') === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'arr') return getARR(b) - getARR(a);
      if (sortBy === 'blocker') return (b.blocker_score ?? 3) - (a.blocker_score ?? 3);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const totalARR = features.reduce((s, f) => s + getARR(f), 0);
  const filteredARR = filtered.reduce((s, f) => s + getARR(f), 0);
  const criticalCount = features.filter((f) => (f.blocker_score ?? 0) === 5).length;
  const uniqueAccounts = new Set(features.map((f) => f.account_id)).size;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-muted)', fontSize: '11px', letterSpacing: '0.12em' }}>
        Loading revenue data...
      </div>
    );
  }

  if (features.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h1 className="page-title">Revenue Priority</h1>
          <p className="page-subtitle">Features ranked by ARR at risk</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>
            No features yet
          </div>
          <p style={{ fontSize: '10px', color: 'var(--border-bright)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Feature requests will appear here once data is submitted.
          </p>
        </div>
      </div>
    );
  }

  // Kanban stages come from deal_stage
  const kanbanStages = ['discovery', 'evaluation', 'negotiation', 'closed_won'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Revenue Priority</h1>
          <p className="page-subtitle">Features ranked by account ARR</p>
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['table', 'kanban'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={view === v ? 'btn btn-primary' : 'btn'}
              style={{ fontSize: '9px' }}
            >
              {v === 'table' ? 'Backlog' : 'Board'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total ARR at Risk', value: fmt(totalARR), accent: 'var(--gold)' },
          { label: 'Critical Blockers', value: String(criticalCount), accent: 'var(--red)' },
          { label: 'Accounts Affected', value: String(uniqueAccounts), accent: 'var(--orange)' },
          { label: 'Filtered ARR', value: fmt(filteredARR), accent: 'var(--green)' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="card"
            style={{ borderTop: `2px solid ${kpi.accent}`, borderLeft: 'none', padding: '1rem 1.1rem' }}
          >
            <div style={{ fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.5rem' }}>
              {kpi.label}
            </div>
            <div style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '1.8rem',
              fontWeight: 300,
              color: kpi.accent,
              lineHeight: 1,
            }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '9px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                background: filterCategory === cat ? 'rgba(232,184,75,0.08)' : 'transparent',
                color: filterCategory === cat ? 'var(--gold)' : 'var(--ink-muted)',
                border: filterCategory === cat ? '1px solid rgba(232,184,75,0.3)' : '1px solid var(--border)',
                transition: 'all 0.15s',
                fontFamily: '"DM Mono", monospace',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '9px', color: 'var(--ink-muted)', letterSpacing: '0.12em' }}>Sort:</span>
          {([['arr', 'ARR'], ['blocker', 'Blocker'], ['recent', 'Recent']] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '9px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                background: sortBy === key ? 'rgba(232,184,75,0.08)' : 'transparent',
                color: sortBy === key ? 'var(--gold)' : 'var(--ink-muted)',
                border: sortBy === key ? '1px solid rgba(232,184,75,0.3)' : '1px solid var(--border)',
                fontFamily: '"DM Mono", monospace',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'table' ? (
        /* ── TABLE VIEW ── */
        <div style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 120px 110px 120px 110px',
            padding: '0.65rem 1.1rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg)',
            fontSize: '8px',
            fontWeight: 400,
            color: 'var(--ink-muted)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            gap: '0.75rem',
          }}>
            <div>#</div>
            <div>Feature</div>
            <div style={{ textAlign: 'right' }}>Account ARR</div>
            <div style={{ textAlign: 'center' }}>Blocker</div>
            <div style={{ textAlign: 'center' }}>Deal Stage</div>
            <div style={{ textAlign: 'center' }}>Source</div>
          </div>

          {filtered.map((f, i) => {
            const score = f.blocker_score ?? 3;
            const isSelected = selectedId === f.id;
            const blockerColor = BLOCKER_COLOR[score] || 'var(--border-bright)';
            const accountARR = getARR(f);
            const stage = f.deal_stage || 'discovery';

            return (
              <div key={f.id}>
                <div
                  onClick={() => setSelectedId(isSelected ? null : f.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 120px 110px 120px 110px',
                    padding: '0 1.1rem',
                    borderBottom: `1px solid var(--border)`,
                    cursor: 'pointer',
                    gap: '0.75rem',
                    alignItems: 'center',
                    minHeight: 52,
                    background: isSelected ? 'rgba(232,184,75,0.04)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'rgba(232,184,75,0.04)' : 'transparent'; }}
                >
                  {/* Rank */}
                  <div style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '1rem',
                    fontStyle: 'italic',
                    color: i < 3 ? 'var(--gold)' : 'var(--border-bright)',
                  }}>
                    {i + 1}
                  </div>

                  {/* Feature name + category + account */}
                  <div>
                    <div style={{ fontSize: '12.5px', color: 'var(--ink-dim)', lineHeight: 1.3 }}>{f.feature_name}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                      {f.category && (
                        <span className="chip" style={{ fontSize: '8px' }}>{f.category}</span>
                      )}
                      {f.accounts?.name && (
                        <span style={{ fontSize: '9px', color: 'var(--ink-muted)' }}>{f.accounts.name}</span>
                      )}
                    </div>
                  </div>

                  {/* ARR */}
                  <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                    {fmt(accountARR)}
                  </div>

                  {/* Blocker badge */}
                  <div style={{ textAlign: 'center' }}>
                    <span className="chip" style={{ color: blockerColor, borderColor: blockerColor, fontSize: '8px' }}>
                      {BLOCKER_LABEL[score] ?? `${score}`}
                    </span>
                  </div>

                  {/* Deal Stage */}
                  <div style={{ textAlign: 'center' }}>
                    <span className="chip" style={{ color: STAGE_COLOR[stage] || 'var(--border-bright)', borderColor: STAGE_COLOR[stage] || 'var(--border-bright)', fontSize: '8px' }}>
                      {STAGE_DISPLAY[stage] ?? stage}
                    </span>
                  </div>

                  {/* Source */}
                  <div style={{ textAlign: 'center', fontSize: '9px', color: 'var(--ink-muted)' }}>
                    {f.source ?? 'Manual'}
                  </div>
                </div>

                {/* Expandable detail drawer */}
                {isSelected && (
                  <div style={{
                    margin: '0 1.1rem 1rem',
                    background: 'rgba(232,184,75,0.03)',
                    border: '1px solid rgba(232,184,75,0.12)',
                    padding: '1.2rem 1.4rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '1.2rem',
                  }}>
                    <div>
                      <div style={{ fontSize: '8px', color: 'var(--ink-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Revenue Impact
                      </div>
                      <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.6rem', color: 'var(--green)', fontWeight: 300 }}>
                        {fmt(accountARR)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--ink-muted)', marginTop: '0.3rem' }}>
                        {f.accounts?.name ?? 'Unknown account'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', color: 'var(--ink-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Notes
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                        {f.notes || 'No notes provided.'}
                      </div>
                      {f.confidence != null && (
                        <div style={{ fontSize: '9px', color: 'var(--gold-dim)', marginTop: '0.5rem' }}>
                          Confidence: {f.confidence}/5 {f.confidence_note ? `— ${f.confidence_note}` : ''}
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', color: 'var(--ink-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Recommended Action
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                        {recommendedAction(score)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── KANBAN VIEW (by deal_stage) ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {kanbanStages.map((stage) => {
            const cols = filtered.filter((f) => (f.deal_stage || 'discovery') === stage);
            const colARR = cols.reduce((s, f) => s + getARR(f), 0);
            const stageColor = STAGE_COLOR[stage] || 'var(--border-bright)';
            return (
              <div key={stage}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderTop: `2px solid ${stageColor}`,
                  padding: '0.75rem 0.9rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                    {STAGE_DISPLAY[stage] ?? stage}
                  </span>
                  {colARR > 0 && (
                    <span style={{ fontSize: '9px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                      {fmt(colARR)}
                    </span>
                  )}
                </div>
                {cols.length === 0 && (
                  <div style={{ padding: '1.5rem 0', textAlign: 'center', fontSize: '9px', color: 'var(--border-bright)', letterSpacing: '0.12em' }}>
                    empty
                  </div>
                )}
                {cols.map((f) => {
                  const score = f.blocker_score ?? 3;
                  const blockerColor = BLOCKER_COLOR[score] || 'var(--border-bright)';
                  return (
                    <div
                      key={f.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        padding: '0.85rem 0.9rem',
                        marginBottom: '0.4rem',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{ fontSize: '12px', color: 'var(--ink-dim)', lineHeight: 1.4, marginBottom: '0.5rem' }}>{f.feature_name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                          {fmt(getARR(f))}
                        </span>
                        <div style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: blockerColor,
                        }} />
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--ink-muted)', marginTop: '0.3rem', letterSpacing: '0.06em' }}>
                        {f.accounts?.name ?? 'Unknown'} · {f.category}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom bar */}
      <div style={{
        padding: '0.75rem 1rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: 'var(--ink-muted)',
        letterSpacing: '0.08em',
      }}>
        <div>
          Showing <span style={{ color: 'var(--ink-dim)' }}>{filtered.length} features</span>
          {' · '}
          ARR at risk: <span style={{ color: 'var(--gold)', fontFamily: '"DM Mono", monospace' }}>{fmt(filteredARR)}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ color: 'var(--red)' }}>{filtered.filter((f) => (f.blocker_score ?? 0) >= 5).length} Critical</span>
          <span style={{ color: 'var(--orange)' }}>{filtered.filter((f) => (f.blocker_score ?? 0) === 4).length} High</span>
          <span style={{ color: 'var(--gold-dim)' }}>{filtered.filter((f) => (f.blocker_score ?? 0) === 3).length} Medium</span>
        </div>
      </div>
    </div>
  );
}
