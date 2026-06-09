import React, { useState } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { useSearchParams } from 'react-router-dom';
import { 
  HeartPulse, 
  Plus, 
  AlertCircle, 
  ShieldCheck, 
  Calendar,
  FlaskConical,
  Clock,
  Trash2,
  Edit3,
  Activity,
  CheckCircle2,
  Search,
  Filter,
  Stethoscope,
  ChevronRight,
  History,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useReportData } from '../../hooks/useReportData';
import { HealthForm } from '../../components/Forms/HealthForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { HealthProtocolsModal } from './components/HealthProtocolsModal';
import { HealthFilterModal } from './components/HealthFilterModal';
import './HealthManagement.css';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

export const HealthManagement: React.FC = () => {
  const { activeFarm, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'MANEJOS' | 'PROTOCOLOS') || 'MANEJOS';
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });
  };
  
  const [isModalOpen, setIsModalOpen] = usePersistentState('HealthManagement_isModalOpen', false);
  const [formActionId, setFormActionId] = useState<number>(0);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState('HealthManagement_isHistoryModalOpen', false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState('HealthManagement_showAdvancedFilters', false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    tipo: 'all',
    onlyBlocked: false,
    minCarencia: 0,
    dateStart: '',
    dateEnd: ''
  });
  const [isProtocolsModalOpen, setIsProtocolsModalOpen] = usePersistentState('HealthManagement_isProtocolsModalOpen', false);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { 
    data: events, 
    stats, 
    loading, 
    error, 
    totalCount,
    refresh 
  } = useReportData('sanidade-animal', { page, pageSize });

  const handleOpenCreate = () => {
    setSelectedEvent(null);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: any) => {
    setSelectedEvent(event);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const deleteHealthMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sanidade').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('✅ Registro sanitário excluído!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao excluir registro: ' + err.message);
    }
  });

  const applyProtocolMutation = useMutation({
    mutationFn: async (insertions: any[]) => {
      const { error } = await supabase.from('sanidade').insert(insertions);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsProtocolsModalOpen(false);
      toast.success('✅ Protocolo aplicado com sucesso!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao aplicar protocolo: ' + err.message);
    }
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este registro sanitário?')) return;
    deleteHealthMutation.mutate(id);
  };

  const handleViewDetails = (event: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: event.data_manejo, title: 'Tipo: ' + event.titulo, subtitle: 'Produto: ' + (event.produto || 'N/A'), value: event.dose || 'N/A', status: event.status === 'REALIZADO' ? 'success' : 'pending' },
      { id: '2', date: event.data_manejo, title: 'Carência', subtitle: event.carencia_dias > 0 ? `Carência de ${event.carencia_dias} dias` : 'Sem carência', value: event.carencia_dias > 0 ? 'ALERTA' : 'OK', status: event.carencia_dias > 0 ? 'warning' : 'success' },
      { id: '3', date: event.data_manejo, title: 'Observação', subtitle: event.observacao || 'Nenhuma observação', value: 'Info', status: 'info' },
    ]);
  };

  const tableColumns = [
    { 
      header: 'Fármaco / Manejo', 
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            {item.produto || item.titulo || 'Manejo Geral'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '10px', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <HeartPulse size={12} color={item.tipo === 'VACINA' ? '#6366f1' : '#10b981'} />
            {item.tipo} • {item.via_aplicacao || 'S/V'}
          </div>
        </div>
      ),
      align: 'left' as const
    },
    { 
      header: 'Alvo (Animal / Lote)', 
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 700, color: '#334155' }}>{item.targetName}</span>
          <span className="sub-meta" style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '9px', letterSpacing: '0.05em', color: '#94a3b8' }}>
            {item.targetType}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Dosagem & Local',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#334155', fontSize: '12px' }}>
            <FlaskConical size={14} color="#3b82f6" />
            <span>{item.dose || 'N/A'}</span>
          </div>
          {item.local_aplicacao && (
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
              Local: {item.local_aplicacao}
            </span>
          )}
        </div>
      ),
      align: 'left' as const
    },
    { 
      header: 'Segurança (Carência)', 
      accessor: (item: any) => {
        if (item.isBlocked) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '140px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 900, color: '#dc2626', marginBottom: '2px' }}>
                <AlertCircle size={14} />
                <span>BLOQUEADO ({item.diasRestantes}d)</span>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Liberação: {item.dataLiberacao instanceof Date && !isNaN(new Date(item.dataLiberacao).getTime()) 
                  ? new Date(item.dataLiberacao).toLocaleDateString() 
                  : '---'}
              </span>
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 900, color: '#059669', justifyContent: 'center' }}>
            <CheckCircle2 size={14} />
            <span>LIBERADO</span>
          </div>
        );
      },
      align: 'center' as const
    },
    { 
      header: 'Data do Manejo', 
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontWeight: 600, fontSize: '12px' }}>
          <Calendar size={14} />
          <span>{item.data_manejo ? new Date(item.data_manejo).toLocaleDateString() : 'N/I'}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Status & Obs',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <span className={`status-pill ${item.status === 'REALIZADO' ? 'success' : 'pending'}`}>
            {item.status}
          </span>
          {item.observacao && (
            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, maxWidth: '100px' }} className="truncate" title={item.observacao}>
              {item.observacao}
            </span>
          )}
        </div>
      ),
      align: 'center' as const
    }
  ];

  const saveHealthMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (selectedEvent) {
        const { error } = await supabase.from('sanidade').update(payload).eq('id', selectedEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sanidade').insert([{ ...payload, ...insertPayload }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsModalOpen(false);
      toast.success(selectedEvent ? '✅ Registro sanitário atualizado!' : '✅ Registro sanitário cadastrado!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao salvar registro sanitário: ' + err.message);
    }
  });

  const handleSubmit = async (data: any) => {
    if (!canCreate && !selectedEvent) {
      toast.error('⚠️ Selecione uma unidade específica para registrar um novo manejo sanitário.');
      return;
    }

    const payload = {
      tipo: data.tipo,
      titulo: data.titulo,
      animal_id: data.animal_id || null,
      lote_id: data.lote_id || null,
      data_manejo: data.data_manejo,
      produto: data.produto,
      dose: data.dose,
      via_aplicacao: data.via_aplicacao,
      local_aplicacao: data.local_aplicacao,
      carencia_dias: parseInt(data.carencia_dias) || 0,
      observacao: data.observacao,
      status: data.status
    };

    saveHealthMutation.mutate(payload);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = events.map(item => ({
      Data: item.data_manejo ? new Date(item.data_manejo).toLocaleDateString() : 'N/A',
      Titulo: item.titulo,
      Produto: item.produto,
      Dosagem: item.dose,
      Status: item.status,
      Carencia: item.carencia_dias ? `${item.carencia_dias} dias` : 'N/A'
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_saude');
    else if (format === 'excel') exportToExcel(exportData, 'log_saude');
    else if (format === 'pdf') exportToPDF(exportData, 'log_saude', 'Relatório de Manejo Sanitário');
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = (e.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (e.targetName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'MANEJOS' ? e.tipo !== 'PROTOCOLO' : e.tipo === 'PROTOCOLO';
    
    const matchesStatus = filterValues.status === 'all' || e.status === filterValues.status;
    const matchesTipo = filterValues.tipo === 'all' || e.tipo === filterValues.tipo;
    const matchesBlocked = !filterValues.onlyBlocked || e.isBlocked;
    const matchesCarencia = (e.carencia_dias || 0) >= filterValues.minCarencia;

    const matchesDate = (!filterValues.dateStart || new Date(e.data_manejo) >= new Date(filterValues.dateStart)) &&
                       (!filterValues.dateEnd || new Date(e.data_manejo) <= new Date(filterValues.dateEnd));

    return matchesSearch && matchesTab && matchesStatus && matchesTipo && matchesBlocked && matchesCarencia && matchesDate;
  });

  return (
    <div className="health-mgmt-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Pecuária', href: '/pecuaria/dashboard' }, { label: 'Sanidade' }]} />
          <h1 className="page-title">Sanidade</h1>
          <p className="page-subtitle">Rastreabilidade de vacinas, tratamentos e controle de carência medicamentosa em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsProtocolsModalOpen(true)}>
            <ShieldCheck size={18} />
            PROTOCOLOS
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO REGISTRO
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : stats?.map((stat: any, idx: number) => (
          <TauzeStatCard 
            key={idx}
            {...stat}
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'MANEJOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('MANEJOS')}
          >
            Manejos Sanitários
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'PROTOCOLOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('PROTOCOLOS')}
          >
            Protocolos Ativos
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Filtrar por protocolo ou fármaco..." 
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
                const menu = document.getElementById('export-menu-health');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-health" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-health')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-health')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-health')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <HealthFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        <ModernTable 
          emptyState={<EmptyState
            title="Nenhum registro sanitário"
            description="Nenhum manejo ou protocolo foi lançado para esta unidade. Inicie o controle sanitário registrando a primeira vacinação ou tratamento."
            actionLabel="Novo Registro"
            onAction={handleOpenCreate}
            icon={HeartPulse}
          />}
          data={filteredEvents}
            columns={tableColumns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            searchPlaceholder="Filtrar por protocolo ou fármaco..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Detalhes"><History size={18} /></button>
                <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar"><Edit3 size={18} /></button>
                <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir"><Trash2 size={18} /></button>
              </div>
            )}
          />
      </div>

      <HealthForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        actionId={formActionId}
        onSubmit={handleSubmit}
        initialData={selectedEvent}
        loading={(saveHealthMutation.isPending || applyProtocolMutation.isPending)}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê Sanitário"
        subtitle="Rastreabilidade completa do manejo e fármacos aplicados"
        items={historyItems}
        loading={false}
      />

      <HealthProtocolsModal 
        isOpen={isProtocolsModalOpen}
        onClose={() => setIsProtocolsModalOpen(false)}
        onApply={async (data) => {
          const { protocol, targetType, targetId, startDate } = data;
          const start = new Date(startDate);
          const insertions = protocol.steps.map((step: any) => {
            const manejoDate = new Date(start);
            manejoDate.setDate(manejoDate.getDate() + step.day);
            
            return {
              ...insertPayload,
              titulo: `Protocolo: ${protocol.name}`,
              tipo: 'PROTOCOLO',
              data_manejo: manejoDate.toISOString().split('T')[0],
              produto: step.product,
              dose: step.dose,
              status: step.day === 0 ? 'REALIZADO' : 'PENDENTE',
              animal_id: targetType === 'ANIMAL' ? targetId : null,
              lote_id: targetType === 'LOTE' ? targetId : null,
              observacao: `Etapa D${step.day} do protocolo ${protocol.name}`
            };
          });

          applyProtocolMutation.mutate(insertions);
        }}
      />
      <style>{`
        .export-dropdown-container {
          position: relative;
        }

        .export-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          z-index: 100;
          display: none;
          flex-direction: column;
          padding: 8px;
          min-width: 160px;
          margin-top: 8px;
        }

        .export-menu.active {
          display: flex;
        }

        .export-menu button {
          padding: 10px 16px;
          text-align: left;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .export-menu button:hover {
          background: hsl(var(--bg-main));
          color: #0f172a;
        }
      `}</style>
    </div>
  );
};
