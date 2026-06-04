import { useState, useEffect } from 'react';

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
    return { value: Number(v.toFixed(2)), label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
  });
}
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
import { EmptyState } from '../../components/Feedback/EmptyState';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

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

      // KPI Calculation — all real, no fake data
      const totalSaving = analysis.reduce((acc: number, p: any) => acc + Math.max(0, p.avgPrice - p.minPrice), 0);
      
      setStats([
        { 
          label: 'Saving Acumulado', 
          value: totalSaving > 0 ? totalSaving.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---', 
          icon: DollarSign, color: '#10b981', 
          progress: totalSaving > 0 ? 100 : 0, 
          trend: totalSaving > 0 ? 'up' as const : 'neutral' as const, 
          change: totalSaving > 0 ? 'Economia Total' : 'Sem dados',
          sparkline: buildSparkline(data || [], 'created_at', 'preco')
        },
        { 
          label: 'Itens em Monitoramento', 
          value: analysis.length > 0 ? analysis.length : '---', 
          icon: Package, color: '#3b82f6', 
          progress: analysis.length > 0 ? 100 : 0, 
          change: analysis.length > 0 ? 'Insumos com histórico' : 'Sem insumos',
          sparkline: buildSparkline(data || [], 'created_at', 'preco')
        },
        { 
          label: 'Maior Variação', 
          value: (() => {
            if (analysis.length === 0) return '---';
            const maxDiff = Math.max(...analysis.map((p: any) => Math.abs(p.diffPercent)));
            return `${maxDiff.toFixed(1)}%`;
          })(),
          icon: Activity, color: '#f59e0b', 
          progress: (() => {
            if (analysis.length === 0) return 0;
            const maxDiff = Math.max(...analysis.map((p: any) => Math.abs(p.diffPercent)));
            return Math.min(100, maxDiff * 5);
          })(),
          trend: 'up' as const, 
          change: analysis.length > 0 ? 'Máx. desvio do médio' : 'Sem dados',
          sparkline: buildSparkline(data || [], 'created_at', 'preco')
        },
        { 
          label: 'Itens em Alta', 
          value: (() => {
            const alta = analysis.filter((p: any) => p.variation === 'up').length;
            return alta > 0 ? alta : '---';
          })(),
          icon: Target, color: '#166534', 
          progress: analysis.length > 0 ? (analysis.filter((p: any) => p.variation === 'up').length / analysis.length) * 100 : 0, 
          change: analysis.length > 0 ? 'Preço acima da média' : 'Sem dados',
          sparkline: buildSparkline(data || [], 'created_at', 'preco')
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
            {item.variation === 'up' ? `↑ +${item.diffPercent.toFixed(1)}%` : item.variation === 'down' ? `↓ ${item.diffPercent.toFixed(1)}%` : 'ESTÁVEL'}
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
          <Breadcrumb paths={[{ label: 'Compras', href: '/compras/dashboard' }, { label: 'Análise de Preço' }]} />
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
          emptyState={
            <EmptyState
              title="Nenhum registro encontrado"
              description="Sua busca não retornou resultados."
              icon={Search}
            />
          } 
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
