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
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { TransactionForm } from '../../components/Forms/TransactionForm';
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
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    type: 'all',
    dateStart: '',
    dateEnd: ''
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
      const projected = (receivables.data?.filter(r => r.status === 'PENDENTE').reduce((acc, curr) => acc + Number(curr.valor_total), 0) || 0) -
                        (payables.data?.filter(p => p.status === 'PENDENTE').reduce((acc, curr) => acc + Number(curr.valor_total), 0) || 0);

      setStats([
        { 
          label: 'Liquidez Total', 
          value: totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
          icon: Wallet, 
          color: '#10b981', 
          progress: 100,
          change: 'Saldo Consolidado',
          periodLabel: 'Disponibilidade Hoje',
          sparkline: [
            { value: 60, label: 'R$ 45k' }, { value: 65, label: 'R$ 48k' }, { value: 70, label: 'R$ 52k' }, 
            { value: 68, label: 'R$ 50k' }, { value: 75, label: 'R$ 55k' }, { value: 80, label: 'R$ 58k' }, 
            { value: 90, label: 'R$ 62k' }, { value: 100, label: 'Atual: R$ ' + (totalBalance / 1000).toFixed(1) + 'k' }
          ]
        },
        { 
          label: 'Fluxo de Entrada', 
          value: inMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
          icon: TrendingUp, 
          color: '#3b82f6', 
          progress: 85, 
          trend: 'up',
          change: '+R$ 1.500 hoje',
          periodLabel: 'Receitas 30d',
          sparkline: [
            { value: 30, label: 'R$ 2k' }, { value: 50, label: 'R$ 5k' }, { value: 40, label: 'R$ 4k' }, 
            { value: 80, label: 'R$ 12k' }, { value: 60, label: 'R$ 8k' }, { value: 70, label: 'R$ 10k' }, 
            { value: 90, label: 'R$ 15k' }, { value: 85, label: 'Entrada: R$ ' + (inMonth / 1000).toFixed(1) + 'k' }
          ]
        },
        { 
          label: 'Fluxo de Saída', 
          value: outMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
          icon: TrendingDown, 
          color: '#ef4444', 
          progress: 60, 
          trend: 'down',
          change: 'Custos Operacionais',
          periodLabel: 'Despesas 30d',
          sparkline: [
            { value: 20, label: 'R$ 1k' }, { value: 40, label: 'R$ 3k' }, { value: 80, label: 'R$ 8k' }, 
            { value: 50, label: 'R$ 5k' }, { value: 30, label: 'R$ 2k' }, { value: 60, label: 'R$ 6k' }, 
            { value: 40, label: 'R$ 4k' }, { value: 60, label: 'Saída: R$ ' + (outMonth / 1000).toFixed(1) + 'k' }
          ]
        },
        { 
          label: 'Projeção 30D', 
          value: (totalBalance + projected).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
          icon: Zap, 
          color: '#f59e0b', 
          progress: 95,
          change: 'Saldo Futuro Est.',
          periodLabel: 'Tendência Próx. Mês',
          sparkline: [
            { value: 80, label: 'R$ 50k' }, { value: 82, label: 'R$ 52k' }, { value: 85, label: 'R$ 55k' }, 
            { value: 88, label: 'R$ 58k' }, { value: 90, label: 'R$ 60k' }, { value: 92, label: 'R$ 62k' }, 
            { value: 95, label: 'R$ 65k' }, { value: 98, label: 'Proj: R$ ' + ((totalBalance + projected) / 1000).toFixed(1) + 'k' }
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

    const payload = {
      descricao: data.description,
      valor: parseFloat(data.amount),
      data_vencimento: data.date,
      categoria: data.category,
      tipo: data.type, // inflow/outflow
      status: data.status, // paid/pending
      fazenda_id: activeFarm.id,
      tenant_id: activeFarm.tenantId
    };

    // Note: CashFlow usually aggregates from accounts payable/receivable
    // Here we simulate a direct transaction insert if needed, 
    // but usually it's better to reload the data.
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

  const handleViewDetails = (tx: Transaction) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: tx.date, title: 'Transação: ' + tx.description, subtitle: 'Categoria: ' + tx.category, value: tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: tx.type === 'inflow' ? 'success' : 'warning' },
      { id: '2', date: tx.date, title: 'Status Financeiro', subtitle: tx.status === 'paid' ? 'Liquidado' : 'Provisionado', value: tx.status.toUpperCase(), status: tx.status === 'paid' ? 'success' : 'pending' },
      { id: '3', date: tx.date, title: 'Impacto no Caixa', subtitle: 'Saldo Após Operação', value: 'Calculando...', status: 'info' },
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
          <span>{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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

  return (
    <div className="cash-flow-page animate-slide-up">
      <GlobalModeBanner />
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <PieChart size={14} fill="currentColor" />
            <span>ELITE TREASURY v5.0</span>
          </div>
          <h1 className="page-title">Fluxo de Caixa</h1>
          <p className="page-subtitle">Visibilidade total de liquidez, projeções financeiras e histórico de movimentações em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => window.print()}>
            <Download size={18} />
            EXPORTAR BI
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA OPERAÇÃO
          </button>
        </div>
      </header>

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

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Livro Caixa
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'INFLOW' ? 'active' : ''}`}
            onClick={() => setActiveTab('INFLOW')}
          >
            Entradas
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'OUTFLOW' ? 'active' : ''}`}
            onClick={() => setActiveTab('OUTFLOW')}
          >
            Saídas
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
          <button 
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Log">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="advanced-filter-panel"
          >
            <div className="filter-grid">
              <div className="filter-field">
                <label className="elite-label">Tipo de Lançamento</label>
                <select 
                  className="elite-input elite-select"
                  value={filterValues.type}
                  onChange={(e) => setFilterValues({...filterValues, type: e.target.value})}
                >
                  <option value="all">Todos</option>
                  <option value="inflow">Entradas (Receitas)</option>
                  <option value="outflow">Saídas (Despesas)</option>
                </select>
              </div>
              <div className="filter-field">
                <label className="elite-label">Data Inicial</label>
                <input 
                  className="elite-input"
                  type="date" 
                  value={filterValues.dateStart}
                  onChange={(e) => setFilterValues({...filterValues, dateStart: e.target.value})}
                />
              </div>
              <div className="filter-field">
                <label className="elite-label">Data Final</label>
                <input 
                  className="elite-input"
                  type="date" 
                  value={filterValues.dateEnd}
                  onChange={(e) => setFilterValues({...filterValues, dateEnd: e.target.value})}
                />
              </div>
              <div className="filter-actions-inline">
                <button className="text-btn" onClick={() => setFilterValues({ type: 'all', dateStart: '', dateEnd: '' })}>
                  LIMPAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="management-content">
        <ModernTable 
          data={transactions.filter(t => {
            const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'ALL' || (activeTab === 'INFLOW' ? t.type === 'inflow' : t.type === 'outflow');
            return matchesSearch && matchesTab;
          })}
          columns={columns}
          loading={loading}
          hideHeader={true}
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Detalhes">
                <Eye size={18} />
              </button>
              <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar/Conciliar">
                <Zap size={18} />
              </button>
            </div>
          )}
        />
      </div>

      <TransactionForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedTransaction}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê de Fluxo"
        subtitle="Rastreabilidade completa da movimentação de caixa"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
