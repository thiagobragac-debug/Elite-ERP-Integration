import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EliteStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  change?: string;
  trend?: 'up' | 'down';
  progress?: number;
  sparkline?: { value: number; label: string }[];
  loading?: boolean;
  periodLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export const EliteStatCard: React.FC<EliteStatCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  change,
  trend,
  progress = 70,
  sparkline = [
    { value: 40, label: '40' }, { value: 50, label: '50' }, { value: 45, label: '45' }, 
    { value: 60, label: '60' }, { value: 55, label: '55' }, { value: 70, label: '70' }, 
    { value: 65, label: '65' }, { value: 80, label: '80' }
  ],
  loading = false,
  periodLabel = 'Últimos 30 dias',
  className = '',
  children
}) => {
  if (loading) {
    return <div className="elite-kpi-card loading-skeleton" style={{ height: '220px' }}></div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`elite-kpi-card ${className}`}
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
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="icon-center" style={{ color: color }}>
            <Icon size={28} />
          </div>
        </div>

        <div className="kpi-text-info">
          <span className="kpi-label-elite">{label}</span>
          <span className="kpi-value-elite">{value}</span>
          {change && (
            <div className={`kpi-trend-elite ${trend || 'up'}`}>
              {trend === 'down' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
              <span>{change} vs mês ant.</span>
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

      <div className="kpi-footer-elite">
        <div className="kpi-sparkline" style={{ color: color }}>
          {(() => {
            const maxVal = Math.max(...sparkline.map(s => s.value), 1);
            return sparkline.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(item.value / maxVal) * 100}%` }}
                transition={{ delay: 0.2 + (i * 0.05) }}
                className="spark-bar"
                style={{ 
                  backgroundColor: color,
                  opacity: 0.2 + (item.value / maxVal) * 0.8
                }}
                whileHover={{ opacity: 1, scaleY: 1.1 }}
              >
                <div className="spark-tooltip">{item.label}</div>
              </motion.div>
            ));
          })()}
        </div>
        <span className="period-badge-elite">{periodLabel}</span>
      </div>
    </motion.div>
  );
};
