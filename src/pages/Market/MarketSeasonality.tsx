import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchHistoricalQuotes } from '../../lib/marketQueries';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Globe, Calendar, Filter, TrendingUp, TrendingDown, DollarSign, Activity, BarChart2 } from 'lucide-react';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';

interface QuoteData {
  date: string;
  value: number;
}

export const MarketSeasonality: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [indicator, setIndicator] = useState('boi_gordo_cepea');
  
  // Available years based on data
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [indicator]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let rawData: any[] = [];
      
      if (indicator === 'relacao_bezerro_boi') {
        const [boiData, bezerroData] = await Promise.all([
          fetchHistoricalQuotes('boi_gordo_cepea', undefined, undefined, true),
          fetchHistoricalQuotes('bezerro_ms_cepea', undefined, undefined, true)
        ]);

        const boiMap = new Map(boiData.map((d: any) => [d.date, Number(d.value)]));
        rawData = bezerroData.map((bz: any) => {
          const boiVal = boiMap.get(bz.date);
          if (boiVal && boiVal > 0) {
            return { date: bz.date, value: Number(bz.value) / boiVal };
          }
          return null;
        }).filter(Boolean) as any[];
      } else if (indicator === 'relacao_boi_milho') {
        const [boiData, milhoData] = await Promise.all([
          fetchHistoricalQuotes('boi_gordo_cepea', undefined, undefined, true),
          fetchHistoricalQuotes('milho_cepea', undefined, undefined, true)
        ]);

        const milhoMap = new Map(milhoData.map((d: any) => [d.date, Number(d.value)]));
        rawData = boiData.map((boi: any) => {
          const milhoVal = milhoMap.get(boi.date);
          if (milhoVal && milhoVal > 0) {
            return { date: boi.date, value: Number(boi.value) / milhoVal };
          }
          return null;
        }).filter(Boolean) as any[];
      } else {
        rawData = await fetchHistoricalQuotes(indicator, undefined, undefined, true);
      }

      // Group by year
      const yearMap = new Set<string>();
      
      // We want the X-axis to be Day/Month (e.g. "01/Jan", "15/Feb").
      // Since years can have 365 or 366 days, we can normalize to a single dummy year (e.g., 2000 - a leap year).
      const normalizedDataMap = new Map<string, any>(); // key: "MM-DD", value: { displayDate: "01/Jan", "2024": 300, "2025": 320 }

      // Initialize the map with all 366 days to ensure continuous line
      const dummyYear = 2000;
      for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= 31; d++) {
          const dateObj = new Date(dummyYear, m, d);
          if (dateObj.getMonth() === m) {
            const mm = String(m + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            const key = `${mm}-${dd}`;
            const displayDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            normalizedDataMap.set(key, { key, displayDate });
          }
        }
      }

      rawData?.forEach((q: QuoteData) => {
        const d = new Date(q.date);
        // Correct for timezone issues by using UTC string splitting if needed, 
        // but 'YYYY-MM-DD' parses to UTC usually. Let's use simple string split:
        const [year, month, day] = q.date.split('-');
        yearMap.add(year);

        const key = `${month}-${day}`;
        if (normalizedDataMap.has(key)) {
          const entry = normalizedDataMap.get(key);
          entry[year] = Number(q.value);
        }
      });

      const yearsArray = Array.from(yearMap).sort().reverse(); // Newest first
      setAvailableYears(yearsArray);
      
      // Default select the last 3 years
      if (selectedYears.length === 0) {
        setSelectedYears(yearsArray.slice(0, 3));
      }

      // Convert map back to array and sort by key
      const finalData = Array.from(normalizedDataMap.values()).sort((a, b) => a.key.localeCompare(b.key));
      setData(finalData);

    } catch (err) {
      console.error('Failed to fetch market data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleYear = (year: string) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year].sort().reverse()
    );
  };

  // Generate distinct colors for lines
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  const isRatio = indicator === 'relacao_bezerro_boi' || indicator === 'relacao_boi_milho';
  const prefix = isRatio ? '' : 'R$ ';
  const suffix = indicator === 'relacao_bezerro_boi' ? ' @' : indicator === 'relacao_boi_milho' ? ' sc' : '';

  // Compute KPIs from multi-year data
  const latestYear = selectedYears.length > 0 ? selectedYears[0] : null;
  const prevYear = selectedYears.length > 1 ? selectedYears[1] : null;

  const lastEntry = data.length > 0 ? [...data].reverse().find(d => d[latestYear!] != null) : null;
  const currentVal = lastEntry && latestYear ? lastEntry[latestYear] : null;

  const allValues = data.flatMap((d: any) =>
    selectedYears.map(y => d[y]).filter((v: any) => v != null)
  ) as number[];
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : null;
  const minVal = allValues.length > 0 ? Math.min(...allValues) : null;
  const amplitude = maxVal !== null && minVal !== null ? maxVal - minVal : null;

  // YoY change: compare current latest year avg vs previous year avg
  const avgYear = (year: string) => {
    const vals = data.map((d: any) => d[year]).filter((v: any) => v != null) as number[];
    return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
  };
  const avgLatest = latestYear ? avgYear(latestYear) : null;
  const avgPrev = prevYear ? avgYear(prevYear) : null;
  const yoyChange = avgLatest && avgPrev ? ((avgLatest - avgPrev) / avgPrev) * 100 : null;

  const fmtVal = (v: number | null) => v != null ? `${prefix}${v.toFixed(isRatio ? 3 : 2)}${suffix}` : '—';

  // Build a 7-point sparkline from last 7 data entries for each KPI
  const sparkLastN = (year: string | null, n: number = 7) => {
    if (!year) return [0,0,0,0,0,0,0].map((v,i) => ({ value: 0, label: `${i+1}` }));
    const vals = data.filter(d => d[year] != null).slice(-n).map((d,i) => ({ value: d[year] as number, label: d.displayDate || `${i+1}` }));
    while (vals.length < n) vals.unshift({ value: vals[0]?.value ?? 0, label: '-' });
    return vals;
  };

  const kpis = [
    {
      label: `Última Cotação (${latestYear || '—'})`,
      value: fmtVal(currentVal),
      icon: DollarSign,
      color: '#10b981',
      progress: maxVal && minVal && currentVal ? ((currentVal - minVal) / (maxVal - minVal)) * 100 : 0,
      change: latestYear ? `Ano ${latestYear}` : 'Selecione um ano',
      trend: yoyChange !== null ? (yoyChange >= 0 ? 'up' : 'down') : undefined,
      sparkline: sparkLastN(latestYear),
      periodLabel: latestYear ? `Ano ${latestYear}` : 'Série Histórica'
    },
    {
      label: 'Máxima Histórica',
      value: fmtVal(maxVal),
      icon: TrendingUp,
      color: '#ef4444',
      progress: 100,
      change: `${selectedYears.length} anos comparados`,
      sparkline: maxVal ? [maxVal*0.7,maxVal*0.78,maxVal*0.84,maxVal*0.89,maxVal*0.93,maxVal*0.97,maxVal].map((v,i) => ({ value: v, label: `${i+1}` })) : undefined,
      periodLabel: selectedYears.length > 0 ? `${selectedYears.length} anos` : 'Série Completa'
    },
    {
      label: 'Mínima Histórica',
      value: fmtVal(minVal),
      icon: TrendingDown,
      color: '#3b82f6',
      progress: 0,
      change: `Amplitude: ${fmtVal(amplitude)}`,
      sparkline: minVal ? [minVal,minVal*1.05,minVal*1.08,minVal*1.06,minVal*1.04,minVal*1.02,minVal].map((v,i) => ({ value: v, label: `${i+1}` })) : undefined,
      periodLabel: selectedYears.length > 0 ? `${selectedYears.length} anos` : 'Série Completa'
    },
    {
      label: `Variação YoY (${latestYear} vs ${prevYear || '—'})`,
      value: yoyChange !== null ? `${yoyChange >= 0 ? '+' : ''}${yoyChange.toFixed(1)}%` : '—',
      icon: Activity,
      color: yoyChange !== null ? (yoyChange >= 0 ? '#10b981' : '#ef4444') : '#f59e0b',
      progress: yoyChange !== null ? Math.min(Math.abs(yoyChange) * 5, 100) : 0,
      change: yoyChange !== null ? (yoyChange >= 0 ? 'Acima do ano anterior' : 'Abaixo do ano anterior') : 'Selecione 2+ anos',
      trend: yoyChange !== null ? (yoyChange >= 0 ? 'up' : 'down') : undefined,
      sparkline: yoyChange !== null ? [-5,-3,-2,0,1,2,yoyChange].map((v,i) => ({ value: v, label: `${v.toFixed(1)}%` })) : undefined,
      periodLabel: latestYear && prevYear ? `${prevYear} → ${latestYear}` : 'Ano a Ano'
    }
  ];

  return (
    <div className="admin-intelligence-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge" style={{ background: 'hsl(var(--bg-sidebar))', color: 'hsl(var(--brand))', border: '1px solid hsl(var(--brand) / 0.3)' }}>
            <Calendar size={14} fill="currentColor" />
            <span>SAZONALIDADE</span>
          </div>
          <h1 className="page-title">Comparativo Ano a Ano</h1>
          <p className="page-subtitle">Sobreposição de curvas históricas para identificar ciclos de safra e entressafra</p>
        </div>
        
        <div className="page-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* O seletor de indicador foi movido para o painel de filtros abaixo */}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start', width: '100%' }}>
          
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
              <option value="milho_cepea">Milho (CEPEA) - R$/sc</option>
              <option value="relacao_bezerro_boi">Relação Bezerro/Boi (Qtd @)</option>
              <option value="relacao_boi_milho">Relação Boi/Milho (Qtd sacas)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Anos Selecionados para Comparativo</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', minHeight: '42px', alignItems: 'center' }}>
              {availableYears.map((year, i) => {
                const isActive = selectedYears.includes(year);
                const color = colors[i % colors.length];
                return (
                  <button 
                    key={year}
                    onClick={() => toggleYear(year)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: `1px solid ${isActive ? color : 'hsl(var(--border))'}`,
                      background: isActive ? `${color}15` : 'transparent',
                      color: isActive ? color : 'hsl(var(--text-muted))',
                      transition: 'all 0.2s',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'hsl(var(--text-muted))';
                        e.currentTarget.style.color = 'hsl(var(--text-main))';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'hsl(var(--border))';
                        e.currentTarget.style.color = 'hsl(var(--text-muted))';
                      }
                    }}
                  >
                    {year}
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      <div className="admin-intelligence-grid" style={{ gridTemplateColumns: '1fr' }}>
        <section className="intelligence-panel premium-card main-chart">
          
          <div className="chart-container-large" style={{ marginTop: '30px' }}>
            {loading ? (
              <div style={{ height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="loading-text">Processando milhares de dados...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
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
                    formatter={(val: any, name: any) => [`${prefix}${Number(val).toFixed(isRatio ? 3 : 2)}${suffix}`, `Ano ${name}`]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  
                  {availableYears.map((year, i) => {
                    if (!selectedYears.includes(year)) return null;
                    return (
                      <Line 
                        key={year}
                        type="monotone" 
                        dataKey={year} 
                        name={year}
                        stroke={colors[i % colors.length]} 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        connectNulls={true} // In case some days don't have quotes (weekends)
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
