/**
 * Key Performance Indicator cards
 * Displays 4 main metrics: Total ARR, Feedback Count, Features, Avg Urgency
 */

import { formatARR } from '@/lib/utils';
import { DollarSign, MessageSquare, Layers, Zap } from 'lucide-react';
import { KPICardsProps } from '@/types';

export default function KPICards({
  totalARR,
  feedbackCount,
  featureCount,
  avgUrgency,
}: KPICardsProps) {
  const cards = [
    {
      label: 'ARR at Stake',
      value: formatARR(totalARR),
      icon: DollarSign,
      color: 'bg-green-100',
      textColor: 'text-green-700',
      iconColor: 'text-green-600',
    },
    {
      label: 'Total Feedback',
      value: feedbackCount.toLocaleString(),
      icon: MessageSquare,
      color: 'bg-blue-100',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Features Found',
      value: featureCount.toLocaleString(),
      icon: Layers,
      color: 'bg-purple-100',
      textColor: 'text-purple-700',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Avg Urgency',
      value: `${avgUrgency}/10`,
      icon: Zap,
      color: 'bg-amber-100',
      textColor: 'text-amber-700',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-2">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
