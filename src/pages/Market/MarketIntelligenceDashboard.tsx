import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchHistoricalQuotes } from '../../lib/marketQueries';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Globe, TrendingUp, TrendingDown, DollarSign, Activity, Maximize2, FileText, Bell } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { PriceAlertModal } from './components/PriceAlertModal';
import './MarketIntelligenceDashboard.css';

interface QuoteData {
  date: string;
  value: number;
  displayDate?: string;
  month?: string;
  year?: string;
}

export const MarketIntelligenceDashboard: React.FC = () => {
  const [data, setData] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'30D' | '90D' | '6M' | '1Y' | 'ALL'>('1Y');
  const [indicator, setIndicator] = useState('boi_gordo_cepea');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [period, indicator]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let startStr: string | undefined = undefined;
      const today = new Date();
      
      if (period !== 'ALL') {
        const d = new Date(today);
        switch (period) {
          case '30D': d.setDate(d.getDate() - 30); break;
          case '90D': d.setDate(d.getDate() - 90); break;
          case '6M': d.setMonth(d.getMonth() - 6); break;
          case '1Y': d.setFullYear(d.getFullYear() - 1); break;
        }
        startStr = d.toISOString().split('T')[0];
      }

      const rawData = await fetchHistoricalQuotes(indicator, startStr, undefined, true);
      
      const formatted = (rawData || []).map(q => {
        const d = new Date(q.date);
        return {
          ...q,
          value: Number(q.value),
          displayDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: period === 'ALL' ? '2-digit' : undefined }),
          month: d.toLocaleString('pt-BR', { month: 'short' }),
          year: d.getFullYear().toString()
        };
      });

      setData(formatted);
    } catch (err) {
      console.error('Failed to fetch market data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = data.map(item => ({
      Data: item.displayDate,
      Valor: item.value.toFixed(2),
      Indicador: indicator.toUpperCase()
    }));
    const filename = `historico_mercado_${indicator}_${period}`;
    if (format === 'csv') exportToCSV(exportData, filename);
    else if (format === 'excel') exportToExcel(exportData, filename);
    else if (format === 'pdf') exportToPDF(exportData, filename, 'Histórico de Mercado');
  };

  const getStats = () => {
    if (!data || data.length === 0) return { current: 0, min: 0, max: 0, avg: 0, variation: 0 };
    
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const variation = ((last - first) / first) * 100;

    return { current: last, min, max, avg, variation };
  };

  const stats = getStats();
  const periodLabel = period === 'ALL' ? 'Todo Período' : period === '1Y' ? '1 Ano' : period === '6M' ? '6 Meses' : period === '90D' ? '90 Dias' : '30 Dias';

  // Sample data for sparkline (max 20 points)
  const sparklineData = data.length <= 20 
    ? data.map(d => ({ value: d.value, label: d.displayDate || d.date }))
    : data.filter((_, i) => i % Math.ceil(data.length / 20) === 0).map(d => ({ value: d.value, label: d.displayDate || d.date }));

  return (
    <div className="admin-intelligence-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge" style={{ background: 'hsl(var(--bg-sidebar))', color: 'hsl(var(--brand))', border: '1px solid hsl(var(--brand) / 0.3)' }}>
            <Globe size={14} fill="currentColor" />
            <span>MARKET INTELLIGENCE</span>
          </div>
          <h1 className="page-title">Intelligence Hub: Mercado</h1>
          <p className="page-subtitle">Análise avançada de indicadores e histórico de preços</p>
        </div>
        
        <div className="page-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'nowrap' }}>
          <select 
            value={indicator} 
            onChange={(e) => setIndicator(e.target.value)}
            className="market-select-tauze"
            style={{ maxWidth: '300px' }}
          >
            <option value="boi_gordo_cepea">Boi Gordo (CEPEA) - R$/@</option>
            <option value="bezerro_ms_cepea">Bezerro MS (CEPEA) - R$/cabeça</option>
            <option value="bezerro_sp_cepea">Bezerro SP (CEPEA) - R$/cabeça</option>
            <option value="milho_cepea">Milho (CEPEA) - R$/saca 60kg</option>
          </select>

          <div className="period-selector-tauze">
            {(['30D', '90D', '6M', '1Y', 'ALL'] as const).map(p => (
              <button 
                key={p} 
                className={period === p ? 'active' : ''} 
                onClick={() => setPeriod(p)}
              >
                {p === 'ALL' ? 'Tudo' : p}
              </button>
            ))}
          </div>

          <button 
            className="glass-btn secondary" 
            title="Criar Alerta de Mercado"
            onClick={() => setIsAlertModalOpen(true)}
          >
            <Bell size={16} />
            Alerta
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : (
          <>
            <TauzeStatCard 
              label="Preço Atual (Último)" 
              value={`R$ ${stats.current.toFixed(2)}`} 
              icon={DollarSign} 
              color={stats.variation >= 0 ? '#10b981' : '#ef4444'} 
              change={`${Math.abs(stats.variation).toFixed(2)}%`} 
              trend={stats.variation >= 0 ? 'up' : 'down'}
              progress={85}
              periodLabel={periodLabel}
              sparkline={sparklineData}
            />
            <TauzeStatCard 
              label="Máxima no Período" 
              value={`R$ ${stats.max.toFixed(2)}`} 
              icon={TrendingUp} 
              color="#3b82f6"
              progress={100}
              periodLabel={periodLabel}
              sparkline={sparklineData}
            />
            <TauzeStatCard 
              label="Mínima no Período" 
              value={`R$ ${stats.min.toFixed(2)}`} 
              icon={TrendingDown} 
              color="#f59e0b"
              progress={40}
              periodLabel={periodLabel}
              sparkline={sparklineData}
            />
            <TauzeStatCard 
              label="Preço Médio" 
              value={`R$ ${stats.avg.toFixed(2)}`} 
              icon={Activity} 
              color="#8b5cf6"
              progress={75}
              periodLabel={periodLabel}
              sparkline={sparklineData}
            />
          </>
        )}
      </div>

      <div className="admin-intelligence-grid" style={{ gridTemplateColumns: '1fr' }}>
        <section className="intelligence-panel premium-card main-chart">
          <div className="panel-header-tauze" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="title-info">
              <Activity size={20} className="text-brand" />
              <div>
                <h3>Evolução do Indicador</h3>
                <p>Curva de variação ao longo do {periodLabel.toLowerCase()}</p>
              </div>
            </div>
            <div className="header-action">
              <button className="glass-btn icon-only"><Maximize2 size={16} /></button>
            </div>
          </div>
          <div className="chart-container-large" style={{ marginTop: '20px' }}>
            {loading ? (
              <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="loading-text">Carregando dados do gráfico...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data} margin={{ top: 50, right: 20, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--brand))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--brand))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="displayDate" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }}
                    dy={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    domain={['dataMin - 15', 'dataMax + 15']} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }}
                    tickFormatter={(value) => `R$${value}`}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--bg-card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      color: 'hsl(var(--text-main))'
                    }}
                    formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Cotação']}
                    labelStyle={{ color: 'hsl(var(--text-muted))', marginBottom: '8px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--brand))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <PriceAlertModal 
        isOpen={isAlertModalOpen} 
        onClose={() => setIsAlertModalOpen(false)} 
        defaultIndicator={indicator}
        onSuccess={() => alert('Alerta de mercado cadastrado com sucesso! O Copilot vai monitorar os preços para você.')}
      />
    </div>
  );
};
