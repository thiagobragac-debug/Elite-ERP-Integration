import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DataPoint {
  label: string;
  value: number;
}

interface EliteMainChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
}

export const EliteMainChart: React.FC<EliteMainChartProps> = ({ 
  data, 
  color = '#10b981', 
  height = 400 
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  const max = 2.0; 
  const targetStartValue = 1.2;
  const targetEndValue = 1.45;

  const yLabels = [0, 0.4, 0.8, 1.2, 1.6];

  // Cubic Bezier Curve Calculation
  const getPath = (isArea = false) => {
    if (data.length < 2) return '';
    
    let d = `M 0,${100 - (data[0].value / max) * 100}`;
    
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = (i / (data.length - 1)) * 100;
      const y1 = 100 - (data[i].value / max) * 100;
      const x2 = ((i + 1) / (data.length - 1)) * 100;
      const y2 = 100 - (data[i + 1].value / max) * 100;
      
      const cx = (x1 + x2) / 2;
      d += ` C ${cx},${y1} ${cx},${y2} ${x2},${y2}`;
    }
    
    if (isArea) {
      d += ` L 100,100 L 0,100 Z`;
    }
    return d;
  };

  return (
    <div className="elite-premium-chart" style={{ height: `${height}px`, width: '100%', position: 'relative', padding: '0px' }}>
      <svg viewBox="-12 -5 122 120" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines and Y Labels */}
        {yLabels.map((val, idx) => {
          const y = 100 - (val / max) * 100;
          return (
            <g key={idx}>
              <line 
                x1="0" y1={y} x2="100" y2={y} 
                stroke="#f1f5f9" strokeWidth="0.15" 
              />
              <text 
                x="-5" y={y + 0.8} 
                fill="#94a3b8" 
                style={{ fontSize: '2.2px', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}
                textAnchor="end"
              >
                {val === 0 ? '0' : val.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Sloped Target Line (Blue Dashed) */}
        <line 
          x1="0" y1={100 - (targetStartValue / max) * 100} 
          x2="100" y2={100 - (targetEndValue / max) * 100} 
          stroke="#3b82f6" 
          strokeWidth="0.3" 
          strokeDasharray="1,1" 
        />

        {/* Area */}
        <motion.path
          d={getPath(true)}
          fill="url(#areaGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />

        {/* Line */}
        <motion.path
          d={getPath()}
          fill="none"
          stroke={color}
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Dots */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - (d.value / max) * 100;
          return (
            <circle
              key={i}
              cx={x} cy={y}
              r="0.6"
              fill="white"
              stroke={color}
              strokeWidth="0.3"
            />
          );
        })}

        {/* X Labels (Inside SVG for perfect alignment) */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          return (
            <text
              key={i}
              x={x} y="110"
              fill="#94a3b8"
              style={{ fontSize: '2.2px', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}
              textAnchor="middle"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
