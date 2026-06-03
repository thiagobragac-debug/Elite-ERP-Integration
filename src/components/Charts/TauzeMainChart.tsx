import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface DataPoint {
  label: string;
  value: number;
}

interface TauzeMainChartProps {
  data: DataPoint[];
  color?: string;
  height?: number | string;
  mode?: 'line' | 'bar';
  unit?: string;
}

// ── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit, color }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'hsl(var(--bg-card))',
      border: `1.5px solid ${color}`,
      borderRadius: '10px',
      padding: '8px 14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '10px', marginBottom: '2px' }}>
        {payload[0]?.payload?.label}
      </div>
      <div style={{ color, fontWeight: 800, fontSize: '15px' }}>
        {payload[0]?.value}{unit}
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────
export const TauzeMainChart: React.FC<TauzeMainChartProps> = ({
  data,
  color = '#10b981',
  height = 260,
  mode = 'line',
  unit = '',
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        height: typeof height === 'number' ? `${height}px` : height ?? '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        fontSize: '13px',
        fontWeight: 600,
      }}>
        Sem dados para exibir
      </div>
    );
  }

  // Smart Y-axis domain with padding
  const vals = data.map(d => d.value);
  const rawMax = Math.max(...vals);
  const rawMin = Math.min(...vals);
  const range = rawMax - rawMin || rawMax || 1;
  const pad = range * 0.18;
  const domainMin = Math.max(0, Math.floor(rawMin - pad));
  const domainMax = Math.ceil(rawMax + pad * 0.5);

  // Recharts needs { label, value } → use as-is (recharts uses dataKey)
  const chartData = data.map(d => ({ name: d.label, value: d.value }));

  // X-axis tick selector: show max 7 ticks
  const tickInterval = Math.max(0, Math.floor((data.length - 1) / 6));

  const gradId = `grad-${color.replace('#', '')}`;

  if (mode === 'bar') {
    return (
    <div style={{ flex: 1, minHeight: 0, width: '100%' }}>

      <ResponsiveContainer width="100%" height={typeof height === 'number' ? height : '100%'}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            interval={tickInterval}
          />
          <YAxis
            domain={[domainMin, domainMax]}
            tickFormatter={(v) => `${v}${unit}`}
            tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip content={<CustomTooltip unit={unit} color={color} />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={0.25 + (i / chartData.length) * 0.75} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    );
  }

  return (
    <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
    <ResponsiveContainer width="100%" height={typeof height === 'number' ? height : '100%'}>
      <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 20 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.18} />
            <stop offset="75%"  stopColor={color} stopOpacity={0.05} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border) / 0.5)"
          vertical={false}
        />

        <XAxis
          dataKey="name"
          tick={(props: any) => {
            // Start at index 1, then every `step` — gives Sem 02, Sem 04, Sem 06...
            const step = Math.max(1, tickInterval + 1);
            const show = props.index > 0 && (props.index - 1) % step === 0;
            if (!show) return <g />;
            return (
              <text
                x={props.x}
                y={props.y + 10}
                fill="#94a3b8"
                fontSize={10}
                fontFamily="Inter, sans-serif"
                fontWeight={600}
                textAnchor="middle"
              >
                {props.payload.value}
              </text>
            );
          }}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          interval={0}
        />

        <YAxis
          domain={[domainMin, domainMax]}
          tickFormatter={(v) => `${v}${unit}`}
          tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
          tickLine={false}
          axisLine={false}
          width={52}
          tickCount={5}
        />

        <Tooltip
          content={<CustomTooltip unit={unit} color={color} />}
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.4 }}
        />

        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradId})`}
          dot={{ r: 4, fill: 'hsl(var(--bg-card))', stroke: color, strokeWidth: 2 }}
          activeDot={{ r: 6, fill: color, stroke: 'hsl(var(--bg-card))', strokeWidth: 2 }}
          animationDuration={1400}
          animationEasing="ease-in-out"
        />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
};
