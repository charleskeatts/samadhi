/**
 * Roadmap page
 * Kanban-style view of features by status
 */

export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { RoadmapStatus } from '@/types';
import { formatARR } from '@/lib/utils';

async function getFeatures(): Promise<Partial<Record<RoadmapStatus, any[]>>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!profile) return {};

  const { data: features } = await supabase
    .from('feature_requests')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('total_revenue_weight', { ascending: false });

  const grouped: Record<RoadmapStatus, any[]> = {
    backlog: [],
    planned: [],
    in_progress: [],
    shipped: [],
  };

  features?.forEach((feature) => {
    const status = feature.roadmap_status as RoadmapStatus;
    grouped[status].push(feature);
  });

  return grouped;
}

const STATUS_META: Record<RoadmapStatus, { label: string; color: string }> = {
  backlog:     { label: 'Backlog',      color: 'var(--border-bright)' },
  planned:     { label: 'Planned',      color: '#3a7bd5' },
  in_progress: { label: 'In Progress',  color: 'var(--gold-dim)' },
  shipped:     { label: 'Shipped',      color: 'var(--green)' },
};

export default async function RoadmapPage() {
  const grouped = await getFeatures();

  const columns: RoadmapStatus[] = ['backlog', 'planned', 'in_progress', 'shipped'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 className="page-title">Product Roadmap</h1>
        <p className="page-subtitle">Features by status · revenue-ranked within each column</p>
      </div>

      {/* Kanban board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.2rem' }}>
        {columns.map((status) => {
          const meta = STATUS_META[status];
          const items = grouped[status] || [];
          const colARR = items.reduce((s: number, f: any) => s + f.total_revenue_weight, 0);

          return (
            <div key={status}>
              {/* Column header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.6rem 0.8rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderTop: `2px solid ${meta.color}`,
                marginBottom: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
                  <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                    {meta.label}
                  </span>
                </div>
                <span style={{ fontSize: '9px', color: 'var(--ink-muted)', letterSpacing: '0.08em' }}>
                  {items.length}
                </span>
              </div>

              {colARR > 0 && (
                <div style={{ fontSize: '9px', color: 'var(--green)', letterSpacing: '0.1em', marginBottom: '0.75rem', paddingLeft: '0.8rem' }}>
                  {formatARR(colARR)} ARR
                </div>
              )}

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.length > 0 ? (
                  items.map((feature: any) => (
                    <div
                      key={feature.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        padding: '0.85rem 0.9rem',
                      }}
                    >
                      <p style={{ fontSize: '12px', color: 'var(--ink-dim)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                        {feature.title}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                          {formatARR(feature.total_revenue_weight)}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--ink-muted)', letterSpacing: '0.06em' }}>
                          {feature.account_count} acct{feature.account_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '9px', color: 'var(--border-bright)', letterSpacing: '0.12em' }}>
                      {status === 'backlog' ? '—' : 'empty'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
