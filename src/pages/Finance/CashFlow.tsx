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
import { useReportData } from '../../hooks/useReportData';
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
  const { canCreate, insertPayload } = useFarmFilter();
  const { data: rawTransactions, stats: reportStats, loading, error, refresh } = useReportData('fluxo-caixa');
  const transactions = rawTransactions || [];
  
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
    categories: [] as string[],
    status: 'all'
  });

  const getStatIcon = (id: string) => {
    switch (id) {
      case 'patrimonio': return Activity;
      case 'resultado': return TrendingUp;
      case 'runway': return Zap;
      default: return Target;
    }
  };

  if (error) {
    console.error("[CashFlow] Load Error:", error);
  }

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
      refresh();
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
      header: 'Data Conciliação',
      accessor: (item: Transaction) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontWeight: 600, fontSize: '12px' }}>
          <Calendar size={14} />
          <span>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Descrição Operação',
      accessor: (item: Transaction) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 700, color: '#1e293b' }}>
            {item.description || 'Lançamento sem descrição'}
          </span>
          <span className="sub-meta" style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
            DOC: {item.id?.slice(0, 8).toUpperCase() || 'PROVISIONADO'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Categoria DRE',
      accessor: (item: Transaction) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>
            {item.category}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Tipo Lançamento',
      accessor: (item: Transaction) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ 
            fontSize: '9px', 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            color: item.type === 'inflow' ? '#059669' : '#dc2626',
            background: item.type === 'inflow' ? '#ecfdf5' : '#fef2f2',
            padding: '2px 6px',
            borderRadius: '4px',
            width: 'fit-content'
          }}>
            {item.type === 'inflow' ? 'Entrada' : 'Saída'}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Valor Líquido BRL',
      accessor: (item: Transaction) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: 800, color: item.type === 'inflow' ? '#059669' : '#e11d48' }}>
          {item.type === 'inflow' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
          <span>{Math.abs(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Situação',
      accessor: (item: Transaction) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${item.status === 'paid' ? 'active' : 'warning'}`}>
            {item.status === 'paid' ? 'Efetivado' : 'Previsto'}
          </span>
        </div>
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

  const totalInflow = (Object.values(inflowsByCategory).reduce((a: any, b: any) => a + b, 0) as number) || 1;
  const totalOutflow = (Object.values(outflowsByCategory).reduce((a: any, b: any) => a + b, 0) as number) || 1;

  const topInflows = Object.entries(inflowsByCategory)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3)
    .map(([name, val]: any) => ({ name, percent: ((Number(val) / Number(totalInflow)) * 100).toFixed(0) }));

  const topOutflows = Object.entries(outflowsByCategory)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3)
    .map(([name, val]: any) => ({ name, percent: ((Number(val) / Number(totalOutflow)) * 100).toFixed(0) }));

  return (
    <div className="cash-flow-page animate-slide-up">
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
        ) : reportStats?.map((stat: any, idx: number) => (
          <EliteStatCard 
            key={idx}
            {...stat}
            icon={getStatIcon(stat.id)}
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
                    <span>{((Number(totalInflow) / Number(totalOutflow)) * 100).toFixed(1)}%</span>
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
                    <FileText size={20} />
                  </button>
                  <div id="export-menu-cashflow" className="export-menu">
                    <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-cashflow')?.classList.remove('active'); }}>Excel (.CSV)</button>
                    <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-cashflow')?.classList.remove('active'); }}>Excel (.xlsx)</button>
                    <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-cashflow')?.classList.remove('active'); }}>PDF</button>
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

      <TransactionForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type={selectedTransaction?.type === 'inflow' ? 'receivable' : 'payable'} onSubmit={handleSubmit} initialData={selectedTransaction} />
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
