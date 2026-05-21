import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchHistoricalQuotes } from '../../lib/marketQueries';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Globe, Calendar, Filter } from 'lucide-react';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';

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

  const isRatio = indicator === 'relacao_bezerro_boi';
  const prefix = isRatio ? '' : 'R$ ';
  const suffix = isRatio ? ' @' : '';

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
          <select 
            value={indicator} 
            onChange={(e) => setIndicator(e.target.value)}
            className="market-select-tauze"
          >
            <option value="boi_gordo_cepea">Boi Gordo (CEPEA) - R$/@</option>
            <option value="bezerro_ms_cepea">Bezerro MS (CEPEA) - R$/cabeça</option>
            <option value="bezerro_sp_cepea">Bezerro SP (CEPEA) - R$/cabeça</option>
            <option value="relacao_bezerro_boi">Relação Bezerro/Boi (Qtd @)</option>
            <option value="milho_cepea" disabled>Milho (CEPEA) - Em Breve</option>
          </select>
        </div>
      </header>

      <div className="floating-filter-card" style={{
        background: 'hsl(var(--bg-card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="title-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', background: 'hsl(var(--brand) / 0.1)', borderRadius: '10px' }}>
            <Filter size={20} className="text-brand" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'hsl(var(--text-main))' }}>Anos Selecionados</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Clique nos botões abaixo para ligar/desligar a linha do ano correspondente no gráfico</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {availableYears.map((year, i) => {
            const isActive = selectedYears.includes(year);
            const color = colors[i % colors.length];
            return (
              <button 
                key={year}
                onClick={() => toggleYear(year)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '100px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${isActive ? color : 'hsl(var(--border))'}`,
                  background: isActive ? `${color}15` : 'transparent',
                  color: isActive ? color : 'hsl(var(--text-muted))',
                  transition: 'all 0.2s'
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
                    formatter={(val: number, name: string) => [`${prefix}${val.toFixed(isRatio ? 3 : 2)}${suffix}`, `Ano ${name}`]}
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
