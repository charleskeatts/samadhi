/**
 * Dashboard overview page
 * Shows key metrics and recent activity
 *
 * ACTUAL DB SCHEMA:
 *   accounts:         id, organization_id, name, arr, crm_source, crm_id, created_at
 *   feature_requests: id, organization_id, account_id, feature_name, category,
 *                     deal_stage, notes, submitted_by, source, confidence,
 *                     confidence_note, created_at, blocker_score
 */

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getAuthProfile } from '@/lib/supabase/server';
import KPICards from '@/components/dashboard/KPICards';
import { formatARR, timeAgo } from '@/lib/utils';
import Link from 'next/link';

async function getStats() {
  const auth = await getAuthProfile();
  if (!auth) return null;

  const { admin, orgId } = auth;

  // Accounts + total ARR
  const { data: accounts } = await admin
    .from('accounts')
    .select('id, name, arr')
    .eq('organization_id', orgId);

  const totalARR = accounts?.reduce((sum, a) => sum + (a.arr || 0), 0) || 0;
  const accountCount = accounts?.length || 0;

  // Feature requests count
  const { count: featureCount } = await admin
    .from('feature_requests')
    .select('id', { count: 'exact' })
    .eq('organization_id', orgId);

  // Average blocker score
  const { data: blockerData } = await admin
    .from('feature_requests')
    .select('blocker_score')
    .eq('organization_id', orgId);
  const avgBlocker =
    blockerData && blockerData.length > 0
      ? Math.round(
          (blockerData.reduce((sum, f) => sum + (f.blocker_score || 0), 0) /
            blockerData.length) *
            10
        ) / 10
      : 0;

  // Recent feature requests (with account name via join)
  const { data: recentFeatures } = await admin
    .from('feature_requests')
    .select(`
      id,
      feature_name,
      category,
      deal_stage,
      confidence,
      blocker_score,
      notes,
      created_at,
      accounts:account_id (name, arr)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Top features by blocker score
  const { data: topFeatures } = await admin
    .from('feature_requests')
    .select(`
      id,
      feature_name,
      category,
      blocker_score,
      deal_stage,
      confidence,
      created_at,
      accounts:account_id (name, arr)
    `)
    .eq('organization_id', orgId)
    .order('blocker_score', { ascending: false })
    .limit(3);

  return {
    totalARR,
    accountCount,
    featureCount: featureCount || 0,
    avgBlocker,
    recentFeatures,
    topFeatures,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  if (!stats) {
    redirect('/onboarding');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Revenue-weighted product intelligence · live signals</p>
      </div>

      {/* KPI Cards */}
      <KPICards
        totalARR={stats.totalARR}
        featureCount={stats.featureCount}
        accountCount={stats.accountCount}
        avgBlocker={stats.avgBlocker}
      />

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent feature requests */}
        <div className="card" style={{ padding: '1.4rem 1.6rem' }}>
          <div style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1rem',
            fontWeight: 300,
            color: 'var(--ink)',
            letterSpacing: '0.06em',
            marginBottom: '1.2rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border)',
          }}>
            Recent Requests
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.recentFeatures && stats.recentFeatures.length > 0 ? (
              stats.recentFeatures.map((feature: any) => (
                <div
                  key={feature.id}
                  style={{
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '11px', color: 'var(--ink-dim)', letterSpacing: '0.04em' }}>
                      {(feature.accounts as any)?.name || 'Unknown Account'}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--ink-muted)', letterSpacing: '0.08em' }}>
                      {timeAgo(feature.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {feature.feature_name}{feature.notes ? ` — ${feature.notes}` : ''}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                    <span className="chip" style={{ color: 'var(--gold-dim)', borderColor: 'var(--gold-dim)' }}>
                      {feature.category}
                    </span>
                    {(feature.accounts as any)?.arr && (
                      <span style={{ fontSize: '10px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                        {formatARR((feature.accounts as any).arr)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>No feature requests yet</div>
                <Link href="/dashboard/feedback" className="btn btn-primary" style={{ fontSize: '9px' }}>
                  Add Request
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Top features by blocker score */}
        <div className="card" style={{ padding: '1.4rem 1.6rem' }}>
          <div style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1rem',
            fontWeight: 300,
            color: 'var(--ink)',
            letterSpacing: '0.06em',
            marginBottom: '1.2rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border)',
          }}>
            Top Blockers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.topFeatures && stats.topFeatures.length > 0 ? (
              stats.topFeatures.map((feature: any, i: number) => (
                <div
                  key={feature.id}
                  style={{
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: '1.1rem',
                      color: i === 0 ? 'var(--gold)' : 'var(--border-bright)',
                      fontStyle: 'italic',
                      lineHeight: 1,
                      minWidth: '1rem',
                    }}>
                      {i + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-dim)', lineHeight: 1.4 }}>{feature.feature_name}</div>
                      <div style={{ fontSize: '9px', color: 'var(--ink-muted)', marginTop: '0.2rem', letterSpacing: '0.08em' }}>
                        {(feature.accounts as any)?.name || 'Unknown'} · {feature.deal_stage || 'Active'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    <span style={{ fontSize: '12px', color: 'var(--green)', fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>
                      {(feature.accounts as any)?.arr ? formatARR((feature.accounts as any).arr) : '—'}
                    </span>
                    <span style={{ fontSize: '9px', color: feature.blocker_score >= 4 ? 'var(--orange)' : 'var(--ink-muted)', letterSpacing: '0.08em' }}>
                      BLOCKER {feature.blocker_score}/5
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>No features yet</div>
                <Link href="/dashboard/feedback" className="btn btn-primary" style={{ fontSize: '9px' }}>
                  Add Request
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
