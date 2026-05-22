import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { normalizeSparkline } from './sparklineUtils';

interface TauzeStatCardProps {
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
  children?: React.ReactNode;
}

const SPARKLINE_H = 44; // px — must match CSS

export const TauzeStatCard: React.FC<TauzeStatCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  change,
  trend,
  progress = 70,
  sparkline = [],
  loading = false,
  periodLabel = 'Histórico',
  className = '',
  children
}) => {
  const normalizedSparkline = React.useMemo(() => normalizeSparkline(sparkline), [sparkline]);

  const [mounted, setMounted] = React.useState(false);
  const [hoveredBar, setHoveredBar] = React.useState<number | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return <div className="tauze-kpi-card loading-skeleton" style={{ height: '220px' }}></div>;
  }

  const maxVal = normalizedSparkline.length > 0 ? Math.max(...normalizedSparkline.map(s => s.value), 1) : 1;
  const minVal = normalizedSparkline.length > 0 ? Math.min(...normalizedSparkline.map(s => s.value)) : 0;
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
          <div className="icon-center" style={{ color: color }}>
            {Icon && <Icon size={28} />}
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

      {children && (
        <div className="kpi-custom-content" style={{ margin: '12px 0', flex: 1 }}>
          {children}
        </div>
      )}

      {!children && <div className="kpi-divider"></div>}

      <div
        className="kpi-footer-tauze"
        style={{ height: `${SPARKLINE_H}px`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexShrink: 0 }}
      >
        {normalizedSparkline.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '3px',
              height: `${SPARKLINE_H}px`,
              flex: 1,
              overflow: 'visible',
              position: 'relative',
            }}
          >
            {/* Tooltip flutuante — aparece imediatamente sem delay do browser */}
            {hoveredBar !== null && normalizedSparkline[hoveredBar] && (() => {
              const item = normalizedSparkline[hoveredBar];
              const displayValue = item.value >= 1000
                ? item.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
                : item.value % 1 !== 0
                  ? item.value.toFixed(2)
                  : item.value.toFixed(0);
              const tooltipText = item.label && item.label !== String(hoveredBar + 1)
                ? item.label
                : displayValue;

              // Posição horizontal do tooltip: alinha com a barra, evita sair das bordas
              const barPct = hoveredBar / Math.max(normalizedSparkline.length - 1, 1);
              const leftPct = Math.min(Math.max(barPct * 100, 8), 82);

              return (
                <div
                  style={{
                    position: 'absolute',
                    bottom: `${SPARKLINE_H + 6}px`,
                    left: `${leftPct}%`,
                    transform: 'translateX(-50%)',
                    background: 'rgba(15,23,42,0.92)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '4px 9px',
                    fontSize: '11px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    zIndex: 100,
                    pointerEvents: 'none',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                    border: `1px solid ${color}44`,
                    letterSpacing: '0.02em',
                  }}
                >
                  <span style={{ color: color }}>{displayValue}</span>
                  {item.label && item.label !== tooltipText && (
                    <span style={{ color: '#94a3b8', marginLeft: 5 }}>{item.label}</span>
                  )}
                  {/* seta inferior */}
                  <div style={{
                    position: 'absolute',
                    bottom: -5,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: `5px solid rgba(15,23,42,0.92)`,
                  }} />
                </div>
              );
            })()}

            {normalizedSparkline.map((item, i) => {
              const normalized = range === 0 ? 0.5 : (item.value - minVal) / range;
              const targetH = Math.max(4, Math.round((0.18 + normalized * 0.82) * SPARKLINE_H));
              const opacityVal = hoveredBar === i ? 1 : (hoveredBar !== null ? 0.3 : (0.45 + normalized * 0.55));

              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: mounted ? `${targetH}px` : '2px',
                    backgroundColor: color,
                    opacity: mounted ? opacityVal : 0,
                    borderRadius: '3px 3px 0 0',
                    transition: `height ${0.35 + i * 0.02}s ease-out ${i * 0.02}s, opacity 0.15s ease-out`,
                    position: 'relative',
                    cursor: 'crosshair',
                    alignSelf: 'flex-end',
                    transform: hoveredBar === i ? 'scaleY(1.06)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                  }}
                />
              );
            })}
          </div>
        )}
        <span className="period-badge-tauze">{periodLabel}</span>
      </div>
    </motion.div>
  );
};
