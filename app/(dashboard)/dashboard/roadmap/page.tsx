export const dynamic = 'force-dynamic';

import { getAuthProfile } from '@/lib/supabase/server';
import { formatARR } from '@/lib/utils';

type DealStage = 'backlog' | 'planned' | 'in_progress' | 'shipped';

async function getFeatures() {
  const auth = await getAuthProfile();
  if (!auth) return {};

  const { data } = await auth.admin
    .from('feature_requests')
    .select('*, accounts:account_id(name, arr)')
    .eq('organization_id', auth.orgId)
    .order('blocker_score', { ascending: false });

  const grouped: Record<DealStage, any[]> = { backlog: [], planned: [], in_progress: [], shipped: [] };
  data?.forEach((f) => {
    const stage = (f.deal_stage as DealStage) || 'backlog';
    if (grouped[stage]) grouped[stage].push(f);
  });
  return grouped;
}

const STAGE_META: Record<DealStage, { label: string; color: string }> = {
  backlog:     { label: 'Backlog',     color: 'var(--border-bright)' },
  planned:     { label: 'Planned',     color: '#3a7bd5' },
  in_progress: { label: 'In Progress', color: 'var(--gold-dim)' },
  shipped:     { label: 'Shipped',     color: 'var(--green)' },
};
const BLOCKER_COLOR: Record<number, string> = {
  5: 'var(--red)', 4: 'var(--orange)', 3: 'var(--gold)', 2: 'var(--green)', 1: 'var(--border-bright)',
};

export default async function RoadmapPage() {
  const grouped = await getFeatures() as Record<DealStage, any[]>;
  const columns: DealStage[] = ['backlog', 'planned', 'in_progress', 'shipped'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="page-title">Product Roadmap</h1>
        <p className="page-subtitle">Feature requests by deal stage · sorted by blocker score</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.2rem' }}>
        {columns.map((stage) => {
          const meta = STAGE_META[stage];
          const items = grouped[stage] || [];
          const colARR = items.reduce((s: number, f: any) => s + (f.accounts?.arr || 0), 0);

          return (
            <div key={stage}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.6rem 0.8rem',
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: `2px solid ${meta.color}`,
                marginBottom: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
                  <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                    {meta.label}
                  </span>
                </div>
                <span style={{ fontSize: '9px', color: 'var(--ink-muted)' }}>{items.length}</span>
              </div>

              {colARR > 0 && (
                <div style={{ fontSize: '9px', color: 'var(--green)', letterSpacing: '0.1em', marginBottom: '0.75rem', paddingLeft: '0.8rem' }}>
                  {formatARR(colARR)} ARR
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.length > 0 ? items.map((f: any) => (
                  <div key={f.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.85rem 0.9rem' }}>
                    <p style={{ fontSize: '12px', color: 'var(--ink-dim)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                      {f.feature_name}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--ink-muted)', letterSpacing: '0.06em' }}>
                        {f.accounts?.name || '—'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {f.accounts?.arr > 0 && (
                          <span style={{ fontSize: '9px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                            {formatARR(f.accounts.arr)}
                          </span>
                        )}
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: BLOCKER_COLOR[f.blocker_score] || 'var(--border-bright)' }} />
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '9px', color: 'var(--border-bright)', letterSpacing: '0.12em' }}>empty</span>
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
