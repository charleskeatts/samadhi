/**
 * Key Performance Indicator cards
 * Displays 4 main metrics: Total ARR, Feedback Count, Features, Avg Urgency
 */

import { formatARR } from '@/lib/utils';
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
      accent: 'var(--green)',
    },
    {
      label: 'Total Feedback',
      value: feedbackCount.toLocaleString(),
      accent: 'var(--gold)',
    },
    {
      label: 'Features Found',
      value: featureCount.toLocaleString(),
      accent: 'var(--gold-dim)',
    },
    {
      label: 'Avg Urgency',
      value: `${avgUrgency}/10`,
      accent: avgUrgency >= 7 ? 'var(--red)' : avgUrgency >= 5 ? 'var(--orange)' : 'var(--border-bright)',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
      {cards.map((card) => (
        <div
          key={card.label}
          className="card"
          style={{ borderTop: `2px solid ${card.accent}`, borderLeft: 'none', padding: '1rem 1.2rem' }}
        >
          <div style={{
            fontSize: '8px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
            marginBottom: '0.6rem',
          }}>
            {card.label}
          </div>
          <div style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '2rem',
            fontWeight: 300,
            color: card.accent,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
