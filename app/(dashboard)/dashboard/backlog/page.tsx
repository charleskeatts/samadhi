/**
 * Revenue Priority Backlog
 * ARR-ranked feature backlog with table and kanban views.
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FeatureRequest } from '@/types';

type View = 'table' | 'kanban';
type SortKey = 'arr' | 'deals' | 'blocker';

const BLOCKER_LABEL: Record<number, string> = { 5: 'Critical', 4: 'High', 3: 'Medium', 2: 'Low', 1: 'Minimal' };
const BLOCKER_COLOR: Record<number, string> = {
  5: 'var(--red)',
  4: 'var(--orange)',
  3: 'var(--gold)',
  2: 'var(--green)',
  1: 'var(--border-bright)',
};

const STATUS_DISPLAY: Record<string, string> = {
  backlog:     'Not Started',
  planned:     'Planned',
  in_progress: 'In Progress',
  shipped:     'Shipped',
};
const STATUS_COLOR: Record<string, string> = {
  backlog:     'var(--border-bright)',
  planned:     '#3a7bd5',
  in_progress: 'var(--gold-dim)',
  shipped:     'var(--green)',
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function deriveSource(crm_note_id: string | null): string {
  if (!crm_note_id) return 'Manual';
  if (crm_note_id.includes('salesforce')) return 'Salesforce Notes';
  if (crm_note_id.includes('slack')) return 'Slack';
  if (crm_note_id.includes('export')) return 'Support Tickets';
  if (crm_note_id.includes('reporting')) return 'Gong Calls';
  return crm_note_id.replace(/^demo:/, '');
}

function recommendedAction(score: number): string {
  if (score >= 5) return 'Escalate to CPO immediately — this feature is actively blocking deals this quarter.';
  if (score >= 4) return 'Add to next sprint. High probability of unlocking stalled pipeline.';
  return 'Schedule PM discovery session. Validate scope before committing engineering time.';
}

export default function BacklogPage() {
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [sourceMap, setSourceMap] = useState<Record<string, string[]>>({});
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
        .select('*')
        .order('total_revenue_weight', { ascending: false });

      if (!feats?.length) { setLoading(false); return; }
      setFeatures(feats);

      const allIds = feats.flatMap((f) => f.feedback_ids);
      if (allIds.length > 0) {
        const { data: fbRows } = await supabase
          .from('feedback')
          .select('id, crm_note_id')
          .in('id', allIds);

        if (fbRows) {
          const fbMap: Record<string, string | null> = {};
          for (const fb of fbRows) fbMap[fb.id] = fb.crm_note_id;

          const sm: Record<string, string[]> = {};
          for (const feat of feats) {
            const sources: string[] = [
              ...new Set<string>(feat.feedback_ids.map((id: string) => deriveSource(fbMap[id] ?? null))),
            ];
            sm[feat.id] = sources;
          }
          setSourceMap(sm);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const categories = ['All', ...Array.from(new Set(features.map((f) => f.category ?? 'General')))];

  const filtered = [...features]
    .filter((f) => filterCategory === 'All' || (f.category ?? 'General') === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'arr') return b.total_revenue_weight - a.total_revenue_weight;
      if (sortBy === 'deals') return b.account_count - a.account_count;
      return (b.blocker_score ?? 3) - (a.blocker_score ?? 3);
    });

  const totalARR = features.reduce((s, f) => s + f.total_revenue_weight, 0);
  const filteredARR = filtered.reduce((s, f) => s + f.total_revenue_weight, 0);
  const criticalCount = features.filter((f) => (f.blocker_score ?? 0) === 5).length;
  const totalDeals = features.reduce((s, f) => s + f.account_count, 0);

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
            Add feedback and run the AI consolidation to populate the backlog.
          </p>
          <a href="/dashboard/feedback" className="btn btn-primary" style={{ fontSize: '9px' }}>
            Add Feedback
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Revenue Priority</h1>
          <p className="page-subtitle">Features ranked by ARR at risk · updated after AI consolidation</p>
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
          { label: 'Deals Affected', value: String(totalDeals), accent: 'var(--orange)' },
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
          {([['arr', 'ARR'], ['deals', 'Deals'], ['blocker', 'Blocker']] as [SortKey, string][]).map(([key, label]) => (
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
            gridTemplateColumns: '40px 1fr 120px 70px 110px 120px',
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
            <div style={{ textAlign: 'right' }}>ARR at Risk</div>
            <div style={{ textAlign: 'center' }}>Deals</div>
            <div style={{ textAlign: 'center' }}>Blocker</div>
            <div style={{ textAlign: 'center' }}>Status</div>
          </div>

          {filtered.map((f, i) => {
            const score = f.blocker_score ?? 3;
            const isSelected = selectedId === f.id;
            const blockerColor = BLOCKER_COLOR[score] || 'var(--border-bright)';

            return (
              <div key={f.id}>
                <div
                  onClick={() => setSelectedId(isSelected ? null : f.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 120px 70px 110px 120px',
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
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
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

                  {/* Feature name + tags */}
                  <div>
                    <div style={{ fontSize: '12.5px', color: 'var(--ink-dim)', lineHeight: 1.3 }}>{f.title}</div>
                    {f.category && (
                      <span className="chip" style={{ marginTop: '0.25rem', fontSize: '8px' }}>{f.category}</span>
                    )}
                  </div>

                  {/* ARR */}
                  <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                    {fmt(f.total_revenue_weight)}
                  </div>

                  {/* Deals */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--ink-dim)' }}>{f.account_count}</div>
                  </div>

                  {/* Blocker badge */}
                  <div style={{ textAlign: 'center' }}>
                    <span className="chip" style={{ color: blockerColor, borderColor: blockerColor, fontSize: '8px' }}>
                      {BLOCKER_LABEL[score]}
                    </span>
                  </div>

                  {/* Status */}
                  <div style={{ textAlign: 'center' }}>
                    <span className="chip" style={{ color: STATUS_COLOR[f.roadmap_status] || 'var(--border-bright)', borderColor: STATUS_COLOR[f.roadmap_status] || 'var(--border-bright)', fontSize: '8px' }}>
                      {STATUS_DISPLAY[f.roadmap_status] ?? f.roadmap_status}
                    </span>
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
                        {fmt(f.total_revenue_weight)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--ink-muted)', marginTop: '0.3rem' }}>
                        ARR at risk · {f.account_count} account{f.account_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', color: 'var(--ink-muted)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Signal Sources
                      </div>
                      {(sourceMap[f.id] ?? ['Loading...']).map((s) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--gold-dim)' }} />
                          <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{s}</span>
                        </div>
                      ))}
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
        /* ── KANBAN VIEW ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {(['backlog', 'planned', 'in_progress', 'shipped'] as const).map((status) => {
            const cols = filtered.filter((f) => f.roadmap_status === status);
            const colARR = cols.reduce((s, f) => s + f.total_revenue_weight, 0);
            const statusColor = STATUS_COLOR[status];
            return (
              <div key={status}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderTop: `2px solid ${statusColor}`,
                  padding: '0.75rem 0.9rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                    {STATUS_DISPLAY[status]}
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
                      <div style={{ fontSize: '12px', color: 'var(--ink-dim)', lineHeight: 1.4, marginBottom: '0.5rem' }}>{f.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                          {fmt(f.total_revenue_weight)}
                        </span>
                        <div style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: blockerColor,
                        }} />
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--ink-muted)', marginTop: '0.3rem', letterSpacing: '0.06em' }}>
                        {f.account_count} deal{f.account_count !== 1 ? 's' : ''} · {f.category}
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
