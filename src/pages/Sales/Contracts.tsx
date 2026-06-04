import React, { useState, useEffect } from 'react';

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
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useApprovalQueue } from '../../hooks/useApprovalQueue';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

export const Contracts: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const { submitForApproval } = useApprovalQueue();
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
      let query = supabase.from('contratos').select('*').order('created_at', { ascending: false }).limit(500);
      query = applyFarmFilter(query);
      const { data, error } = await query;

      if (error) { console.error('[Contracts]', error); setLoading(false); return; }
      
      if (data && data.length > 0) {
        // Buscar parceiros separadamente (cliente_id ou fornecedor_id)
        const parceiroIds = [...new Set([
          ...data.map((c: any) => c.cliente_id),
          ...data.map((c: any) => c.fornecedor_id)
        ].filter(Boolean))];
        let parceirosMap: Record<string, string> = {};
        if (parceiroIds.length > 0) {
          const { data: parceiros } = await supabase.from('parceiros').select('id, nome').in('id', parceiroIds);
          if (parceiros) parceiros.forEach((p: any) => { parceirosMap[p.id] = p.nome; });
        }

        const enrichedContracts = data.map((c: any) => {
          const isFixed = c.valor_total > 0;
          const physicalProgress = c.totalVolume ? ((c.deliveredVolume || 0) / c.totalVolume) * 100 : 0;
          const parceiroNome = parceirosMap[c.cliente_id] || parceirosMap[c.fornecedor_id] || 'N/A';
          return {
            ...c,
            parceiros: { nome: parceiroNome },
            isFixed,
            physicalProgress,
            priceType: isFixed ? 'PREÇO FIXO' : 'A FIXAR',
            marketDelta: '---' // delta real requer integração com B3/cotação de mercado
          };
        });

        setContracts(enrichedContracts);
        const totalValor = data.reduce((acc: number, curr: any) => acc + Number(curr.valor_total || 0), 0);
        const fixedCount = enrichedContracts.filter((c: any) => c.isFixed).length;
        
        const totalAtivos = enrichedContracts.filter((c: any) => c.status === 'active').length;
        const pctAtivos = data.length > 0 ? ((totalAtivos / data.length) * 100).toFixed(1) + '%' : '---';
        
        setStats([
          { label: 'Contratos Ativos', value: pctAtivos, icon: TrendingUp, color: '#10b981', progress: totalAtivos > 0 ? (totalAtivos / data.length) * 100 : 0, change: `${totalAtivos} de ${data.length} total`, trend: 'up' as const, sparkline: buildSparkline(data || [], 'created_at', 'valor_total') },
          { label: 'Valor em Hedge', value: totalValor > 0 ? totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---', icon: DollarSign, color: '#3b82f6', progress: totalValor > 0 ? 100 : 0, change: totalValor > 0 ? 'Volume bloqueado' : 'Sem contratos',
            sparkline: buildSparkline(data || [], 'created_at', 'valor_total')
          },
          { label: 'Fixação de Preço', value: `${fixedCount}/${data.length}`, icon: ShieldCheck, color: '#166534', progress: data.length > 0 ? (fixedCount / data.length) * 100 : 0, change: fixedCount > 0 ? 'Preço fixado' : 'A fixar',
            sparkline: buildSparkline(data || [], 'created_at', 'valor_total')
          },
          { label: 'Eficiência Hedge', value: '---', icon: BarChart2, color: '#f59e0b', progress: 0, change: 'Requer integração B3',
            sparkline: buildSparkline(data || [], 'created_at', 'valor_total')
          },
        ]);
      } else {
        setContracts([]);
        setStats([
          { label: 'Exposição Safra', value: '---', icon: TrendingUp, color: '#10b981', progress: 0, change: 'Sem dados',
            sparkline: buildSparkline(data || [], 'created_at', 'valor_total') },
          { label: 'Valor em Hedge', value: 'R$ 0,00', icon: DollarSign, color: '#3b82f6', progress: 0, change: 'Sem dados',
            sparkline: buildSparkline(data || [], 'created_at', 'valor_total') },
          { label: 'Fixação de Preço', value: '0/0', icon: ShieldCheck, color: '#166534', progress: 0, change: 'Sem dados',
            sparkline: buildSparkline(data || [], 'created_at', 'valor_total') },
          { label: 'Eficiência Hedge', value: '---', icon: BarChart2, color: '#f59e0b', progress: 0, change: 'Sem dados',
            sparkline: buildSparkline(data || [], 'created_at', 'valor_total') },
        ]);
      }
    } catch (err) {
      console.error('[Contracts]', err);
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
      toast.error('âš ï¸ Selecione uma unidade específica para registrar um novo contrato. No modo Visão Global, a fazenda contratante deve ser definida.');
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
      const { data: newRecord, error } = await supabase.from('contratos').insert([{ ...payload, ...insertPayload }]).select().single();
      if (!error) { 
        const { data: userData } = await supabase.auth.getUser();
        await submitForApproval(
          'Contratos de Venda',
          newRecord.id,
          'contratos',
          payload.valor_total,
          `Contrato ${payload.numero_contrato}`,
          userData.user?.email || 'Usuário'
        );
        setIsModalOpen(false); 
        fetchContracts(); 
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este contrato?')) return;
    const { error } = await supabase.from('contratos').delete().eq('id', id);
    if (!error) fetchContracts();
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = contracts.filter(c => {
      const matchesSearch = (c.numero_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.parceiros?.nome || c.fornecedores?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
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
      Contraparte: item.parceiros?.nome || item.fornecedores?.nome || 'N/A',
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
            {item.parceiros?.nome || 'CLIENTE NÃO IDENTIFICADO'}
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
              Delta: {Number(item.marketDelta) > 0 ? 'â†‘' : 'â†“'} {Math.abs(Number(item.marketDelta))}%
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
          <Breadcrumb paths={[{ label: 'Vendas', href: '/vendas/dashboard' }, { label: 'Contratos de Venda & Hedge' }]} />
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
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={ShieldCheck} color="" 
            periodLabel="Periodo Atual"
          />)
        ) : stats.map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change={stat.change || '---'}
            trend={stat.trend}
            sparkline={stat.sparkline}
          
            periodLabel="Periodo Atual"
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
          emptyState={
            !searchTerm && filterValues.status === 'all' && filterValues.priceType === 'all' && filterValues.minProgress === 0 && !filterValues.dateStart && !filterValues.dateEnd ? (
              <EmptyState
                title={activeTab === 'ACTIVE' ? "Nenhum contrato vigente" : "Nenhum contrato encerrado"}
                description={activeTab === 'ACTIVE' ? "Você não possui contratos de venda ou hedge ativos no momento." : "Não há histórico de contratos encerrados."}
                actionLabel={activeTab === 'ACTIVE' ? "Novo Contrato" : undefined}
                onAction={activeTab === 'ACTIVE' ? handleOpenCreate : undefined}
                icon={ShieldCheck}
              />
            ) : (
              <EmptyState
                title="Nenhum registro encontrado"
                description="Sua busca não retornou resultados."
                icon={Search}
              />
            )
          } 
          data={contracts.filter(c => {
            const matchesSearch = (c.numero_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.parceiros?.nome || c.fornecedores?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
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
