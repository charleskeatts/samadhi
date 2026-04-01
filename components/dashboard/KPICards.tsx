import { formatARR } from '@/lib/utils';
import { KPICardsProps } from '@/types';

export default function KPICards({ totalARR, featureCount, accountCount, avgBlockerScore }: KPICardsProps) {
  const cards = [
    { label: 'Total ARR Tracked',   value: formatARR(totalARR),          accent: 'var(--green)' },
    { label: 'Feature Requests',    value: featureCount.toLocaleString(), accent: 'var(--gold)' },
    { label: 'Active Accounts',     value: accountCount.toLocaleString(), accent: 'var(--gold-dim)' },
    {
      label: 'Avg Blocker Score',
      value: `${avgBlockerScore}/5`,
      accent: avgBlockerScore >= 4 ? 'var(--red)' : avgBlockerScore >= 3 ? 'var(--orange)' : 'var(--border-bright)',
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
          <div style={{ fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '0.6rem' }}>
            {card.label}
          </div>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2rem', fontWeight: 300, color: card.accent, lineHeight: 1 }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
