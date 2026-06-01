import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calculator, ArrowRight, ArrowDownRight, ArrowUpRight, TrendingUp, AlertCircle, Globe, Activity } from 'lucide-react';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTenant } from '../../contexts/TenantContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const MarketB3Calculator: React.FC = () => {
  const { activeFarmId, isGlobalMode, activeTenantId } = useTenant();
  const navigate = useNavigate();
  const [b3Ticker, setB3Ticker] = useState('BGIK25'); // Exemplo: Boi Gordo Maio/25
  const [loading, setLoading] = useState(false);
  const [physicalPrice, setPhysicalPrice] = useState<number | null>(null);
  const [futurePrice, setFuturePrice] = useState<number | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchBasePrices();
  }, []);

  const fetchBasePrices = async () => {
    setLoading(true);
    try {
      // 1. Fetch latest CEPEA Boi Gordo price (Physical)
      const { data: cepeaData } = await supabase
        .from('market_quotes')
        .select('value, date')
        .eq('indicator', 'boi_gordo_cepea')
        .order('date', { ascending: false })
        .limit(30);
      
      if (cepeaData && cepeaData.length > 0) {
        setPhysicalPrice(Number(cepeaData[0].value));
      }

      // 2. Fetch B3 Future price via Edge Function
      const { data: b3Response, error: b3Error } = await supabase.functions.invoke('b3-quotes', {
        body: { ticker: b3Ticker }
      });

      if (b3Error) throw b3Error;

      const b3Quotes = b3Response?.data || [];
      if (b3Quotes.length > 0) {
        setFuturePrice(b3Quotes[b3Quotes.length - 1].close);
      }

      // Merge data for chart
      if (cepeaData && b3Quotes.length > 0) {
        const merged = b3Quotes.map((b3: any) => {
          // LOCF (Last Observation Carried Forward): Find closest past CEPEA quote
          // cepeaData is sorted descending by date
          const closestCepea = cepeaData.find((c: any) => c.date <= b3.date);
          const cepeaVal = closestCepea ? Number(closestCepea.value) : null;
          
          const d = new Date(b3.date);
          return {
            date: b3.date,
            displayDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            Fisico: cepeaVal,
            B3: b3.close,
            Base: cepeaVal ? cepeaVal - b3.close : null
          };
        });
        setChartData(merged);
      }

    } catch (err) {
      console.error('Erro ao buscar dados B3:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateHedge = () => {
    fetchBasePrices();
  };

  const basis = (physicalPrice && futurePrice) ? physicalPrice - futurePrice : null;

  const sparklineFisico = chartData.filter(d => d.Fisico != null).slice(-20).map(d => ({ value: Number(d.Fisico), label: d.displayDate }));
  const sparklineB3 = chartData.filter(d => d.B3 != null).slice(-20).map(d => ({ value: Number(d.B3), label: d.displayDate }));

  return (
    <div className="admin-intelligence-page animate-slide-up">
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div className="header-brand-group">
          <div className="brand-badge" style={{ background: 'hsl(var(--bg-sidebar))', color: 'hsl(var(--brand))', border: '1px solid hsl(var(--brand) / 0.3)' }}>
            <Calculator size={14} fill="currentColor" />
            <span>CALCULADORA DE HEDGE B3</span>
          </div>
          <h1 className="page-title">Calculadora de Base</h1>
          <p className="page-subtitle">Cruzamento do Mercado Físico (CEPEA) vs Mercado Futuro (B3)</p>
        </div>
      </header>

      <div className="next-gen-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <TauzeStatCard 
          label={`Preço Físico (CEPEA)`} 
          value={physicalPrice ? `R$ ${physicalPrice.toFixed(2)}` : '---'} 
          icon={Activity} 
          color="#3b82f6" 
          progress={100} 
          sparkline={sparklineFisico}
          periodLabel="Preço CEPEA"
        />
        <TauzeStatCard 
          label={`Preço Futuro (${b3Ticker})`} 
          value={futurePrice ? `R$ ${futurePrice.toFixed(2)}` : '---'} 
          icon={Globe} 
          color="#8b5cf6" 
          progress={100} 
          sparkline={sparklineB3}
          periodLabel="Futuro B3"
        />
        <div className={`tauze-kpi-card`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span className="kpi-label-tauze">Base (Físico - Futuro)</span>
          <h2 style={{ fontSize: '1.8rem', margin: '8px 0', color: basis !== null && basis >= 0 ? '#10b981' : '#ef4444' }}>
            {basis !== null ? `R$ ${Math.abs(basis).toFixed(2)}` : '---'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: basis !== null && basis >= 0 ? '#10b981' : '#ef4444' }}>
            {basis !== null && basis >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {basis !== null && basis >= 0 ? 'Físico está pagando Prêmio' : 'Físico está com Deságio'}
          </div>
        </div>
        <div className={`tauze-kpi-card`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span className="kpi-label-tauze">Taxa de Base (%)</span>
          <h2 style={{ fontSize: '1.8rem', margin: '8px 0', color: basis !== null && basis >= 0 ? '#10b981' : '#ef4444' }}>
            {basis !== null && futurePrice ? `${((Math.abs(basis) / futurePrice) * 100).toFixed(2)}%` : '---'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: basis !== null && basis >= 0 ? '#10b981' : '#ef4444' }}>
            {basis !== null && basis >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            Percentual sobre a B3
          </div>
        </div>
      </div>

      <div className="intelligence-panel premium-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '8px', display: 'block' }}>Contrato B3 (Ticker)</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                value={b3Ticker} 
                onChange={e => setB3Ticker(e.target.value.toUpperCase())}
                className="market-select-tauze"
                style={{ height: '44px', width: '100%' }}
                placeholder="Ex: BGIK25"
              />
              <button 
                className="glass-btn primary" 
                onClick={calculateHedge}
                disabled={loading}
                style={{ height: '44px', padding: '0 24px', whiteSpace: 'nowrap' }}
              >
                {loading ? 'Calculando...' : 'Calcular Hedge'}
              </button>
              <button 
                className="glass-btn secondary" 
                onClick={() => {
                  if (!futurePrice) {
                    toast.error('Calcule o hedge primeiro para efetivar o contrato.');
                    return;
                  }
                  navigate('/vendas/contrato', { state: { createHedge: true, b3Ticker, futurePrice } });
                }}
                disabled={!futurePrice}
                style={{ height: '44px', padding: '0 24px', whiteSpace: 'nowrap', backgroundColor: '#10b981', color: 'white', border: 'none' }}
              >
                Efetivar Contrato Hedge
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '8px' }}>Dica: BGI é o código do Boi Gordo. Letra é o mês de vencimento. Número é o ano.</p>
          </div>
        </div>
      </div>

      <div className="admin-intelligence-grid" style={{ gridTemplateColumns: '1fr' }}>
        <section className="intelligence-panel premium-card main-chart">
          <div className="panel-header-tauze" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="title-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <TrendingUp size={20} className="text-brand" />
              <div>
                <h3>Convergência Físico vs Futuro (30 dias)</h3>
                <p>Análise da diferença entre o que é pago hoje e a expectativa da bolsa</p>
              </div>
            </div>
          </div>
          <div className="chart-container-large" style={{ marginTop: '20px' }}>
            {loading ? (
              <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="loading-text">Buscando dados na B3...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} dy={10} minTickGap={30} />
                  <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--text-muted))' }} tickFormatter={(value) => `R$${value}`} width={60} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
                    formatter={(val: any) => val != null ? `R$ ${Number(val).toFixed(2)}` : '---'}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="Fisico" name="Mercado Físico (CEPEA)" stroke="#3b82f6" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="B3" name={`Bolsa B3 (${b3Ticker})`} stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

    </div>
  );
};
