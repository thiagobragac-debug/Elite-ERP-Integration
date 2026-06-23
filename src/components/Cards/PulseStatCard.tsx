import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { normalizeSparkline } from './sparklineUtils';

interface PulseStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  change?: string;
  trend?: 'up' | 'down';
  progress?: number;
  sparkline?: { value: number; label?: string }[];
  loading?: boolean;
  periodLabel?: string;
  className?: string;
}

const SPARKLINE_H = 44; // px

export const PulseStatCard: React.FC<PulseStatCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  change,
  trend,
  progress = 70,
  sparkline = [],
  loading = false,
  periodLabel = 'Últimos 30 dias',
  className = '',
}) => {
  const normalized = React.useMemo(() => normalizeSparkline(sparkline), [sparkline]);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return <div className="tauze-kpi-card loading-skeleton" style={{ height: '168px' }} />;
  }

  const hasData = normalized.length > 0 && normalized.some((s) => s.value > 0);
  const dataToRender = hasData
    ? normalized
    : Array(15)
        .fill(null)
        .map(() => ({ value: 0, label: 'Sem Histórico' }));

  const maxVal = Math.max(...dataToRender.map((s) => s.value), 1);
  const minVal = hasData ? Math.min(...dataToRender.map((s) => s.value)) : 0;
  const range = maxVal - minVal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`tauze-kpi-card ${className}`}
    >
      <div className="kpi-main-content">
        <div className="viz-circle-wrapper">
          <svg className="viz-svg-ring">
            <circle className="ring-bg" cx="40" cy="40" r="36" />
            <motion.circle
              className="ring-fill"
              cx="40"
              cy="40"
              r="36"
              stroke={color}
              initial={{ strokeDasharray: '0 226' }}
              animate={{ strokeDasharray: `${(progress / 100) * 226} 226` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="icon-center" style={{ color }}>
            <Icon size={28} />
          </div>
        </div>

        <div className="kpi-text-info">
          <span className="kpi-label-tauze">{label}</span>
          <span className="kpi-value-tauze">{value}</span>
          {change && (
            <div className={`kpi-trend-tauze ${trend || 'up'}`}>
              {trend === 'down' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
              <span>{change}</span>
            </div>
          )}
        </div>
      </div>

      <div className="kpi-divider" />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          height: `${SPARKLINE_H}px`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '3px',
            height: `${SPARKLINE_H}px`,
            flex: 1,
            overflow: 'visible',
          }}
        >
          {dataToRender.map((item, i) => {
            const ratio = range === 0 ? 1 : (item.value - minVal) / range;
            const targetH = hasData
              ? Math.max(4, Math.round((0.18 + ratio * 0.82) * SPARKLINE_H))
              : Math.round(0.15 * SPARKLINE_H);
            const opacityVal = hasData ? 0.35 + ratio * 0.65 : 0.2;

            const displayValue =
              hasData && item.value >= 1000
                ? item.value.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0,
                  })
                : hasData && item.value % 1 !== 0
                  ? item.value.toFixed(2)
                  : hasData
                    ? item.value.toFixed(0)
                    : null;

            return (
              <div
                key={i}
                title={
                  item.label && displayValue
                    ? `${displayValue} — ${item.label}`
                    : item.label || displayValue || ''
                }
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: mounted ? `${targetH}px` : '2px',
                  backgroundColor: color,
                  opacity: mounted ? opacityVal : 0,
                  borderRadius: '3px 3px 0 0',
                  transition: `height ${0.35 + i * 0.02}s ease-out ${i * 0.02}s, opacity 0.3s ease-out ${i * 0.02}s`,
                  alignSelf: 'flex-end',
                }}
              />
            );
          })}
        </div>
        <span className="period-badge-tauze">{periodLabel}</span>
      </div>
    </motion.div>
  );
};
