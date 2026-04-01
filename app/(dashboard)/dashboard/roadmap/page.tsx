/**
 * Roadmap page
 * Kanban-style view of feature requests by deal stage
 *
 * ACTUAL feature_requests columns:
 *   id, organization_id, account_id, feature_name, category, deal_stage,
 *   notes, submitted_by, source, confidence, confidence_note, created_at, blocker_score
 */

export const dynamic = 'force-dynamic';

import { getAuthProfile } from '@/lib/supabase/server';
import { formatARR } from '@/lib/utils';

type DealStage = 'New Business' | 'Active' | 'Expansion' | 'Renewal' | 'At Risk';

const STAGES: DealStage[] = ['New Business', 'Active', 'Expansion', 'Renewal', 'At Risk'];

const STAGE_META: Record<DealStage, { label: string; color: string }> = {
  'New Business': { label: 'New Business',  color: '#3a7bd5' },
  'Active':       { label: 'Active',        color: 'var(--green)' },
  'Expansion':    { label: 'Expansion',     color: 'var(--gold-dim)' },
  'Renewal':      { label: 'Renewal',       color: 'var(--orange-dim)' },
  'At Risk':      { label: 'At Risk',       color: 'var(--red)' },
};

async function getFeatures() {
  const auth = await getAuthProfile();
  if (!auth) return {};

  const { data: features } = await auth.admin
    .from('feature_requests')
    .select(`
      id, feature_name, category, deal_stage, notes,
      confidence, blocker_score, created_at,
      accounts:account_id (name, arr)
    `)
    .eq('organization_id', auth.orgId)
    .order('blocker_score', { ascending: false });

  const grouped: Record<string, any[]> = {};
  for (const stage of STAGES) {
    grouped[stage] = [];
  }
  // Catch-all for unrecognized stages
  grouped['Other'] = [];

  features?.forEach((feature) => {
    const stage = feature.deal_stage || 'Other';
    if (grouped[stage]) {
      grouped[stage].push(feature);
    } else {
      grouped['Other'].push(feature);
    }
  });

  return grouped;
}

export default async function RoadmapPage() {
  const grouped = await getFeatures();

  const columns = [...STAGES, ...(grouped['Other']?.length ? ['Other' as const] : [])];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="page-title">Product Roadmap</h1>
        <p className="page-subtitle">Feature requests by deal stage · ranked by blocker score</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: '1.2rem', overflowX: 'auto' }}>
        {columns.map((stage) => {
          const meta = STAGE_META[stage as DealStage] || { label: stage, color: 'var(--border-bright)' };
          const items = grouped[stage] || [];

          return (
            <div key={stage}>
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
                      <p style={{ fontSize: '12px', color: 'var(--ink-dim)', lineHeight: 1.4, marginBottom: '0.4rem' }}>
                        {feature.feature_name}
                      </p>
                      <div style={{ fontSize: '9px', color: 'var(--ink-muted)', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                        {(feature.accounts as any)?.name || 'Unknown'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                          {(feature.accounts as any)?.arr ? formatARR((feature.accounts as any).arr) : '—'}
                        </span>
                        <span style={{
                          fontSize: '9px',
                          color: feature.blocker_score >= 4 ? 'var(--orange)' : 'var(--ink-muted)',
                          letterSpacing: '0.06em',
                        }}>
                          B{feature.blocker_score}/5
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '9px', color: 'var(--border-bright)', letterSpacing: '0.12em' }}>
                      —
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
