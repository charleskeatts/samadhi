/**
 * Revenue Priority Backlog
 * ARR-ranked feature backlog with table and kanban views.
 * Dark-themed "money view" for product teams.
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FeatureRequest } from '@/types';

type View = 'table' | 'kanban';
type SortKey = 'arr' | 'deals' | 'blocker';

const BLOCKER_LABEL: Record<number, string> = { 5: 'Critical', 4: 'High', 3: 'Medium', 2: 'Low', 1: 'Minimal' };
const BLOCKER_COLOR: Record<number, string> = { 5: '#ef4444', 4: '#f97316', 3: '#eab308', 2: '#22c55e', 1: '#64748b' };

const STATUS_DISPLAY: Record<string, string> = {
  backlog: 'Not Started',
  planned: 'Planned',
  in_progress: 'In Progress',
  shipped: 'Shipped',
};
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  backlog:     { bg: 'rgba(71,85,105,0.25)',  text: '#94a3b8' },
  planned:     { bg: 'rgba(14,165,233,0.15)', text: '#38bdf8' },
  in_progress: { bg: 'rgba(34,197,94,0.15)',  text: '#4ade80' },
  shipped:     { bg: 'rgba(163,230,53,0.15)', text: '#a3e635' },
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
  if (score >= 5) return '🔴 Escalate to CPO immediately — this feature is actively blocking deals this quarter.';
  if (score >= 4) return '🟠 Add to next sprint. High probability of unlocking stalled pipeline.';
  return '🟡 Schedule PM discovery session. Validate scope before committing engineering time.';
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

      // Batch-fetch feedback sources (no N+1)
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

  const PAGE_BG = '#0A1628';
  const CARD_BG = '#0D1B3E';
  const BORDER = 'rgba(255,255,255,0.07)';
  const TEXT_PRIMARY = '#e2e8f0';
  const TEXT_MUTED = '#64748b';
  const GOLD = '#F0A500';

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PAGE_BG, color: TEXT_MUTED }}>
        Loading revenue data...
      </div>
    );
  }

  if (features.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: PAGE_BG, color: TEXT_MUTED, gap: 12 }}>
        <p style={{ fontSize: 32 }}>🎯</p>
        <p style={{ fontWeight: 600, color: TEXT_PRIMARY }}>No features yet</p>
        <p style={{ fontSize: 14 }}>Add feedback and run the AI consolidation to populate the backlog.</p>
        <a href="/dashboard/feedback" style={{ marginTop: 8, padding: '8px 20px', borderRadius: 8, background: '#1565C0', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          Add Feedback
        </a>
      </div>
    );
  }

  return (
    <div style={{ background: PAGE_BG, minHeight: '100%', padding: '28px 0', color: TEXT_PRIMARY }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', fontFamily: 'Trebuchet MS, sans-serif' }}>
            Revenue Priority
          </h1>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4 }}>
            Features ranked by ARR at risk — updated after each AI consolidation
          </p>
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['table', 'kanban'] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '6px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              background: view === v ? 'rgba(240,165,0,0.15)' : 'transparent',
              color: view === v ? GOLD : TEXT_MUTED,
              border: view === v ? `1px solid rgba(240,165,0,0.35)` : `1px solid ${BORDER}`,
              transition: 'all 0.15s',
            }}>
              {v === 'table' ? '📊 Backlog' : '🗂 Board'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total ARR at Risk', value: fmt(totalARR), sub: 'across all features', accent: '#1E88E5' },
          { label: 'Critical Blockers', value: String(criticalCount), sub: 'actively losing deals', accent: '#ef4444' },
          { label: 'Deals Affected', value: String(totalDeals), sub: 'open accounts impacted', accent: '#f97316' },
          { label: 'Filtered ARR', value: fmt(filteredARR), sub: `${filtered.length} features shown`, accent: '#00897B' },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${kpi.accent}, transparent)` }} />
            <div style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 5 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)} style={{
              padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: filterCategory === cat ? 'rgba(240,165,0,0.15)' : 'rgba(255,255,255,0.04)',
              color: filterCategory === cat ? GOLD : TEXT_MUTED,
              border: filterCategory === cat ? '1px solid rgba(240,165,0,0.35)' : `1px solid ${BORDER}`,
              transition: 'all 0.15s',
            }}>{cat}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED }}>Sort:</span>
          {([['arr', '💰 ARR'], ['deals', '📋 Deals'], ['blocker', '🔴 Blocker']] as [SortKey, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              background: sortBy === key ? 'rgba(240,165,0,0.15)' : 'transparent',
              color: sortBy === key ? GOLD : TEXT_MUTED,
              border: sortBy === key ? '1px solid rgba(240,165,0,0.35)' : `1px solid ${BORDER}`,
              fontWeight: sortBy === key ? 700 : 400,
            }}>{label}</button>
          ))}
        </div>
      </div>

      {view === 'table' ? (
        /* ── TABLE VIEW ── */
        <div style={{ background: 'rgba(13,27,62,0.6)', border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 130px 80px 110px 130px',
            padding: '11px 20px', borderBottom: `1px solid ${BORDER}`,
            background: 'rgba(255,255,255,0.02)', fontSize: 10, fontWeight: 700,
            color: TEXT_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', gap: 12,
          }}>
            <div>#</div><div>Feature</div>
            <div style={{ textAlign: 'right' }}>ARR at Risk</div>
            <div style={{ textAlign: 'center' }}>Deals</div>
            <div style={{ textAlign: 'center' }}>Blocker</div>
            <div style={{ textAlign: 'center' }}>Status</div>
          </div>

          {filtered.map((f, i) => {
            const score = f.blocker_score ?? 3;
            const isSelected = selectedId === f.id;
            const tags: string[] = [f.category ?? 'General'];
            if (score >= 5) tags.push('Deal Blocker');

            return (
              <div key={f.id}>
                <div
                  onClick={() => setSelectedId(isSelected ? null : f.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '40px 1fr 130px 80px 110px 130px',
                    padding: '0 20px', borderBottom: `1px solid rgba(255,255,255,0.04)`,
                    cursor: 'pointer', gap: 12, alignItems: 'center', minHeight: 56,
                    background: isSelected ? 'rgba(240,165,0,0.05)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Rank */}
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    background: i < 3 ? 'rgba(240,165,0,0.15)' : 'rgba(255,255,255,0.04)',
                    color: i < 3 ? GOLD : TEXT_MUTED,
                  }}>{i + 1}</div>

                  {/* Feature name + tags */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{f.title}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      {tags.map((t) => (
                        <span key={t} style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                          background: t === 'Deal Blocker' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
                          color: t === 'Deal Blocker' ? '#fca5a5' : TEXT_MUTED,
                        }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* ARR */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px' }}>{fmt(f.total_revenue_weight)}</div>
                  </div>

                  {/* Deals */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>{f.account_count}</div>
                    <div style={{ fontSize: 10, color: TEXT_MUTED }}>deals</div>
                  </div>

                  {/* Blocker badge */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 20,
                      background: `${BLOCKER_COLOR[score]}18`,
                      border: `1px solid ${BLOCKER_COLOR[score]}33`,
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: BLOCKER_COLOR[score] }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: BLOCKER_COLOR[score] }}>
                        {BLOCKER_LABEL[score]}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-block', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: (STATUS_COLOR[f.roadmap_status] ?? STATUS_COLOR.backlog).bg,
                      color: (STATUS_COLOR[f.roadmap_status] ?? STATUS_COLOR.backlog).text,
                    }}>
                      {STATUS_DISPLAY[f.roadmap_status] ?? f.roadmap_status}
                    </div>
                  </div>
                </div>

                {/* Expandable detail drawer */}
                {isSelected && (
                  <div style={{
                    margin: '0 20px 16px', marginTop: 4,
                    background: 'rgba(240,165,0,0.04)',
                    border: '1px solid rgba(240,165,0,0.15)',
                    borderRadius: 10, padding: '18px 22px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18,
                  }}>
                    <div>
                      <div style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        Revenue Impact
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{fmt(f.total_revenue_weight)}</div>
                      <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>
                        ARR at risk across {f.account_count} account{f.account_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        Signal Sources
                      </div>
                      {(sourceMap[f.id] ?? ['Loading...']).map((s) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD }} />
                          <span style={{ fontSize: 13, color: '#94a3b8' }}>{s}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: TEXT_MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        Recommended Action
                      </div>
                      <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {(['backlog', 'planned', 'in_progress', 'shipped'] as const).map((status) => {
            const cols = filtered.filter((f) => f.roadmap_status === status);
            const colARR = cols.reduce((s, f) => s + f.total_revenue_weight, 0);
            return (
              <div key={status} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: (STATUS_COLOR[status] ?? STATUS_COLOR.backlog).text }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>
                      {STATUS_DISPLAY[status]}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{fmt(colARR)}</span>
                </div>
                {cols.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#334155', fontSize: 13 }}>No features</div>
                )}
                {cols.map((f) => {
                  const score = f.blocker_score ?? 3;
                  return (
                    <div key={f.id} style={{
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
                      borderRadius: 8, padding: '12px 14px', marginBottom: 10, cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(240,165,0,0.3)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = BORDER}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.4, marginBottom: 8 }}>{f.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 800 }}>{fmt(f.total_revenue_weight)}</span>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: BLOCKER_COLOR[score],
                          boxShadow: `0 0 6px ${BLOCKER_COLOR[score]}88`,
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>
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
        marginTop: 18, padding: '12px 18px',
        background: 'rgba(13,27,62,0.4)', border: `1px solid ${BORDER}`,
        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12,
      }}>
        <div style={{ color: TEXT_MUTED }}>
          Showing <span style={{ color: '#94a3b8', fontWeight: 600 }}>{filtered.length} features</span>
          {' · '}Total ARR at risk: <span style={{ color: GOLD, fontWeight: 700 }}>{fmt(filteredARR)}</span>
        </div>
        <div style={{ display: 'flex', gap: 14, color: TEXT_MUTED }}>
          <span>🔴 <span style={{ color: '#fca5a5' }}>{filtered.filter((f) => (f.blocker_score ?? 0) >= 5).length} Critical</span></span>
          <span>🟠 <span style={{ color: '#fdba74' }}>{filtered.filter((f) => (f.blocker_score ?? 0) === 4).length} High</span></span>
          <span>🟡 <span style={{ color: '#fde047' }}>{filtered.filter((f) => (f.blocker_score ?? 0) === 3).length} Medium</span></span>
        </div>
      </div>
    </div>
  );
}
