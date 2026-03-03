/**
 * Feature ranking chart
 * Horizontal bar chart showing top features by revenue weight
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FeatureRankingChartProps } from '@/types';
import { formatARR } from '@/lib/utils';

export default function FeatureRankingChart({
  features,
  maxItems = 10,
}: FeatureRankingChartProps) {
  // Prepare data for chart
  const chartData = features.slice(0, maxItems).map((feature) => ({
    name: feature.title.substring(0, 30),
    revenue: feature.total_revenue_weight,
    accounts: feature.account_count,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-medium text-slate-900 text-sm">{data.name}</p>
          <p className="text-sky-600 font-semibold text-sm">
            {formatARR(data.revenue)}
          </p>
          <p className="text-slate-500 text-xs">
            {data.accounts} account{data.accounts !== 1 ? 's' : ''}
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
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={240} tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="revenue"
          fill="#0ea5e9"
          radius={[0, 8, 8, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
