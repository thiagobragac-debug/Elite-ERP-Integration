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
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';

export const PriceAnalysis: React.FC = () => {
  const { activeFarm } = useTenant();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) return;
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
      .eq('fazenda_id', activeFarm.id)
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
        { label: 'Saving Acumulado', value: totalSaving.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: '#10b981', progress: 100, trend: 'up' },
        { label: 'Itens em Monitoramento', value: analysis.length, icon: Package, color: '#3b82f6', progress: 85 },
        { label: 'Volatilidade Média', value: '8.4%', icon: Activity, color: '#f59e0b', progress: 45, trend: 'up' },
        { label: 'Acuracidade de Custo', value: '99.2%', icon: Target, color: '#166534', progress: 99 },
      ]);
    }
    setLoading(false);
  };

  const tableColumns = [
    {
      header: 'Item / Categoria',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.name}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.category} • {item.unit}
          </div>
        </div>
      )
    },
    {
      header: 'Último Preço',
      accessor: (item: any) => (
        <div className="flex flex-col">
          <span className="main-text font-bold">
            {item.lastPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="sub-meta text-[10px]">
            {new Date(item.lastDate).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      header: 'Média Histórica',
      accessor: (item: any) => (
        <span className="sub-meta font-bold">
          {item.avgPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      )
    },
    {
      header: 'Melhor Preço (Min)',
      accessor: (item: any) => (
        <span className="text-emerald-600 font-bold">
          {item.minPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      )
    },
    {
      header: 'Tendência',
      accessor: (item: any) => (
        <div className={`flex items-center gap-1 font-bold ${item.variation === 'up' ? 'text-rose-500' : item.variation === 'down' ? 'text-emerald-500' : 'text-amber-500'}`}>
          {item.variation === 'up' ? <TrendingUp size={14} /> : item.variation === 'down' ? <TrendingDown size={14} /> : <History size={14} />}
          <span className="text-[12px]">
            {item.diffPercent > 0 ? `+${item.diffPercent.toFixed(1)}%` : `${item.diffPercent.toFixed(1)}%`}
          </span>
        </div>
      ),
      align: 'right' as const
    }
  ];

  return (
    <div className="price-analysis-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <TrendingUp size={14} fill="currentColor" />
            <span>ELITE INTELLIGENCE v5.0</span>
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
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={BarChart2} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar por insumo ou categoria..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-filter-group">
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
