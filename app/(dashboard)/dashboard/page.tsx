/**
 * Dashboard overview page
 * Shows key metrics and recent activity
 */

export const dynamic = 'force-dynamic';

import { getAuthProfile } from '@/lib/supabase/server';
import KPICards from '@/components/dashboard/KPICards';
import FeatureRankingChart from '@/components/dashboard/FeatureRankingChart';
import { formatARR, timeAgo } from '@/lib/utils';
import Link from 'next/link';

async function getStats() {
  const auth = await getAuthProfile();
  if (!auth) return null;

  const { admin, orgId } = auth;

  const { count: feedbackCount } = await admin
    .from('feedback')
    .select('id', { count: 'exact' })
    .eq('org_id', orgId);

  const { data: feedbackData } = await admin
    .from('feedback')
    .select('revenue_weight')
    .eq('org_id', orgId);
  const totalARR = feedbackData?.reduce((sum, f) => sum + (f.revenue_weight || 0), 0) || 0;

  const { count: featureCount } = await admin
    .from('feature_requests')
    .select('id', { count: 'exact' })
    .eq('org_id', orgId);

  const { data: urgencyData } = await admin
    .from('feedback')
    .select('urgency_score')
    .eq('org_id', orgId);
  const avgUrgency =
    urgencyData && urgencyData.length > 0
      ? Math.round(urgencyData.reduce((sum, f) => sum + f.urgency_score, 0) / urgencyData.length)
      : 0;

  const { data: recentFeedback } = await admin
    .from('feedback')
    .select(`
      id,
      raw_text,
      revenue_weight,
      category,
      created_at,
      accounts:account_id (name)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: topFeatures } = await admin
    .from('feature_requests')
    .select('id, org_id, title, description, total_revenue_weight, account_count, feedback_ids, roadmap_status, category, blocker_score, created_at, updated_at')
    .eq('org_id', orgId)
    .order('total_revenue_weight', { ascending: false })
    .limit(3);

  return {
    totalARR,
    feedbackCount: feedbackCount || 0,
    featureCount: featureCount || 0,
    avgUrgency,
    recentFeedback,
    topFeatures,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-muted)', fontSize: '11px', letterSpacing: '0.12em' }}>
        Loading...
      </div>
    );
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
        feedbackCount={stats.feedbackCount}
        featureCount={stats.featureCount}
        avgUrgency={stats.avgUrgency}
      />

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent feedback */}
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
            Recent Feedback
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.recentFeedback && stats.recentFeedback.length > 0 ? (
              stats.recentFeedback.map((feedback: any) => (
                <div
                  key={feedback.id}
                  style={{
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '11px', color: 'var(--ink-dim)', letterSpacing: '0.04em' }}>
                      {(feedback.accounts as any)?.name || 'Unknown Account'}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--ink-muted)', letterSpacing: '0.08em' }}>
                      {timeAgo(feedback.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {feedback.raw_text}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                    <span className="chip" style={{ color: 'var(--gold-dim)', borderColor: 'var(--gold-dim)' }}>
                      {feedback.category}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
                      {formatARR(feedback.revenue_weight)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>No feedback yet</div>
                <Link href="/dashboard/feedback" className="btn btn-primary" style={{ fontSize: '9px' }}>
                  Add Feedback
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Top features */}
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
            Top Features
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
                      <div style={{ fontSize: '12px', color: 'var(--ink-dim)', lineHeight: 1.4 }}>{feature.title}</div>
                      <div style={{ fontSize: '9px', color: 'var(--ink-muted)', marginTop: '0.2rem', letterSpacing: '0.08em' }}>
                        {feature.account_count} account{feature.account_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--green)', fontFamily: '"DM Mono", monospace', whiteSpace: 'nowrap' }}>
                    {formatARR(feature.total_revenue_weight)}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>No features yet</div>
                <Link href="/dashboard/feedback" className="btn btn-primary" style={{ fontSize: '9px' }}>
                  Add Feedback
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature ranking chart */}
      {stats.topFeatures && stats.topFeatures.length > 0 && (
        <div className="card" style={{ padding: '1.4rem 1.6rem' }}>
          <div style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1rem',
            fontWeight: 300,
            color: 'var(--ink)',
            letterSpacing: '0.06em',
            marginBottom: '1.2rem',
          }}>
            Feature Revenue Impact
          </div>
          <FeatureRankingChart features={stats.topFeatures} />
        </div>
      )}
    </div>
  );
}
