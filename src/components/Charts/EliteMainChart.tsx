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
  mode?: 'line' | 'bar';
}

export const EliteMainChart: React.FC<EliteMainChartProps> = ({ 
  data, 
  color = '#10b981', 
  height = 400,
  mode = 'line'
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  const max = Math.max(...data.map(d => d.value), 2.0); 
  const targetStartValue = 1.2;
  const targetEndValue = 1.45;

  const yLabels = [0, 0.4, 0.8, 1.2, 1.6].filter(v => v <= max);
  if (max > 1.6) yLabels.push(Number(max.toFixed(1)));

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
                {val.toFixed(1)}
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
          opacity="0.6"
        />

        {mode === 'line' ? (
          <>
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
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}
          </>
        ) : (
          /* Bar Mode with Heat Map */
          <g>
            {data.map((d, i) => {
              const width = 100 / data.length;
              const barWidth = width * 0.7;
              const x = (i * width) + (width - barWidth) / 2;
              const h = (d.value / max) * 100;
              const y = 100 - h;
              
              // Heat map opacity logic
              const opacity = 0.2 + (d.value / max) * 0.8;

              return (
                <motion.rect
                  key={i}
                  x={x}
                  y={100}
                  width={barWidth}
                  height={0}
                  initial={{ height: 0, y: 100 }}
                  animate={{ height: h, y: y }}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                  fill={color}
                  opacity={opacity}
                  rx="0.5"
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <title>{d.label}: {d.value}</title>
                </motion.rect>
              );
            })}
          </g>
        )}

        {/* X Labels */}
        {data.map((d, i) => {
          const width = 100 / data.length;
          const x = mode === 'line' 
            ? (i / (data.length - 1)) * 100 
            : (i * width) + width / 2;
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
