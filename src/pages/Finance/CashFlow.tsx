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
  Clock,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { TransactionForm } from '../../components/Forms/TransactionForm';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { FinanceFilterModal } from './components/FinanceFilterModal';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useReportData } from '../../hooks/useReportData';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import './CashFlow.css';
import { EmptyState } from '../../components/Feedback/EmptyState';
import toast from 'react-hot-toast';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'payable' | 'receivable'>('payable');
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

  const handleOpenCreate = (type: 'payable' | 'receivable') => {
    setSelectedTransaction(null);
    setTransactionType(type);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: any) => {
    setSelectedTransaction(tx);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!canCreate) {
      toast.error('⚠️ Selecione uma unidade específica para lançar uma nova operação. No modo Visão Global, o caixa deve ser vinculado a uma fazenda.');
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
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontWeight: 600, fontSize: '12px', opacity: item.status === 'pending' ? 0.6 : 1 }}>
          <Calendar size={14} />
          <span>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Descrição Operação',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left', opacity: item.status === 'pending' ? 0.6 : 1, fontStyle: item.status === 'pending' ? 'italic' : 'normal' }}>
          <span className="main-text" style={{ fontWeight: 700, color: '#1e293b' }}>
            {item.description || 'Lançamento sem descrição'}
            {item.status === 'pending' && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#f59e0b', background: '#fef3c7', padding: '2px 4px', borderRadius: '4px', fontStyle: 'normal' }}>PROJETADO</span>}
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
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left', opacity: item.status === 'pending' ? 0.6 : 1 }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', textTransform: 'uppercase' }}>
            {item.category}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Tipo Lançamento',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center', opacity: item.status === 'pending' ? 0.6 : 1 }}>
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
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontWeight: 800, color: item.type === 'inflow' ? '#059669' : '#e11d48', opacity: item.status === 'pending' ? 0.6 : 1 }}>
          {item.type === 'inflow' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
          <span>{Math.abs(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Saldo Acumulado',
      accessor: (item: any) => {
        const balance = item.runningBalance || 0;
        const isNegative = balance < 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 900, fontSize: '13px', color: isNegative ? '#dc2626' : '#1e293b' }}>
            {isNegative && <AlertTriangle size={14} color="#dc2626" />}
            <span style={{ background: isNegative ? '#fee2e2' : 'transparent', padding: isNegative ? '2px 8px' : '0', borderRadius: '4px' }}>
              {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        );
      },
      align: 'center' as const
    },
    {
      header: 'Situação',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${item.status === 'paid' ? 'active' : 'warning'}`} style={{ opacity: item.status === 'pending' ? 0.6 : 1 }}>
            {item.status === 'paid' ? 'Efetivado' : 'Projetado'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  // Filtra, ordena e calcula Running Balance
  const filteredAndCalculatedTransactions = () => {
    let list = transactions.filter(t => {
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

    // Ordenação cronológica
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calcula Running Balance (Saldo inicial assumido como o total reportStats id 'caixa' ou 0)
    // Para simplificar, assumiremos saldo inicial 0 na lista filtrada para ver a projeção exata do período
    let currentBalance = 0;
    
    return list.map(t => {
      const val = t.type === 'inflow' ? t.amount : -t.amount;
      currentBalance += val;
      return { ...t, runningBalance: currentBalance };
    });
  };

  const calculatedData = filteredAndCalculatedTransactions();


  return (
    <div className="cash-flow-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Financeiro & Banco', href: '/financeiro' }, { label: 'Fluxo de Caixa' }]} />

          <h1 className="page-title">Fluxo de Caixa Unificado</h1>
          <p className="page-subtitle">Gestão operacional e inteligência financeira avançada em um único dashboard.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="primary-btn" 
            onClick={() => handleOpenCreate('receivable')}
            style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px' }}
          >
            <ArrowUpRight size={18} /> NOVA RECEITA
          </button>
          <button 
            className="primary-btn" 
            onClick={() => handleOpenCreate('payable')}
            style={{ background: '#e11d48', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px' }}
          >
            <ArrowDownLeft size={18} /> NOVA DESPESA
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
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={Wallet} color=""  periodLabel="Mês Atual" />)
        ) : reportStats?.map((stat: any, idx: number) => (
          <TauzeStatCard 
            key={idx}
            {...stat}
            icon={getStatIcon(stat.id)}
          />
        ))}
      </div>

      <div className="operational-view-content animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="tauze-controls-row">
              <div className="tauze-tab-group">
                <button className={`tauze-tab-item ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>Livro Caixa</button>
                <button className={`tauze-tab-item ${activeTab === 'INFLOW' ? 'active' : ''}`} onClick={() => setActiveTab('INFLOW')}>Entradas</button>
                <button className={`tauze-tab-item ${activeTab === 'OUTFLOW' ? 'active' : ''}`} onClick={() => setActiveTab('OUTFLOW')}>Saídas</button>
              </div>
              <div className="tauze-tab-group secondary" style={{ marginLeft: '12px', background: 'hsl(var(--bg-main)/0.5)', padding: '2px' }}>
                <button 
                  className={`tauze-tab-item ${statusFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('ALL')}
                  style={{ fontSize: '10px', padding: '6px 12px' }}
                >
                  Ambos
                </button>
                <button 
                  className={`tauze-tab-item ${statusFilter === 'PENDING' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('PENDING')}
                  style={{ fontSize: '10px', padding: '6px 12px' }}
                >
                  A Realizar
                </button>
                <button 
                  className={`tauze-tab-item ${statusFilter === 'PAID' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('PAID')}
                  style={{ fontSize: '10px', padding: '6px 12px' }}
                >
                  Realizado
                </button>
              </div>

              <div className="tauze-search-wrapper">
                <Search size={18} className="s-icon" />
                <input 
                  type="text" 
                  className="tauze-search-input"
                  placeholder="Pesquisar transações..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="tauze-filter-group">
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
          emptyState={
            <EmptyState
              title="Nenhum registro encontrado"
              description="Sua busca não retornou resultados."
              icon={Search}
            />
          } 
                data={calculatedData}
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
      </div>

      <TransactionForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type={selectedTransaction ? (selectedTransaction.type === 'inflow' ? 'receivable' : 'payable') : transactionType} onSubmit={handleSubmit} initialData={selectedTransaction} />
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
          background: hsl(var(--bg-card));
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
