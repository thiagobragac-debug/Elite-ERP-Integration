import React from 'react';

interface TickerSectionProps {
  tickerData: [string, string, string, boolean][];
}

export const TickerSection: React.FC<TickerSectionProps> = ({ tickerData }) => {
  return (
    <div
      style={{
        background: 'rgba(var(--landing-brand),0.07)',
        borderBottom: '1px solid rgba(var(--landing-brand),0.12)',
        overflow: 'hidden',
        height: 36,
      }}
    >
      <div
        style={{
          display: 'flex',
          animation: 'ticker-scroll 28s linear infinite',
          width: 'max-content',
          height: '100%',
          alignItems: 'center',
        }}
      >
        {[...Array(2)].map((_, r) => (
          <div
            key={r}
            style={{
              display: 'flex',
              gap: 40,
              paddingRight: 40,
              alignItems: 'center',
              height: '100%',
            }}
          >
            {tickerData.map(([label, val, chg, up], i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--landing-glass-55)',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                }}
              >
                <span>{label}</span>
                <span style={{ color: 'rgb(var(--landing-text-main))', fontWeight: 800 }}>{val}</span>
                <span style={{ color: up ? 'rgb(var(--landing-brand))' : '#ef4444' }}>
                  {chg}
                </span>
                <span style={{ color: 'var(--landing-glass-15)', margin: '0 8px' }}>|</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
