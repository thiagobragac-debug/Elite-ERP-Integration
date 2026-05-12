import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  Plus,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  Eye,
  FileText,
  ChevronRight,
  Search,
  Zap,
  Building2,
  Filter,
  Activity,
  Target,
  Sparkles,
  Layers,
  BarChart3,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { TransactionForm } from '../../components/Forms/TransactionForm';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { FinanceFilterModal } from './components/FinanceFilterModal';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';
import './CashFlow.css';

interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  type: 'inflow' | 'outflow';
  status: 'paid' | 'pending';
}

export const CashFlow: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, applyTenantFilter, canCreate, insertPayload } = useFarmFilter();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<any[]>([
    { label: 'Patrimônio Líquido', value: 'R$ 0,00', icon: Activity, color: '#10b981', progress: 0, change: 'Processando...' },
    { label: 'Resultado Operacional', value: 'R$ 0,00', icon: TrendingUp, color: '#3b82f6', progress: 0, trend: 'stable', change: 'Analisando...' },
    { label: 'Ponto de Equilíbrio', value: 'R$ 0,00', icon: Target, color: '#f59e0b', progress: 0, change: 'Calculando...' },
    { label: 'Runway / Fôlego', value: '0 meses', icon: Zap, color: '#8b5cf6', progress: 0, change: 'Avaliando...' }
  ]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [viewMode, setViewMode] = useState<'operational' | 'analytical'>('operational');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    type: 'all',
    dateStart: '',
    dateEnd: '',
    categories: [],
    status: 'all'
  });

  useEffect(() => {
    if (!activeFarmId && !isGlobalMode) return;
    fetchCashFlowData();
  }, [activeFarmId, isGlobalMode]);

  const fetchCashFlowData = async () => {
    setLoading(true);
    try {
      let bankQuery = supabase.from('contas_bancarias').select('saldo_atual');
      bankQuery = applyTenantFilter(bankQuery);
      const { data: bankAccounts } = await bankQuery;
      
      const totalBalance = bankAccounts?.reduce((acc, curr) => acc + Number(curr.saldo_atual), 0) || 0;

      let payablesQuery = supabase.from('contas_pagar').select('*').order('data_vencimento', { ascending: false });
      payablesQuery = applyFarmFilter(payablesQuery);

      let receivablesQuery = supabase.from('contas_receber').select('*').order('data_vencimento', { ascending: false });
      receivablesQuery = applyFarmFilter(receivablesQuery);

      const [payables, receivables] = await Promise.all([
        payablesQuery,
        receivablesQuery
      ]);

      const inMonth = receivables.data?.filter(r => r.status === 'PAGO').reduce((acc, curr) => acc + Number(curr.valor_total), 0) || 0;
      const outMonth = payables.data?.filter(p => p.status === 'PAGO').reduce((acc, curr) => acc + Number(curr.valor_total), 0) || 0;
      const netMonth = inMonth - outMonth;
      const projected = (receivables.data?.filter(r => r.status === 'PENDENTE').reduce((acc, curr) => acc + Number(curr.valor_total), 0) || 0) -
                        (payables.data?.filter(p => p.status === 'PENDENTE').reduce((acc, curr) => acc + Number(curr.valor_total), 0) || 0);

      // Advanced Financial Engineering
      const last6Months = 6;
      const avgOutflow = outMonth / 1; // Simplification for now, should use hist. average
      const runwayMonths = avgOutflow > 0 ? Math.floor(totalBalance / avgOutflow) : 99;

      setStats([
        { 
          label: 'Patrimônio Líquido', 
          value: totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
          icon: Activity, 
          color: '#10b981', 
          progress: 100,
          change: 'Consolidado',
          periodLabel: 'Liquidez Hoje',
          sparkline: [
            { value: 45, label: 'M-3' }, { value: 52, label: 'M-2' }, { value: 48, label: 'M-1' }, 
            { value: 65, label: 'HOJE' }
          ]
        },
        { 
          label: 'Resultado Operacional', 
          value: netMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
          icon: TrendingUp, 
          color: '#3b82f6', 
          progress: Math.min(100, Math.max(0, (inMonth / (outMonth || 1)) * 50)), 
          trend: netMonth >= 0 ? 'up' : 'down',
          change: 'Mês Atual',
          periodLabel: 'EBITDA Est.',
          sparkline: [
            { value: 30, label: 'S1' }, { value: 45, label: 'S2' }, { value: 55, label: 'S3' }, 
            { value: netMonth > 0 ? 80 : 20, label: 'S4' }
          ]
        },
        { 
          label: 'Ponto de Equilíbrio', 
          value: (outMonth * 1.15).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
          icon: Target, 
          color: '#f59e0b', 
          progress: Math.min(100, (inMonth / ((outMonth * 1.15) || 1)) * 100), 
          change: 'Faturamento Alvo',
          periodLabel: 'Segurança Financeira',
          sparkline: [
            { value: 50, label: 'Q1' }, { value: 60, label: 'Q2' }, { value: 75, label: 'Q3' }, 
            { value: 90, label: 'Q4' }
          ]
        },
        { 
          label: 'Runway / Fôlego', 
          value: `${runwayMonths} meses`, 
          icon: Zap, 
          color: '#8b5cf6', 
          progress: Math.min(100, (runwayMonths / 24) * 100),
          change: runwayMonths > 12 ? 'Excelente' : 'Atenção',
          periodLabel: 'Vida Útil de Caixa',
          sparkline: [
            { value: 95, label: 'M1' }, { value: 85, label: 'M2' }, { value: 80, label: 'M3' }, 
            { value: 75, label: 'M4' }
          ]
        },
      ]);

      const allTx: Transaction[] = [];
      if (receivables.data) {
        receivables.data.forEach(r => allTx.push({
          id: r.id,
          description: r.descricao,
          category: r.categoria || 'Receita de Venda',
          amount: Number(r.valor_total),
          date: r.data_vencimento,
          type: 'inflow',
          status: r.status === 'PAGO' ? 'paid' : 'pending'
        }));
      }
      if (payables.data) {
        payables.data.forEach(p => allTx.push({
          id: p.id,
          description: p.descricao,
          category: p.categoria || 'Custo Operacional',
          amount: -Number(p.valor_total),
          date: p.data_vencimento,
          type: 'outflow',
          status: p.status === 'PAGO' ? 'paid' : 'pending'
        }));
      }

      setTransactions(allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: any) => {
    setSelectedTransaction(tx);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!canCreate) {
      alert('⚠️ Selecione uma unidade específica para lançar uma nova operação. No modo Visão Global, o caixa deve ser vinculado a uma fazenda.');
      return;
    }

    const table = data.type === 'inflow' ? 'contas_receber' : 'contas_pagar';
    const dbPayload = {
      descricao: data.description,
      valor_total: parseFloat(data.amount),
      data_vencimento: data.date,
      categoria: data.category,
      status: data.status === 'paid' ? 'PAGO' : 'PENDENTE',
      ...insertPayload
    };

    const { error } = await supabase.from(table).insert([dbPayload]);
    if (!error) {
      setIsModalOpen(false);
      fetchCashFlowData();
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = transactions.filter(t => {
      const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'ALL' || (activeTab === 'INFLOW' ? t.type === 'inflow' : t.type === 'outflow');
      const matchesStatusFilter = statusFilter === 'ALL' || (statusFilter === 'PENDING' ? t.status === 'pending' : t.status === 'paid');
      
      const matchesType = filterValues.type === 'all' || t.type === filterValues.type;
      const matchesCategory = filterValues.categories.length === 0 || filterValues.categories.includes(t.category);
      const matchesLiquidation = filterValues.status === 'all' || t.status === (filterValues.status === 'PAID' ? 'paid' : 'pending');
      
      const txDate = new Date(t.date);
      const matchesDateStart = !filterValues.dateStart || txDate >= new Date(filterValues.dateStart);
      const matchesDateEnd = !filterValues.dateEnd || txDate <= new Date(filterValues.dateEnd);

      return matchesSearch && matchesTab && matchesStatusFilter && matchesType && matchesCategory && matchesLiquidation && matchesDateStart && matchesDateEnd;
    });

    const exportData = filteredData.map(item => ({
      Data: new Date(item.date).toLocaleDateString(),
      Descricao: item.description,
      Categoria: item.category,
      Tipo: item.type === 'inflow' ? 'Entrada' : 'Saída',
      Valor: Math.abs(item.amount),
      Status: item.status === 'paid' ? 'Liquidado' : 'Provisionado'
    }));

    if (format === 'csv') exportToCSV(exportData, 'fluxo_caixa');
    else if (format === 'excel') exportToExcel(exportData, 'fluxo_caixa');
    else if (format === 'pdf') exportToPDF(exportData, 'fluxo_caixa', 'Relatório de Fluxo de Caixa');
  };

  const handleViewDetails = (tx: Transaction) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: tx.date, title: 'Transação: ' + tx.description, subtitle: 'Categoria: ' + tx.category, value: tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: tx.type === 'inflow' ? 'success' : 'warning' },
      { id: '2', date: tx.date, title: 'Status Financeiro', subtitle: tx.status === 'paid' ? 'Liquidado' : 'Provisionado', value: tx.status.toUpperCase(), status: tx.status === 'paid' ? 'success' : 'pending' },
    ]);
  };

  const columns = [
    {
      header: 'Data / Descrição',
      accessor: (item: Transaction) => (
        <div className="table-cell-title">
          <span className="main-text">{new Date(item.date).toLocaleDateString()}</span>
          <div className="sub-meta">
            <FileText size={12} />
            <span>{item.description}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Categoria',
      accessor: (item: Transaction) => (
        <span className="sub-meta uppercase font-bold text-[10px] tracking-wider">
          {item.category}
        </span>
      )
    },
    {
      header: 'Montante',
      accessor: (item: Transaction) => (
        <div className={`flex items-center gap-2 font-bold ${item.type === 'inflow' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {item.type === 'inflow' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
          <span>{Math.abs(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: Transaction) => (
        <span className={`status-pill ${item.status === 'paid' ? 'active' : 'warning'}`}>
          {item.status === 'paid' ? 'Efetivado' : 'Previsto'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  const analyticalCategories = [
    { 
      name: 'Receita Realizada', 
      value: transactions.filter(t => t.type === 'inflow' && t.status === 'paid').reduce((acc, t) => acc + Math.abs(t.amount), 0), 
      color: '#10b981', 
      icon: ArrowUpRight,
      percentage: 100 
    },
    { 
      name: 'Despesa Realizada', 
      value: transactions.filter(t => t.type === 'outflow' && t.status === 'paid').reduce((acc, t) => acc + Math.abs(t.amount), 0), 
      color: '#ef4444', 
      icon: ArrowDownLeft,
      percentage: 100
    },
    { 
      name: 'Provisionado (Líquido)', 
      value: transactions.filter(t => t.status === 'pending').reduce((acc, t) => acc + t.amount, 0), 
      color: '#3b82f6', 
      icon: Clock,
      percentage: 65
    },
    { 
      name: 'Result. Consolidado', 
      value: transactions.reduce((acc, t) => acc + t.amount, 0), 
      color: '#f59e0b', 
      icon: Layers,
      percentage: 88
    },
  ];

  // Dynamic Composition Calculations
  const inflowsByCategory = transactions.filter(t => t.type === 'inflow').reduce((acc: any, t) => {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
    return acc;
  }, {});
  
  const outflowsByCategory = transactions.filter(t => t.type === 'outflow').reduce((acc: any, t) => {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
    return acc;
  }, {});

  const totalInflow = Object.values(inflowsByCategory).reduce((a: any, b: any) => a + b, 0) || 1;
  const totalOutflow = Object.values(outflowsByCategory).reduce((a: any, b: any) => a + b, 0) || 1;

  const topInflows = Object.entries(inflowsByCategory)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3)
    .map(([name, val]: any) => ({ name, percent: ((val / totalInflow) * 100).toFixed(0) }));

  const topOutflows = Object.entries(outflowsByCategory)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3)
    .map(([name, val]: any) => ({ name, percent: ((val / totalOutflow) * 100).toFixed(0) }));

  return (
    <div className="cash-flow-page animate-slide-up">
      <GlobalModeBanner />
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge premium">
            <Sparkles size={14} fill="currentColor" />
            <span>ELITE TREASURY v5.0</span>
          </div>
          <h1 className="page-title">Fluxo de Caixa Unificado</h1>
          <p className="page-subtitle">Gestão operacional e inteligência financeira avançada em um único dashboard.</p>
        </div>
        <div className="page-actions">
          <div className="view-mode-toggle">
            <button 
              className={`mode-btn ${viewMode === 'operational' ? 'active' : ''}`}
              onClick={() => setViewMode('operational')}
            >
              <Layers size={16} /> OPERACIONAL
            </button>
            <button 
              className={`mode-btn ${viewMode === 'analytical' ? 'active' : ''}`}
              onClick={() => setViewMode('analytical')}
            >
              <BarChart3 size={16} /> ANALÍTICO
            </button>
          </div>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} /> NOVA OPERAÇÃO
          </button>
        </div>
      </header>

      <style>{`
        .next-gen-kpi-grid {
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 20px !important;
          margin-bottom: 32px !important;
        }

        @media (max-width: 1400px) {
          .next-gen-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          .next-gen-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Wallet} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change={stat.change}
            periodLabel={stat.periodLabel}
            sparkline={stat.sparkline}
            trend={stat.trend}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'analytical' ? (
          <motion.div 
            key="analytical"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="analytical-view-content"
          >
            <div className="premium-category-grid">
              {analyticalCategories.map((cat, idx) => (
                <div key={idx} className="category-item-card">
                  <div className="cat-icon" style={{ background: cat.color + '22', color: cat.color }}>
                    <cat.icon size={24} />
                  </div>
                  <div className="cat-info">
                    <span className="cat-label">{cat.name}</span>
                    <h4 className="cat-value">{cat.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4>
                  </div>
                  <div className="cat-progress-bar">
                    <div className="fill" style={{ width: '75%', background: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="analytical-summary-cards" style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div className="summary-box glass-card">
                <h3>Composição de Entradas</h3>
                <div className="progress-list">
                  {topInflows.length > 0 ? topInflows.map((item, i) => (
                    <div key={i} className="progress-item"><span>{item.name}</span><span>{item.percent}%</span></div>
                  )) : <div className="text-center py-4 text-xs font-bold text-slate-400">Sem dados no período</div>}
                </div>
              </div>
              <div className="summary-box glass-card">
                <h3>Composição de Saídas</h3>
                <div className="progress-list">
                  {topOutflows.length > 0 ? topOutflows.map((item, i) => (
                    <div key={i} className="progress-item"><span>{item.name}</span><span>{item.percent}%</span></div>
                  )) : <div className="text-center py-4 text-xs font-bold text-slate-400">Sem dados no período</div>}
                </div>
              </div>
              <div className="summary-box glass-card elite-insight-box">
                <h3>Elite Copilot Intelligence</h3>
                <div className="progress-list">
                  <div className="progress-item insight-success">
                    <span>Projeção de Saldo</span>
                    <span>{transactions.reduce((acc, t) => acc + t.amount, 0) >= 0 ? '+ Positivo' : '- Atenção'}</span>
                  </div>
                  <div className="progress-item">
                    <span>Índice de Cobertura</span>
                    <span>{((totalInflow / totalOutflow) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="progress-item insight-warning">
                    <span>Concentração Risco</span>
                    <span>{topOutflows[0]?.percent || 0}% em {topOutflows[0]?.name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="operational"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="elite-controls-row">
              <div className="elite-tab-group">
                <button className={`elite-tab-item ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>Livro Caixa</button>
                <button className={`elite-tab-item ${activeTab === 'INFLOW' ? 'active' : ''}`} onClick={() => setActiveTab('INFLOW')}>Entradas</button>
                <button className={`elite-tab-item ${activeTab === 'OUTFLOW' ? 'active' : ''}`} onClick={() => setActiveTab('OUTFLOW')}>Saídas</button>
              </div>
              <div className="elite-tab-group secondary" style={{ marginLeft: '12px', background: 'hsl(var(--bg-main)/0.5)', padding: '2px' }}>
                <button 
                  className={`elite-tab-item ${statusFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('ALL')}
                  style={{ fontSize: '10px', padding: '6px 12px' }}
                >
                  Ambos
                </button>
                <button 
                  className={`elite-tab-item ${statusFilter === 'PENDING' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('PENDING')}
                  style={{ fontSize: '10px', padding: '6px 12px' }}
                >
                  A Realizar
                </button>
                <button 
                  className={`elite-tab-item ${statusFilter === 'PAID' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('PAID')}
                  style={{ fontSize: '10px', padding: '6px 12px' }}
                >
                  Realizado
                </button>
              </div>

              <div className="elite-search-wrapper">
                <Search size={18} className="s-icon" />
                <input 
                  type="text" 
                  className="elite-search-input"
                  placeholder="Pesquisar transações..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="elite-filter-group">
                <button className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`} onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}><Filter size={20} /></button>
                <div className="export-dropdown-container">
                  <button 
                    className="icon-btn-secondary" 
                    title="Exportar"
                    onClick={() => {
                      const menu = document.getElementById('export-menu-cashflow');
                      if (menu) menu.classList.toggle('active');
                    }}
                  >
                    <Download size={20} />
                  </button>
                  <div id="export-menu-cashflow" className="export-menu">
                    <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-cashflow')?.classList.remove('active'); }}>CSV</button>
                    <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-cashflow')?.classList.remove('active'); }}>Excel (.xlsx)</button>
                    <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-cashflow')?.classList.remove('active'); }}>PDF Profissional</button>
                  </div>
                </div>
              </div>
            </div>

            <FinanceFilterModal 
              isOpen={showAdvancedFilters}
              onClose={() => setShowAdvancedFilters(false)}
              filters={filterValues}
              setFilters={setFilterValues}
            />

            <div className="management-content">
              <ModernTable 
                data={transactions.filter(t => {
                  const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesTab = activeTab === 'ALL' || (activeTab === 'INFLOW' ? t.type === 'inflow' : t.type === 'outflow');
                  const matchesStatusFilter = statusFilter === 'ALL' || (statusFilter === 'PENDING' ? t.status === 'pending' : t.status === 'paid');
                  
                  // Advanced Sidebar Filters
                  const matchesType = filterValues.type === 'all' || t.type === filterValues.type;
                  const matchesCategory = filterValues.categories.length === 0 || filterValues.categories.includes(t.category);
                  const matchesLiquidation = filterValues.status === 'all' || t.status === (filterValues.status === 'PAID' ? 'paid' : 'pending');
                  
                  const txDate = new Date(t.date);
                  const matchesDateStart = !filterValues.dateStart || txDate >= new Date(filterValues.dateStart);
                  const matchesDateEnd = !filterValues.dateEnd || txDate <= new Date(filterValues.dateEnd);

                  return matchesSearch && matchesTab && matchesStatusFilter && matchesType && matchesCategory && matchesLiquidation && matchesDateStart && matchesDateEnd;
                })}
                columns={columns}
                loading={loading}
                hideHeader={true}
                actions={(item) => (
                  <div className="modern-actions">
                    <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Detalhes"><Eye size={18} /></button>
                    <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Conciliar"><Zap size={18} /></button>
                  </div>
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TransactionForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} initialData={selectedTransaction} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Dossiê de Fluxo" subtitle="Rastreabilidade completa" items={historyItems} />

      <style>{`
        .view-mode-toggle {
          display: flex;
          background: hsl(var(--bg-main));
          padding: 4px;
          border-radius: 12px;
          border: 1px solid hsl(var(--border));
          margin-right: 12px;
        }

        .mode-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-size: 11px;
          font-weight: 800;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: 0.2s;
        }

        .mode-btn.active {
          background: white;
          color: hsl(var(--brand));
          box-shadow: var(--shadow-sm);
        }

        .premium-category-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .category-item-card {
          background: hsl(var(--bg-card));
          padding: 24px;
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s ease;
        }

        .category-item-card:hover {
          transform: translateY(-5px);
          border-color: hsl(var(--brand) / 0.5);
          box-shadow: var(--shadow-lg);
        }

        .cat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cat-label {
          font-size: 11px;
          font-weight: 900;
          color: hsl(var(--text-main));
          text-transform: uppercase;
          letter-spacing: 0.1em;
          opacity: 0.6;
        }

        .cat-value {
          font-size: 22px;
          font-weight: 950;
          color: hsl(var(--text-main));
          margin: 0;
          letter-spacing: -0.02em;
        }

        .cat-progress-bar {
          height: 6px;
          background: hsl(var(--bg-main));
          border-radius: 100px;
          overflow: hidden;
        }

        .cat-progress-bar .fill {
          height: 100%;
          border-radius: 100px;
        }

        .summary-box {
          padding: 24px;
          border-radius: 24px;
          background: hsl(var(--bg-card) / 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid hsl(var(--border));
          box-shadow: var(--shadow-sm);
        }

        .summary-box h3 {
          font-size: 13px;
          font-weight: 900;
          margin-bottom: 24px;
          color: hsl(var(--text-main));
          text-transform: uppercase;
          letter-spacing: 0.1em;
          opacity: 0.8;
        }

        .progress-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .progress-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 700;
          color: hsl(var(--text-muted));
          padding-bottom: 12px;
          border-bottom: 1px solid hsl(var(--border) / 0.3);
        }

        .progress-item span:last-child {
          color: hsl(var(--brand));
          font-weight: 900;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};
