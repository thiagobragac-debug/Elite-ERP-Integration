import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { normalizeSparkline } from './sparklineUtils';

interface TauzeStatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
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
  interpolate?: boolean;
  isEmpty?: boolean;
}

const SPARKLINE_H = 44; // px — must match CSS

const TauzeStatCardComponent: React.FC<TauzeStatCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
  change,
  trend,
  progress,
  sparkline = [],
  loading = false,
  periodLabel = 'Histórico',
  className = '',
  children,
  interpolate = false,
  isEmpty = false,
}) => {
  const effectiveColor = isEmpty ? '#94a3b8' : color;

  const normalizedSparkline = React.useMemo(
    () => normalizeSparkline(sparkline, interpolate),
    [sparkline, interpolate]
  );

  const [mounted, setMounted] = React.useState(false);
  const [hoveredBar, setHoveredBar] = React.useState<number | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return <div className="tauze-kpi-card loading-skeleton" style={{ height: '168px' }} />;
  }

  const maxVal =
    normalizedSparkline.length > 0 ? Math.max(...normalizedSparkline.map((s) => s.value), 1) : 1;
  const minVal =
    normalizedSparkline.length > 0 ? Math.min(...normalizedSparkline.map((s) => s.value)) : 0;
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
            {progress !== undefined && (
              <>
                <circle className="ring-bg" cx="40" cy="40" r="36" />
                <motion.circle
                  className="ring-fill"
                  cx="40"
                  cy="40"
                  r="36"
                  stroke={effectiveColor}
                  initial={{ strokeDasharray: '0 226' }}
                  animate={{ strokeDasharray: `${((isEmpty ? 0 : progress) / 100) * 226} 226` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </>
            )}
          </svg>
          <div className="icon-center" style={{ color: effectiveColor }}>
            {Icon && <Icon size={28} />}
          </div>
        </div>

        <div className="kpi-text-info">
          <span className="kpi-label-tauze">{label}</span>
          <span className="kpi-value-tauze">{value}</span>
          {subtitle && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'hsl(var(--text-muted, 215 25% 27%))',
                letterSpacing: '0.02em',
                marginTop: 2,
                display: 'block',
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </span>
          )}
          {change && (
            <div className={`kpi-trend-tauze ${isEmpty ? 'neutral' : trend || 'up'}`} style={isEmpty ? { background: 'hsl(var(--bg-main) / 0.5)', color: 'hsl(var(--text-muted))' } : {}}>
              {!isEmpty && trend !== 'none' && (
                trend === 'down' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />
              )}
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

      {!children && <div className="kpi-divider" />}

      <div
        className="kpi-footer-tauze"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          flexShrink: 0,
          minHeight: `${SPARKLINE_H}px`,
        }}
      >
        {normalizedSparkline.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 3 }}>
            {/* ── Bars area ───────────────────────────────────────────── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '3px',
                height: `${SPARKLINE_H}px`,
                overflow: 'visible',
                position: 'relative',
              }}
            >
              {/* Tooltip flutuante — data + valor empilhados */}
              {hoveredBar !== null &&
                normalizedSparkline[hoveredBar] &&
                (() => {
                  const item = normalizedSparkline[hoveredBar];
                  const displayValue =
                    item.value >= 1000
                      ? item.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
                      : item.value % 1 !== 0
                        ? item.value.toFixed(2)
                        : item.value.toFixed(0);
                  const hasLabel = item.label && item.label !== String(hoveredBar + 1);

                  const barPct = hoveredBar / Math.max(normalizedSparkline.length - 1, 1);
                  const leftPct = Math.min(Math.max(barPct * 100, 10), 85);

                  return (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: `${SPARKLINE_H + 8}px`,
                        left: `${leftPct}%`,
                        transform: 'translateX(-50%)',
                        background: 'rgba(10,16,35,0.96)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        whiteSpace: 'nowrap',
                        zIndex: 100,
                        pointerEvents: 'none',
                        boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
                        border: `1px solid ${color}55`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      {/* Data no topo */}
                      {hasLabel && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 500,
                            color: '#64748b',
                            letterSpacing: '0.04em',
                            lineHeight: 1,
                          }}
                        >
                          {item.label}
                        </span>
                      )}
                      {/* Valor em destaque */}
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color,
                          letterSpacing: '0.01em',
                          lineHeight: 1.1,
                        }}
                      >
                        {displayValue}
                      </span>
                      {/* Seta inferior */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: -5,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '5px solid transparent',
                          borderRight: '5px solid transparent',
                          borderTop: `5px solid rgba(10,16,35,0.96)`,
                        }}
                      />
                    </div>
                  );
                })()}

              {normalizedSparkline.map((item, i) => {
                const normalized = range === 0 ? 0.5 : (item.value - minVal) / range;
                const targetH = Math.max(4, Math.round((0.18 + normalized * 0.82) * SPARKLINE_H));
                const opacityVal =
                  hoveredBar === i ? 1 : hoveredBar !== null ? 0.3 : 0.45 + normalized * 0.55;

                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: mounted ? `${targetH}px` : '2px',
                      backgroundColor: effectiveColor,
                      opacity: mounted ? (isEmpty ? 0.2 : opacityVal) : 0,
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

            {/* ── Rótulos de período: primeira e última data ───────── */}
            {(() => {
              const first = normalizedSparkline[0]?.label;
              const last = normalizedSparkline[normalizedSparkline.length - 1]?.label;
              if (!first && !last) {
                return null;
              }
              return (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      color: hoveredBar === 0 ? color : '#475569',
                      letterSpacing: '0.03em',
                      lineHeight: 1,
                      transition: 'color 0.15s',
                      userSelect: 'none',
                    }}
                  >
                    {first}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      color: hoveredBar === normalizedSparkline.length - 1 ? color : '#475569',
                      letterSpacing: '0.03em',
                      lineHeight: 1,
                      transition: 'color 0.15s',
                      userSelect: 'none',
                    }}
                  >
                    {last}
                  </span>
                </div>
              );
            })()}
          </div>
        )}
        <span className="period-badge-tauze">{periodLabel}</span>
      </div>
    </motion.div>
  );
};

export const TauzeStatCard = React.memo(TauzeStatCardComponent);
