import React from 'react';

interface TickerSectionProps {
  tickerData: [string, string, string, boolean][];
}

export const TickerSection: React.FC<TickerSectionProps> = ({ tickerData }) => {
  return (
    <div
      style={{
        background: 'rgba(0,184,101,0.07)',
        borderBottom: '1px solid rgba(0,184,101,0.12)',
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
                  color: 'rgba(255,255,255,0.55)',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                }}
              >
                <span>{label}</span>
                <span style={{ color: '#fff', fontWeight: 800 }}>{val}</span>
                <span style={{ color: up ? '#00b865' : '#ef4444' }}>
                  {chg}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 8px' }}>|</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
