import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter,
  Calendar, 
  ChevronRight, 
  MoreVertical,
  FileText,
  BarChart2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Trash2,
  Edit3,
  History,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { ContractForm } from '../../components/Forms/ContractForm';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { HedgeSimulationModal } from './components/HedgeSimulationModal';
import { ContractFilterModal } from './components/ContractFilterModal';

export const Contracts: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHedgeModalOpen, setIsHedgeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    priceType: 'all',
    minProgress: 0,
    dateStart: '',
    dateEnd: ''
  });
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;
    if (isReady) {
      fetchContracts();
      // Ponte 1: Auto-open form if coming from B3 Calculator
      if (location.state?.createHedge) {
        setSelectedContract({
          contract_number: `HEDGE-${location.state.b3Ticker}`,
          type: 'venda',
          description: `Contrato de Hedge derivado da B3 - Ticker: ${location.state.b3Ticker} | Preço Alvo: R$ ${location.state.futurePrice.toFixed(2)}`,
          status: 'active'
        });
        setIsModalOpen(true);
        // Clear state to avoid reopening on refresh
        window.history.replaceState({}, document.title);
      }
    } else {
      setLoading(false);
    }
  }, [activeFarmId, isGlobalMode, activeTenantId, location.state]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('contratos').select('*, clientes(nome)').order('created_at', { ascending: false }).limit(500);
      query = applyFarmFilter(query);
      const { data, error } = await query;
      
      if (data) {
        // Enriching with hedge intelligence
        const enrichedContracts = data.map(c => {
          const isFixed = c.valor_total > 0; // Simplified logic: if has value, it's fixed
          const physicalProgress = c.totalVolume ? ((c.deliveredVolume || 0) / c.totalVolume) * 100 : 0;
          
          return {
            ...c,
            isFixed,
            physicalProgress,
            priceType: isFixed ? 'PREÇO FIXO' : 'A FIXAR',
            marketDelta: isFixed ? (Math.random() * 10 - 5).toFixed(1) : 'N/A' // Mocking market variation vs locked price
          };
        });

        setContracts(enrichedContracts);
        const totalValor = data.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
        const fixedCount = enrichedContracts.filter(c => c.isFixed).length;
        
        setStats([
          { label: 'Exposição Safra', value: '64.2%', icon: TrendingUp, color: '#10b981', progress: 64, change: 'Compromissado', trend: 'up' },
          { label: 'Valor em Hedge', value: totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: '#3b82f6', progress: 85, change: 'Volume Bloqueado' },
          { label: 'Fixação de Preço', value: `${fixedCount}/${data.length}`, icon: ShieldCheck, color: '#166534', progress: (fixedCount / (data.length || 1)) * 100, change: 'Contratos Liquidados' },
          { label: 'Eficiência Hedge', value: '+4.8%', icon: BarChart2, color: '#f59e0b', progress: 92, change: 'vs Média Mercado' },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedContract(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contract: any) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!canCreate) {
      alert('⚠️ Selecione uma unidade específica para registrar um novo contrato. No modo Visão Global, a fazenda contratante deve ser definida.');
      return;
    }
    const payload: any = {
      numero_contrato: data.contract_number,
      tipo: data.type,
      data_inicio: data.start_date,
      data_fim: data.end_date,
      valor_total: parseFloat(data.total_value),
      status: data.status,
      descricao: data.description
    };
    if (data.party_type === 'client') payload.cliente_id = data.party_id;
    else payload.fornecedor_id = data.party_id;

    if (selectedContract) {
      const { error } = await supabase.from('contratos').update(payload).eq('id', selectedContract.id);
      if (!error) { setIsModalOpen(false); fetchContracts(); }
    } else {
      const { error } = await supabase.from('contratos').insert([{ ...payload, ...insertPayload }]);
      if (!error) { setIsModalOpen(false); fetchContracts(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este contrato?')) return;
    const { error } = await supabase.from('contratos').delete().eq('id', id);
    if (!error) fetchContracts();
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = contracts.filter(c => {
      const matchesSearch = (c.numero_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.clientes?.nome || c.fornecedores?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'ACTIVE' ? c.status === 'active' : c.status === 'completed';
      const matchesStatus = filterValues.status === 'all' || c.status === filterValues.status;
      const matchesPriceType = filterValues.priceType === 'all' || c.priceType === filterValues.priceType;
      const matchesProgress = (c.physicalProgress || 0) >= filterValues.minProgress;
      const matchesDate = (!filterValues.dateStart || new Date(c.data_inicio) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(c.data_inicio) <= new Date(filterValues.dateEnd));
      return matchesSearch && matchesTab && matchesStatus && matchesPriceType && matchesProgress && matchesDate;
    });

    const exportData = filteredData.map(item => ({
      ID: '#' + (item.id?.slice(0, 8).toUpperCase()),
      Contraparte: item.clientes?.nome || item.fornecedores?.nome || 'N/A',
      Vigencia: new Date(item.data_inicio).toLocaleDateString() + ' - ' + new Date(item.data_fim).toLocaleDateString(),
      Tipo_Preco: item.priceType,
      Valor_Total: 'R$ ' + Number(item.valor_total).toLocaleString(),
      Execucao_Fisica: item.physicalProgress.toFixed(1) + '%',
      Delta_Mercado: item.isFixed ? item.marketDelta + '%' : '---',
      Status: item.status === 'active' ? 'Vigente' : 'Concluído'
    }));

    if (format === 'csv') exportToCSV(exportData, 'contratos_venda');
    else if (format === 'excel') exportToExcel(exportData, 'contratos_venda');
    else if (format === 'pdf') exportToPDF(exportData, 'contratos_venda', 'Relatório de Contratos e Hedge de Venda');
  };

  const columns = [
    {
      header: 'Contrato / Contraparte',
      accessor: (item: any) => (
        <div className="table-cell-title text-left" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="main-text font-bold text-slate-800">#{item.id?.slice(0, 8).toUpperCase()}</span>
          <span className="sub-meta uppercase font-bold text-[10px] tracking-wider text-slate-500">
            {item.clientes?.nome || 'CLIENTE NÃO IDENTIFICADO'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Vigência / Prazo',
      accessor: (item: any) => (
        <div className="table-cell-meta flex flex-col items-center justify-center gap-1 font-semibold text-slate-600">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <Calendar size={12} />
            <span>{new Date(item.data_inicio).toLocaleDateString()} - {new Date(item.data_fim).toLocaleDateString()}</span>
          </div>
          <span className="sub-meta" style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700 }}>
            Nº OS: {item.numero_contrato || 'N/A'}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Fixação / Modalidade',
      accessor: (item: any) => (
        <div className="flex flex-col items-center gap-1">
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border inline-block w-fit ${
            item.isFixed ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            {item.priceType}
          </span>
          {item.isFixed && (
            <span className={`text-[9px] font-bold ${Number(item.marketDelta) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              Delta: {Number(item.marketDelta) > 0 ? '↑' : '↓'} {Math.abs(Number(item.marketDelta))}%
            </span>
          )}
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Execução Física',
      accessor: (item: any) => {
        const progress = item.totalVolume ? ((item.deliveredVolume || 0) / item.totalVolume) * 100 : 0;
        return (
          <div className="flex flex-col gap-1 min-w-[140px] text-left">
            <div className="flex justify-between text-[10px] font-black italic text-slate-500">
              <span>ENTREGUE</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[9px] font-bold text-slate-400 mt-0.5">
              {(item.deliveredVolume || 0).toLocaleString()} kg / {(item.totalVolume || 0).toLocaleString()} kg
            </span>
          </div>
        );
      },
      align: 'left' as const
    },
    {
      header: 'Valor Bloqueado',
      accessor: (item: any) => (
        <div className="flex flex-col items-end gap-1">
          <span className="font-bold text-slate-900" style={{ fontSize: '13px' }}>
            {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="sub-meta" style={{ fontSize: '9px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
            Valor Total
          </span>
        </div>
      ),
      align: 'right' as const
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${item.status === 'active' ? 'active' : 'info'}`}>
            {item.status === 'active' ? 'Vigente' : 'Concluído'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="contract-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <ShieldCheck size={14} fill="currentColor" />
            <span>TAUZE CONTRACTS v5.0</span>
          </div>
          <h1 className="page-title">Contratos de Venda & Hedge</h1>
          <p className="page-subtitle">Gestão de instrumentos contratuais, fixação de preços futuros e rastreabilidade de compromissos.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsHedgeModalOpen(true)}>
            <BarChart2 size={18} />
            SIMULAÇÃO HEDGE
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO CONTRATO
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={ShieldCheck} color="" />)
        ) : stats.map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+1.8%"
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            Vigentes
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMPLETED')}
          >
            Encerrados
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Buscar por número do contrato ou contraparte..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tauze-filter-group">
          <button 
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`} 
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={20} />
          </button>
          <div className="export-dropdown-container">
            <button 
              className="icon-btn-secondary" 
              title="Exportar"
              onClick={() => {
                const menu = document.getElementById('export-menu-contracts');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-contracts" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-contracts')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-contracts')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-contracts')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <ContractFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />


      <div className="management-content">
        <ModernTable 
          data={contracts.filter(c => {
            const matchesSearch = (c.numero_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.clientes?.nome || c.fornecedores?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'ACTIVE' ? c.status === 'active' : c.status === 'completed';
            
            const matchesStatus = filterValues.status === 'all' || c.status === filterValues.status;
            const matchesPriceType = filterValues.priceType === 'all' || c.priceType === filterValues.priceType;
            const matchesProgress = (c.physicalProgress || 0) >= filterValues.minProgress;
            const matchesDate = (!filterValues.dateStart || new Date(c.data_inicio) >= new Date(filterValues.dateStart)) &&
                               (!filterValues.dateEnd || new Date(c.data_inicio) <= new Date(filterValues.dateEnd));

            return matchesSearch && matchesTab && matchesStatus && matchesPriceType && matchesProgress && matchesDate;
          })}
          columns={columns}
          loading={loading}
          hideHeader={true}
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" onClick={() => {}} title="Dossiê">
                <History size={18} />
              </button>
              <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar">
                <Edit3 size={18} />
              </button>
              <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir">
                <Trash2 size={18} />
              </button>
            </div>
          )}
        />
      </div>

      <ContractForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedContract}
      />

      <HedgeSimulationModal 
        isOpen={isHedgeModalOpen}
        onClose={() => setIsHedgeModalOpen(false)}
      />
    </div>
  );
};
