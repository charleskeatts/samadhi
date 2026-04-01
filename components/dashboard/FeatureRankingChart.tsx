/**
 * Feature ranking chart
 * Horizontal bar chart showing top features by account ARR
 * Uses actual DB schema: FeatureRequestWithAccount (joined with accounts).
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FeatureRankingChartProps } from '@/types';
import { formatARR } from '@/lib/utils';

export default function FeatureRankingChart({
  features,
  maxItems = 10,
}: FeatureRankingChartProps) {
  const chartData = features.slice(0, maxItems).map((feature) => ({
    name: feature.feature_name.substring(0, 30),
    revenue: feature.accounts?.arr ?? 0,
    account: feature.accounts?.name ?? 'Unknown',
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: '0.75rem 1rem',
          fontSize: '11px',
        }}>
          <p style={{ color: 'var(--ink-dim)', marginBottom: '0.3rem' }}>{data.name}</p>
          <p style={{ color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
            {formatARR(data.revenue)}
          </p>
          <p style={{ color: 'var(--ink-muted)', fontSize: '10px', marginTop: '0.2rem' }}>
            {data.account}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 250, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: 'var(--ink-muted)', fontFamily: '"DM Mono", monospace' }}
        />
        <YAxis
          dataKey="name"
          type="category"
          width={240}
          tick={{ fontSize: 11, fill: 'var(--ink-muted)', fontFamily: '"DM Mono", monospace' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="revenue"
          fill="var(--gold-dim)"
          radius={0}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
