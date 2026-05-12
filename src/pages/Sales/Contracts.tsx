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
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { ContractForm } from '../../components/Forms/ContractForm';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';
import { HedgeSimulationModal } from './components/HedgeSimulationModal';
import { ContractFilterModal } from './components/ContractFilterModal';

export const Contracts: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
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
    if (!activeFarmId && !isGlobalMode) return;
    fetchContracts();
  }, [activeFarmId, isGlobalMode]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('contratos').select('*, clientes(nome)').order('created_at', { ascending: false });
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

  const columns = [
    {
      header: 'Contrato / Contraparte',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">#{item.id?.slice(0, 8).toUpperCase()}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.clientes?.nome || 'CLIENTE NÃO IDENTIFICADO'}
          </div>
        </div>
      )
    },
    {
      header: 'Vigência',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Calendar size={14} />
          <span>{new Date(item.data_inicio).toLocaleDateString()} - {new Date(item.data_fim).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      header: 'Fixação / Mercado',
      accessor: (item: any) => (
        <div className="flex flex-col">
          <span className={`text-[10px] font-black px-1 rounded border inline-block w-fit mb-1 ${
            item.isFixed ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            {item.priceType}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">
              {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            {item.isFixed && (
              <span className={`text-[10px] font-bold ${Number(item.marketDelta) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {Number(item.marketDelta) > 0 ? '↑' : '↓'} {Math.abs(Number(item.marketDelta))}%
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Execução',
      accessor: (item: any) => {
        const progress = item.totalVolume ? ((item.deliveredVolume || 0) / item.totalVolume) * 100 : 0;
        return (
          <div className="flex flex-col gap-1 min-w-[120px]">
            <div className="flex justify-between text-[10px] font-black italic">
              <span>FÍSICA</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'active' ? 'active' : 'info'}`}>
          {item.status === 'active' ? 'Vigente' : 'Concluído'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="contract-page animate-slide-up">
      <GlobalModeBanner />
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <ShieldCheck size={14} fill="currentColor" />
            <span>ELITE CONTRACTS v5.0</span>
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
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={ShieldCheck} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
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

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            Vigentes
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMPLETED')}
          >
            Encerrados
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar por número do contrato ou contraparte..." 
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
