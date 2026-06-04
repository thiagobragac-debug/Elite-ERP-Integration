import React, { useState, useEffect } from 'react';

function buildSparkline(records: any[], dateField: string, valueField: string | null, buckets = 7): { value: number; label: string }[] {
  if (!records || records.length === 0) return [];
  const sorted = [...records].filter(r => r[dateField]).sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) return [];
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter(r => { const t = new Date(r[dateField]).getTime(); return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd; });
    const v = inBucket.length === 0 ? 0 : valueField ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0) : inBucket.length;
    const d = i === buckets - 1 && inBucket.length > 0
      ? new Date(inBucket[inBucket.length - 1][dateField])
      : i === 0 && inBucket.length > 0
        ? new Date(inBucket[0][dateField])
        : new Date(bStart + bucketMs / 2);
    return { value: Number(v.toFixed(2)), label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
  });
}
import { supabase } from '../../lib/supabase';
import { fetchHistoricalQuotes } from '../../lib/marketQueries';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceDot
} from 'recharts';
import { Globe, TrendingUp, TrendingDown, Filter, Crosshair, FileText, DollarSign, Activity, BarChart2, Zap } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

interface QuoteData {
  date: string;
  value: number;
  displayDate: string;
  mma7: number | null;
  mma30: number | null;
  bbUpper: number | null;
  bbLower: number | null;
}

