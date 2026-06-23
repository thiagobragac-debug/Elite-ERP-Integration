import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {
      dias: 0,
      horas: 0,
      minutos: 0,
      segundos: 0,
    };

    if (difference > 0) {
      timeLeft = {
        dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
        horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((difference / 1000 / 60) % 60),
        segundos: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  const pad = (num: number) => num.toString().padStart(2, '0');

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: 700,
            minWidth: 28,
            textAlign: 'center',
          }}
        >
          {pad(timeLeft.dias)}
          <span style={{ fontSize: 10, display: 'block', fontWeight: 400 }}>dias</span>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: 700,
            minWidth: 28,
            textAlign: 'center',
          }}
        >
          {pad(timeLeft.horas)}
          <span style={{ fontSize: 10, display: 'block', fontWeight: 400 }}>hrs</span>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: 700,
            minWidth: 28,
            textAlign: 'center',
          }}
        >
          {pad(timeLeft.minutos)}
          <span style={{ fontSize: 10, display: 'block', fontWeight: 400 }}>min</span>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: 700,
            minWidth: 28,
            textAlign: 'center',
          }}
        >
          {pad(timeLeft.segundos)}
          <span style={{ fontSize: 10, display: 'block', fontWeight: 400 }}>seg</span>
        </div>
      </div>
    </div>
  );
};
