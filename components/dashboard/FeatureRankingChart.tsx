'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatARR } from '@/lib/utils';

interface Feature {
  feature_name: string;
  blocker_score: number;
  accounts?: { name: string; arr: number } | null;
}

export default function FeatureRankingChart({ features, maxItems = 10 }: { features: Feature[]; maxItems?: number }) {
  const chartData = features.slice(0, maxItems).map((f) => ({
    name: f.feature_name.substring(0, 30),
    arr: f.accounts?.arr || 0,
    blocker: f.blocker_score,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.75rem 1rem', fontSize: '11px' }}>
          <p style={{ color: 'var(--ink-dim)', marginBottom: '0.3rem' }}>{data.name}</p>
          <p style={{ color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>{formatARR(data.arr)}</p>
          <p style={{ color: 'var(--gold-dim)', fontSize: '10px', marginTop: '0.2rem' }}>Blocker: {data.blocker}/5</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 220, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--ink-muted)', fontFamily: '"DM Mono", monospace' }} />
        <YAxis dataKey="name" type="category" width={210} tick={{ fontSize: 11, fill: 'var(--ink-muted)', fontFamily: '"DM Mono", monospace' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="arr" fill="var(--gold-dim)" radius={0} />
      </BarChart>
    </ResponsiveContainer>
  );
}