export const MarketAdvancedAnalytics: React.FC = () => {
  const [data, setData] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [indicator, setIndicator] = useState('boi_gordo_cepea');
  
  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Toggles
  const [showMMA7, setShowMMA7] = useState(false);
  const [showMMA30, setShowMMA30] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);

  // Extremes
  const [extremePoints, setExtremePoints] = useState<{max: any, min: any} | null>(null);

  // Fetch initial date limits
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [indicator, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const extendedStart = new Date(startDate);
      extendedStart.setDate(extendedStart.getDate() - 45); 
      const startStr = extendedStart.toISOString().split('T')[0];

      let rawData: any[] = [];

      if (indicator === 'relacao_bezerro_boi') {
        const [boiData, bezerroData] = await Promise.all([
          fetchHistoricalQuotes('boi_gordo_cepea', startStr, endDate, true),
          fetchHistoricalQuotes('bezerro_ms_cepea', startStr, endDate, true)
        ]);

        const boiMap = new Map(boiData.map(d => [d.date, Number(d.value)]));
        rawData = bezerroData.map(bz => {
          const boiVal = boiMap.get(bz.date);
          // Ratio: Bezerro Price / Boi Gordo Price (How many @ of Boi to buy 1 Bezerro)
          if (boiVal && boiVal > 0) {
            return { date: bz.date, value: Number(bz.value) / boiVal };
          }
          return null;
        }).filter(Boolean);
      } else if (indicator === 'relacao_boi_milho') {
        const [boiData, milhoData] = await Promise.all([
          fetchHistoricalQuotes('boi_gordo_cepea', startStr, endDate, true),
          fetchHistoricalQuotes('milho_cepea', startStr, endDate, true)
        ]);

        const milhoMap = new Map(milhoData.map(d => [d.date, Number(d.value)]));
        rawData = boiData.map(boi => {
          const milhoVal = milhoMap.get(boi.date);
          // Ratio: Boi Price / Milho Price (How many sacas of Milho to buy 1 @ of Boi)
          if (milhoVal && milhoVal > 0) {
            return { date: boi.date, value: Number(boi.value) / milhoVal };
          }
          return null;
        }).filter(Boolean);
      } else {
        rawData = await fetchHistoricalQuotes(indicator, startStr, endDate, true);
      }

      // Calculate Math
      const processed: QuoteData[] = [];
      let maxPoint = null;
      let minPoint = null;

      for (let i = 0; i < rawData.length; i++) {
        const current = rawData[i];
        const val = Number(current.value);
        
        let mma7 = null;
        let mma30 = null;
        let bbUpper = null;
        let bbLower = null;

        // MMA 7
        if (i >= 6) {
          let sum = 0;
          for (let j = i - 6; j <= i; j++) sum += Number(rawData[j].value);
          mma7 = sum / 7;
        }

        // MMA 30
        if (i >= 29) {
          let sum = 0;
          for (let j = i - 29; j <= i; j++) sum += Number(rawData[j].value);
          mma30 = sum / 30;
        }

        // Bollinger Bands (20 days, 2 standard deviations)
        if (i >= 19) {
          let sum20 = 0;
          for (let j = i - 19; j <= i; j++) sum20 += Number(rawData[j].value);
          const sma20 = sum20 / 20;

          let varianceSum = 0;
          for (let j = i - 19; j <= i; j++) {
            varianceSum += Math.pow(Number(rawData[j].value) - sma20, 2);
          }
          const variance = varianceSum / 20;
          const stdDev = Math.sqrt(variance);

          bbUpper = sma20 + (stdDev * 2);
          bbLower = sma20 - (stdDev * 2);
        }

        if (current.date >= startDate) {
          const d = new Date(current.date.split('T')[0] + 'T12:00:00Z');
          const pt = {
            date: current.date,
            value: val,
            displayDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
            mma7,
            mma30,
            bbUpper,
            bbLower
          };
          processed.push(pt);

          if (!maxPoint || val > maxPoint.value) maxPoint = pt;
          if (!minPoint || val < minPoint.value) minPoint = pt;
        }
      }

      setData(processed);
      setExtremePoints({ max: maxPoint, min: minPoint });

    } catch (err) {
      console.error('Failed to fetch market data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = data.map(item => ({
      Data: item.displayDate,
      Valor_Principal: item.value.toFixed(3),
      MMA7: item.mma7 ? item.mma7.toFixed(3) : '',
      MMA30: item.mma30 ? item.mma30.toFixed(3) : '',
      Banda_Superior: item.bbUpper ? item.bbUpper.toFixed(3) : '',
      Banda_Inferior: item.bbLower ? item.bbLower.toFixed(3) : '',
    }));
    const filename = `analise_avancada_${indicator}`;
    if (format === 'csv') exportToCSV(exportData, filename);
    else if (format === 'excel') exportToExcel(exportData, filename);
    else if (format === 'pdf') exportToPDF(exportData, filename, 'Análise Avançada de Mercado');
  };

  const isRatio = indicator === 'relacao_bezerro_boi' || indicator === 'relacao_boi_milho';
  const prefix = isRatio ? '' : 'R$ ';
  const suffix = indicator === 'relacao_bezerro_boi' ? ' @' : indicator === 'relacao_boi_milho' ? ' sc' : '';

  // Compute KPIs from loaded data
  const currentValue = data.length > 0 ? data[data.length - 1].value : null;
  const firstValue = data.length > 0 ? data[0].value : null;
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value)) : null;
  const minValue = data.length > 0 ? Math.min(...data.map(d => d.value)) : null;
  const periodChange = currentValue && firstValue ? ((currentValue - firstValue) / firstValue) * 100 : null;
  const volatility = data.length > 1 ? (() => {
    const mean = data.reduce((s, d) => s + d.value, 0) / data.length;
    const variance = data.reduce((s, d) => s + Math.pow(d.value - mean, 2), 0) / data.length;
    return (Math.sqrt(variance) / mean) * 100;
  })() : null;

  const fmtVal = (v: number | null) => v !== null ? `${prefix}${v.toFixed(isRatio ? 3 : 2)}${suffix}` : 'â€”';

  // Build 7-point sparkline from actual price series (last 7 points)
  const sparkFromData = (n: number = 7) => {
    const pts = data.filter(d => d.value != null).slice(-n);
    while (pts.length < n && pts.length > 0) pts.unshift(pts[0]);
    return pts.map(d => ({ value: d.value, label: d.displayDate }));
  };

  const kpis = [
    {
      label: 'Cotação Atual',
      value: fmtVal(currentValue),
      icon: DollarSign,
      color: '#10b981',
      progress: maxValue && minValue && currentValue ? ((currentValue - minValue) / (maxValue - minValue)) * 100 : 0,
      change: periodChange !== null ? `${periodChange >= 0 ? '+' : ''}${periodChange.toFixed(1)}% no período` : 'Carregando...',
      trend: periodChange !== null ? (periodChange >= 0 ? 'up' : 'down') : undefined,
      sparkline: sparkFromData(),
      periodLabel: 'Personalizado'
    },
    {
      label: 'Máxima do Período',
      value: fmtVal(maxValue),
      icon: TrendingUp,
      color: '#ef4444',
      progress: 100,
      change: extremePoints?.max ? extremePoints.max.displayDate : 'â€”',
      sparkline: sparkFromData(),
      periodLabel: extremePoints?.max ? extremePoints.max.displayDate : 'Período'
    },
    {
      label: 'Mínima do Período',
      value: fmtVal(minValue),
      icon: TrendingDown,
      color: '#3b82f6',
      progress: 0,
      change: extremePoints?.min ? extremePoints.min.displayDate : 'â€”',
      sparkline: sparkFromData(),
      periodLabel: extremePoints?.min ? extremePoints.min.displayDate : 'Período'
    },
    {
      label: 'Volatilidade',
      value: volatility !== null ? `${volatility.toFixed(1)}%` : 'â€”',
      icon: Activity,
      color: '#f59e0b',
      progress: volatility !== null ? Math.min(volatility * 5, 100) : 0,
      change: volatility !== null ? (volatility < 5 ? 'Mercado Estável' : volatility < 15 ? 'Volatilidade Moderada' : 'Alta Volatilidade') : 'â€”',
      sparkline: buildSparkline(data || [], 'data', 'preco'),
      periodLabel: 'Análise Técnica'
    }
  ];

  return (
    <div className="admin-intelligence-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Mercado', href: '/mercado/indicadores' }, { label: 'Análise Avançada' }]} />
          <h1 className="page-title">Análise Avançada</h1>
          <p className="page-subtitle">Ferramentas de análise gráfica, médias móveis e identificação de topos e fundos</p>
        </div>
      </header>

      {/* KPI Dashboard padronizado */}
      <div className="next-gen-kpi-grid" style={{ marginBottom: '24px' }}>
        {loading
          ? Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
          : kpis.map((kpi, idx) => (
              <TauzeStatCard
                key={idx}
                label={kpi.label}
                value={kpi.value}
                icon={kpi.icon}
                color={kpi.color}
                progress={kpi.progress}
                change={kpi.change}
                trend={kpi.trend as any}
                sparkline={kpi.sparkline}
                periodLabel={kpi.periodLabel}
              />
            ))
        }
      </div>

      <div className="panel-header-tauze" style={{ background: 'hsl(var(--bg-main))', padding: '16px', borderRadius: '16px', border: '1px solid hsl(var(--border))', marginBottom: '24px', height: 'fit-content', flex: 'none' }}>

            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-end', width: '100%' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '250px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Indicador</label>
                <select 
                  value={indicator} 
                  onChange={(e) => setIndicator(e.target.value)}
                  className="market-select-tauze"
                  style={{ height: '42px', padding: '0 12px', width: '100%' }}
                >
                  <option value="boi_gordo_cepea">Boi Gordo (CEPEA) - R$/@</option>
                  <option value="bezerro_ms_cepea">Bezerro MS (CEPEA) - R$/cabeça</option>
                  <option value="bezerro_sp_cepea">Bezerro SP (CEPEA) - R$/cabeça</option>
                  <option value="milho_cepea">Milho (CEPEA) - R$/saca 60kg</option>
                  <option value="relacao_bezerro_boi">Relação Bezerro/Boi (Qtd @)</option>
                  <option value="relacao_boi_milho">Relação Boi/Milho (Qtd sacas)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtro Rápido (Ano)</label>
                <select 
                  className="market-select-tauze" 
                  style={{ height: '42px', padding: '0 12px' }}
                  onChange={(e) => {
                    const year = e.target.value;
                    if (year) {
                      setStartDate(`${year}-01-01`);
                      setEndDate(`${year}-12-31`);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Selecione um ano...</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                  <option value="2019">2019</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Período Customizado (De / Até)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="date" 
                    className="market-select-tauze" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    style={{ height: '42px', padding: '0 12px' }}
                  />
                  <input 
                    type="date" 
                    className="market-select-tauze" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    style={{ height: '42px', padding: '0 12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', height: '42px', paddingLeft: '24px', borderLeft: '1px solid hsl(var(--border))', flex: 1, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: 'hsl(var(--text-main))' }}>
                    <input type="checkbox" checked={showBollinger} onChange={e => setShowBollinger(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#14b8a6' }} />
                    Bollinger (20d)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: 'hsl(var(--text-main))' }}>
                    <input type="checkbox" checked={showMMA7} onChange={e => setShowMMA7(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#f59e0b' }} />
                    MMA 7 Dias
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: 'hsl(var(--text-main))' }}>
                    <input type="checkbox" checked={showMMA30} onChange={e => setShowMMA30(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#8b5cf6' }} />
                    MMA 30 Dias
                  </label>
                </div>

                <div className="export-dropdown-container" style={{ position: 'relative' }}>
                <button 
                  className="glass-btn secondary icon-only" 
                  title="Exportar Série Histórica"
                  style={{ height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => {
                    const menu = document.getElementById('export-menu-analytics');
                    if (menu) menu.classList.toggle('active');
                  }}
                >
                  <FileText size={18} />
                </button>
                <div id="export-menu-analytics" className="export-menu" style={{ top: '50px', right: '0' }}>
                  <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-analytics')?.classList.remove('active'); }}>Excel (.CSV)</button>
                  <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-analytics')?.classList.remove('active'); }}>Excel (.xlsx)</button>
                  <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-analytics')?.classList.remove('active'); }}>PDF</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-intelligence-grid" style={{ gridTemplateColumns: '1fr' }}>
        <section className="intelligence-panel premium-card main-chart">
          
          <div className="chart-container-large" style={{ marginTop: '20px' }}>
            {loading ? (
              <div style={{ height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="loading-text">Processando cálculos matemáticos...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={450}>
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--brand))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--brand))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBollinger" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.15}/>
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="displayDate" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }}
                    dy={10}
                    minTickGap={40}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }}
                    tickFormatter={(value) => `${prefix}${value}${suffix}`}
                    width={isRatio ? 40 : 60}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--bg-card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      color: 'hsl(var(--text-main))'
                    }}
                    labelStyle={{ color: 'hsl(var(--text-muted))', marginBottom: '8px', fontWeight: 'bold' }}
                    formatter={(val: any, name: any) => {
                      if (name === 'value') return [`${prefix}${val.toFixed(isRatio ? 3 : 2)}${suffix}`, isRatio ? 'Relação' : 'Cotação Real'];
                      if (name === 'mma7') return [`${prefix}${val.toFixed(isRatio ? 3 : 2)}${suffix}`, 'Média Móvel (7d)'];
                      if (name === 'mma30') return [`${prefix}${val.toFixed(isRatio ? 3 : 2)}${suffix}`, 'Média Móvel (30d)'];
                      if (name === 'bbUpper') return [`${prefix}${val.toFixed(isRatio ? 3 : 2)}${suffix}`, 'Banda Sup. (20d)'];
                      if (name === 'bbLower') return [`${prefix}${val.toFixed(isRatio ? 3 : 2)}${suffix}`, 'Banda Inf. (20d)'];
                      return val;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  
                  {/* Bollinger Fill */}
                  {showBollinger && (
                    <Area 
                      type="monotone" 
                      dataKey="bbUpper" 
                      stroke="none" 
                      fill="url(#colorBollinger)" 
                      legendType="none"
                    />
                  )}
                  {showBollinger && (
                    <Area 
                      type="monotone" 
                      dataKey="bbLower" 
                      stroke="none" 
                      fill="hsl(var(--bg-card))" 
                      legendType="none"
                    />
                  )}
                  
                  {showBollinger && (
                    <Line type="monotone" dataKey="bbUpper" name="bbUpper" stroke="#14b8a6" strokeWidth={1} strokeDasharray="3 3" dot={false} legendType="none" />
                  )}
                  {showBollinger && (
                    <Line type="monotone" dataKey="bbLower" name="bbLower" stroke="#14b8a6" strokeWidth={1} strokeDasharray="3 3" dot={false} legendType="none" />
                  )}

                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="value"
                    stroke="hsl(var(--brand))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill={showBollinger ? "transparent" : "url(#colorPrice)"} 
                  />

                  {showMMA7 && (
                    <Line type="monotone" dataKey="mma7" name="mma7" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  )}

                  {showMMA30 && (
                    <Line type="monotone" dataKey="mma30" name="mma30" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  )}

                  {extremePoints?.max && (
                    <ReferenceDot 
                      x={extremePoints.max.displayDate} 
                      y={extremePoints.max.value} 
                      r={5} 
                      fill="#ef4444" 
                      stroke="white" 
                      strokeWidth={2}
                      label={{ position: 'top', value: 'MÁX', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }}
                    />
                  )}

                  {extremePoints?.min && (
                    <ReferenceDot 
                      x={extremePoints.min.displayDate} 
                      y={extremePoints.min.value} 
                      r={5} 
                      fill="#10b981" 
                      stroke="white" 
                      strokeWidth={2}
                      label={{ position: 'bottom', value: 'MÍN', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }}
                    />
                  )}

                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
