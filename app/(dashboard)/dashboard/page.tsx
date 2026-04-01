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

  const { count: featureCount } = await admin
    .from('feature_requests')
    .select('id', { count: 'exact' })
    .eq('organization_id', orgId);

  const { count: accountCount } = await admin
    .from('accounts')
    .select('id', { count: 'exact' })
    .eq('organization_id', orgId);

  // Total ARR = sum of all accounts in this org
  const { data: accountData } = await admin
    .from('accounts')
    .select('arr')
    .eq('organization_id', orgId);
  const totalARR = accountData?.reduce((sum, a) => sum + (a.arr || 0), 0) || 0;

  // Average blocker score across feature requests
  const { data: blockerData } = await admin
    .from('feature_requests')
    .select('blocker_score')
    .eq('organization_id', orgId);
  const avgBlockerScore =
    blockerData && blockerData.length > 0
      ? Math.round(blockerData.reduce((sum, f) => sum + (f.blocker_score || 0), 0) / blockerData.length)
      : 0;

  // Recent feature requests with account join
  const { data: recentFeatures } = await admin
    .from('feature_requests')
    .select('id, feature_name, category, blocker_score, deal_stage, created_at, account_id, accounts:account_id(name, arr)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Top features by account ARR (highest-value accounts first)
  const { data: topFeatures } = await admin
    .from('feature_requests')
    .select('id, feature_name, category, blocker_score, deal_stage, notes, account_id, accounts:account_id(name, arr)')
    .eq('organization_id', orgId)
    .order('blocker_score', { ascending: false })
    .limit(5);

  return {
    totalARR,
    featureCount: featureCount || 0,
    accountCount: accountCount || 0,
    avgBlockerScore,
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
      <div>
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Revenue-weighted product intelligence · live signals</p>
      </div>

      <KPICards
        totalARR={stats.totalARR}
        featureCount={stats.featureCount}
        accountCount={stats.accountCount}
        avgBlockerScore={stats.avgBlockerScore}
      />

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
              stats.recentFeatures.map((f: any) => (
                <div key={f.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '11px', color: 'var(--ink-dim)' }}>
                      {(f.accounts as any)?.name || 'Unknown Account'}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--ink-muted)', letterSpacing: '0.08em' }}>
                      {timeAgo(f.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                    {f.feature_name}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
                    {f.category && (
                      <span className="chip" style={{ color: 'var(--gold-dim)', borderColor: 'rgba(200,152,43,0.35)' }}>
                        {f.category}
                      </span>
                    )}
                    {(f.accounts as any)?.arr > 0 && (
                      <span style={{ fontSize: '10px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                        {formatARR((f.accounts as any).arr)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                  No requests yet
                </div>
                <Link href="/dashboard/feedback" className="btn btn-primary" style={{ fontSize: '9px' }}>
                  Log Feature Request
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
            Highest Priority
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stats.topFeatures && stats.topFeatures.length > 0 ? (
              stats.topFeatures.map((f: any, i: number) => (
                <div key={f.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--border)',
                  gap: '1rem',
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: '1.1rem',
                      color: i === 0 ? 'var(--gold)' : 'var(--border-bright)',
                      fontStyle: 'italic',
                      lineHeight: 1,
                    }}>{i + 1}</span>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-dim)', lineHeight: 1.4 }}>{f.feature_name}</div>
                      <div style={{ fontSize: '9px', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                        {(f.accounts as any)?.name || '—'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    {(f.accounts as any)?.arr > 0 && (
                      <span style={{ fontSize: '11px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                        {formatARR((f.accounts as any).arr)}
                      </span>
                    )}
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: f.blocker_score >= 5 ? 'var(--red)' : f.blocker_score >= 4 ? 'var(--orange)' : 'var(--gold-dim)',
                      flexShrink: 0,
                    }} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.12em' }}>No features yet</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
