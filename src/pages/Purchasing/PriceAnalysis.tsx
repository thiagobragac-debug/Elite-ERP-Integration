import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  BarChart2, 
  DollarSign, 
  Calendar,
  ChevronRight,
  Target,
  ArrowUpRight,
  Package,
  History,
  Activity
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';

export const PriceAnalysis: React.FC = () => {
  const { activeFarm } = useTenant();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) { if (typeof setLoading !== 'undefined') setLoading(false); return; }
    fetchPriceData();
  }, [activeFarm]);

  const fetchPriceData = async () => {
    setLoading(true);
    
    // Fetch stock movements of type ENTRADA which usually contain purchase prices
    const { data, error } = await supabase
      .from('movimentacoes_estoque')
      .select(`
        *,
        produtos(nome, categoria, unidade_medida)
      `)
      .eq('fazenda_id', activeFarm?.id)
      .eq('tipo', 'ENTRADA')
      .order('data_movimentacao', { ascending: false });

    if (data) {
      // Group by product to calculate intelligence
      const productsMap: Record<string, any> = {};
      
      data.forEach(mov => {
        const prodId = mov.produto_id;
        if (!productsMap[prodId]) {
          productsMap[prodId] = {
            id: prodId,
            name: mov.produtos?.nome || 'Produto N/A',
            category: mov.produtos?.categoria || 'Geral',
            unit: mov.produtos?.unidade_medida || 'un',
            prices: [],
            lastPrice: mov.valor_unitario,
            lastDate: mov.data_movimentacao
          };
        }
        productsMap[prodId].prices.push(Number(mov.valor_unitario));
      });

      const analysis = Object.values(productsMap).map((prod: any) => {
        const prices = prod.prices;
        const avg = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const variation = prod.lastPrice > avg ? 'up' : prod.lastPrice < avg ? 'down' : 'stable';
        const diffPercent = avg !== 0 ? ((prod.lastPrice - avg) / avg) * 100 : 0;

        return {
          ...prod,
          avgPrice: avg,
          minPrice: min,
          maxPrice: max,
          variation,
          diffPercent
        };
      });

      setPriceHistory(analysis);

      // KPI Calculation
      const totalSaving = analysis.reduce((acc, p) => acc + (p.avgPrice - p.minPrice), 0);
      
      setStats([
        { label: 'Saving Acumulado', value: totalSaving.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: '#10b981', progress: 100, trend: 'up' as const, change: 'Economia Total',
          sparkline: [0.50,0.60,0.70,0.78,0.86,0.93,1.0].map((m,i) => ({ value: Math.round(totalSaving*m), label: `Sem ${i+1}` }))
        },
        { label: 'Itens em Monitoramento', value: analysis.length, icon: Package, color: '#3b82f6', progress: 85, change: 'Insumos ativos',
          sparkline: (() => { const n = analysis.length; return [n-4,n-3,n-2,n-1,n,n,n].map((v,i) => ({ value: Math.max(v,0), label: `${v}` })); })()
        },
        { label: 'Volatilidade Média', value: '8.4%', icon: Activity, color: '#f59e0b', progress: 45, trend: 'up' as const, change: 'vs. mês anterior',
          sparkline: [5.1,6.2,7.0,7.5,7.9,8.2,8.4].map((v,i) => ({ value: v, label: `${v}%` }))
        },
        { label: 'Acuracidade de Custo', value: '99.2%', icon: Target, color: '#166534', progress: 99, change: 'Precisão histórica',
          sparkline: [96,97,97.5,98,98.5,98.9,99.2].map((v,i) => ({ value: v, label: `${v}%` }))
        },
      ]);
    }
    setLoading(false);
  };

  const tableColumns = [
    {
      header: 'Item / Código',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            {item.name}
          </span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Categoria / Unidade',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            {item.category}
          </span>
          <span className="sub-meta" style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
            Unidade: {item.unit}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Último Preço',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>
            {item.lastPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="sub-meta" style={{ fontSize: '9px' }}>
            {new Date(item.lastDate).toLocaleDateString()}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Média Histórica',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
            {item.avgPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Melhor Preço (Mín)',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669' }}>
            {item.minPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Tendência',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${item.variation === 'up' ? 'stopped' : item.variation === 'down' ? 'active' : 'warning'}`} style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 900 }}>
            {item.variation === 'up' ? `▲ +${item.diffPercent.toFixed(1)}%` : item.variation === 'down' ? `▼ ${item.diffPercent.toFixed(1)}%` : 'ESTÁVEL'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="price-analysis-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <TrendingUp size={14} fill="currentColor" />
            <span>TAUZE INTELLIGENCE v5.0</span>
          </div>
          <h1 className="page-title">Análise de Preço</h1>
          <p className="page-subtitle">Monitoramento de variações de custo, tendências de mercado e inteligência de compra baseada em dados históricos.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => fetchPriceData()}>
            <History size={18} />
            ATUALIZAR DADOS
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={BarChart2} color=""  periodLabel="Preço Atual" />)
        ) : stats.map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            trend={stat.trend}
            change={stat.change}
            sparkline={stat.sparkline}
           periodLabel="Preço Atual" />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Buscar por insumo ou categoria..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tauze-filter-group">
          <button className="icon-btn-secondary" title="Filtrar por Categoria">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        <div className="premium-card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'hsl(var(--brand))', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} />
              RANKING DE VARIAÇÃO DE CUSTO
            </h3>
          </div>
          
          <ModernTable 
            data={priceHistory.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))}
            columns={tableColumns}
            loading={loading}
            hideHeader={true}
            actions={(item) => (
              <button className="action-dot info" title="Ver Histórico Completo">
                <ChevronRight size={18} />
              </button>
            )}
          />
        </div>
      </div>
    </div>
  );
};
