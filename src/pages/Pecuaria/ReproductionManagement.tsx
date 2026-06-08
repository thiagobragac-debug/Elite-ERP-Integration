import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { useSearchParams } from 'react-router-dom';
import { 
  Heart, 
  Plus, 
  Search, 
  Filter,
  Calendar, 
  Activity, 
  ChevronRight, 
  MoreVertical,
  Baby,
  Thermometer,
  ClipboardCheck,
  Percent,
  Trash2,
  Edit3,
  History,
  TrendingUp,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useReportData } from '../../hooks/useReportData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReproductionForm } from '../../components/Forms/ReproductionForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { BatchReproModal } from './components/BatchReproModal';
import { ReproductionFilterModal } from './components/ReproductionFilterModal';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

export const ReproductionManagement: React.FC = () => {
  const { activeFarm, activeTenantId, activeFarmId, isGlobalMode, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'ESTACAO' | 'PARTOS') || 'ESTACAO';
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });
  };
  
  const [isModalOpen, setIsModalOpen] = usePersistentState('ReproductionManagement_isModalOpen', false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    tipo_evento: 'all',
    results: [] as string[],
    minECC: 1,
    maxECC: 5,
    dateStart: '',
    dateEnd: '',
    nearParto: false
  });

  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { 
    data: rawEvents, 
    stats, 
    loading, 
    error, 
    totalCount,
    refresh 
  } = useReportData('reproducao', { page, pageSize });

  const events = rawEvents || [];

  const handleOpenCreate = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: any) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const saveReproMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (selectedEvent) {
        const { error } = await supabase.from('eventos_reprodutivos').update(payload).eq('id', selectedEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('eventos_reprodutivos').insert([{ ...payload, ...insertPayload }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsModalOpen(false);
      toast.success(selectedEvent ? '✅ Evento reprodutivo atualizado!' : '✅ Evento reprodutivo cadastrado!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao salvar evento reprodutivo: ' + err.message);
    }
  });

  const handleSubmit = async (data: any) => {
    if (!canCreate && !selectedEvent) {
      toast.error('⚠️ Selecione uma unidade específica para registrar um novo evento reprodutivo.');
      return;
    }

    const payload = {
      animal_id: data.animal_id,
      tipo_evento: data.tipo_evento,
      data_evento: data.data_evento,
      resultado: data.resultado,
      touro: data.touro,
      ecc: data.ecc ? parseFloat(data.ecc) : null,
      observacoes: data.observacoes,
      status: data.status
    };

    saveReproMutation.mutate(payload);
  };

  const batchSaveReproMutation = useMutation({
    mutationFn: async (batchData: any[]) => {
      const { error } = await supabase.from('eventos_reprodutivos').insert(batchData.map(d => ({ ...d, ...insertPayload })));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      setIsBatchModalOpen(false);
      toast.success('✅ Lançamento em lote salvo!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao salvar lote reprodutivo: ' + err.message);
    }
  });

  const handleBatchSubmit = async (batchData: any[]) => {
    batchSaveReproMutation.mutate(batchData);
  };

  const deleteReproMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('eventos_reprodutivos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('✅ Evento reprodutivo excluído!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao excluir evento: ' + err.message);
    }
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este evento?')) return;
    deleteReproMutation.mutate(id);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = events.map(item => ({
      Animal: item.animais?.brinco || 'N/A',
      Evento: item.tipo_evento,
      Data: item.data_evento ? new Date(item.data_evento).toLocaleDateString() : 'N/A',
      Resultado: item.resultado || 'Aguardando',
      ECC: item.ecc || '-',
      Touro: item.touro || '-',
      Prev_Parto: item.previsaoParto ? new Date(item.previsaoParto).toLocaleDateString() : '-',
      Gestacao_Dias: item.diasGestacao || 0,
      Observacoes: item.observacoes || ''
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_reproducao');
    else if (format === 'excel') exportToExcel(exportData, 'log_reproducao');
    else if (format === 'pdf') exportToPDF(exportData, 'log_reproducao', 'Relatório de Reprodução');
  };

  const handleViewDetails = (event: any) => {
    const nextStep = event.tipo_evento === 'IATF' 
      ? 'Palpação em 60 dias' 
      : (event.tipo_evento === 'Palpação' && event.resultado === 'Prenha') 
        ? `Monitorar Parição em ${event.previsaoParto instanceof Date ? event.previsaoParto.toLocaleDateString() : '---'}` 
        : 'Novo Ciclo';

    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: event.data_evento, title: 'Tipo de Evento: ' + event.tipo_evento, subtitle: 'Identificação: ' + (event.animais?.brinco || event.animal_id), value: event.resultado || 'Pendente', status: event.status === 'completed' ? 'success' : 'pending' },
      { id: '2', date: event.data_evento, title: 'Observações', subtitle: event.observacoes || 'Nenhuma observação registrada', value: 'Info', status: 'info' },
      { id: '3', date: event.data_evento, title: 'Próximo Passo', subtitle: nextStep, value: 'Agendado', status: 'warning' },
    ]);
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = (e.animais?.brinco || '').toLowerCase().includes(searchTerm.toLowerCase()) || (e.tipo_evento || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'ESTACAO' ? e.tipo_evento !== 'Parto' : e.tipo_evento === 'Parto';
    
    const matchesTipo = filterValues.tipo_evento === 'all' || e.tipo_evento === filterValues.tipo_evento;
    const matchesResults = filterValues.results.length === 0 || filterValues.results.includes(e.resultado);
    
    const ecc = Number(e.ecc || 0);
    const matchesECC = !e.ecc || (ecc >= filterValues.minECC && ecc <= filterValues.maxECC);
    
    const matchesNearParto = !filterValues.nearParto || (e.progressoGestacao > 80 && e.progressoGestacao < 100);

    const matchesDate = (!filterValues.dateStart || new Date(e.data_evento) >= new Date(filterValues.dateStart)) &&
                       (!filterValues.dateEnd || new Date(e.data_evento) <= new Date(filterValues.dateEnd));

    return matchesSearch && matchesTab && matchesTipo && matchesResults && matchesECC && matchesNearParto && matchesDate;
  });

  const columns = [
    {
      header: 'Matriz / Brinco',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            #{item.animais?.brinco || 'N/A'}
          </span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.animal_id?.slice(0,8).toUpperCase() || item.id?.slice(0,8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Evento / Protocolo',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {item.tipo_evento === 'Parto' ? <Baby size={14} color="#ec4899" /> : <Thermometer size={14} color="#3b82f6" />}
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>{item.tipo_evento}</span>
          </div>
          {item.touro && (
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Touro: {item.touro}
            </span>
          )}
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'E.C.C',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ 
            padding: '2px 8px', 
            borderRadius: '6px', 
            fontSize: '11px', 
            fontWeight: 800,
            background: item.ecc >= 3 && item.ecc <= 4 ? '#ecfdf5' : item.ecc && item.ecc < 2.5 ? '#fef2f2' : '#f8fafc',
            color: item.ecc >= 3 && item.ecc <= 4 ? '#10b981' : item.ecc && item.ecc < 2.5 ? '#ef4444' : '#64748b',
            border: `1px solid ${item.ecc >= 3 && item.ecc <= 4 ? '#a7f3d0' : item.ecc && item.ecc < 2.5 ? '#fecaca' : '#e2e8f0'}`
          }}>
            {item.ecc ? Number(item.ecc).toFixed(1) : '-'}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Data do Evento',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontWeight: 600, fontSize: '12px' }}>
          <Calendar size={14} />
          <span>{item.data_evento ? new Date(item.data_evento).toLocaleDateString() : 'N/A'}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Resultado / Gestação',
      accessor: (item: any) => {
        if (item.resultado === 'Prenha') {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, color: '#475569' }}>
                <span>{item.previsaoParto instanceof Date ? item.previsaoParto.toLocaleDateString() : 'Prev. Parto'}</span>
                <span>{Math.round(item.progressoGestacao || 0)}%</span>
              </div>
              <div style={{ height: '6px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    transition: 'width 0.7s', 
                    backgroundColor: (item.progressoGestacao || 0) > 80 ? '#f59e0b' : '#ec4899',
                    width: `${item.progressoGestacao || 0}%` 
                  }}
                />
              </div>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{(item.diasGestacao || 0)} dias</span>
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className={`status-pill ${item.resultado === 'Vazia' ? 'warning' : 'info'}`}>
              {item.resultado || 'Aguardando'}
            </span>
          </div>
        );
      },
      align: 'center' as const
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: item.status === 'completed' ? '#10b981' : '#f59e0b'
          }}>
            {item.status === 'completed' ? 'Concluído' : 'Pendente'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="repro-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Pecuária', href: '/pecuaria/dashboard' }, { label: 'Reprodução' }]} />
          <h1 className="page-title">Reprodução</h1>
          <p className="page-subtitle">Controle de biotecnologias, diagnóstico de gestação e monitoramento de parição em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => setIsBatchModalOpen(true)}>
            <ClipboardCheck size={18} />
            LANÇAMENTO LOTE
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO EVENTO
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
            className={`tauze-tab-item ${activeTab === 'ESTACAO' ? 'active' : ''}`}
            onClick={() => setActiveTab('ESTACAO')}
          >
            Estação de Monta
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'PARTOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('PARTOS')}
          >
            Previsão de Partos
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Buscar por animal ou tipo de evento..." 
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
                const menu = document.getElementById('export-menu-repro');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-repro" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-repro')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-repro')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-repro')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <ReproductionFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        <ModernTable 
          emptyState={<EmptyState
            title="Nenhum evento reprodutivo"
            description="Não há registros reprodutivos para esta unidade. Inicie o controle registrando a primeira inseminação ou diagnóstico."
            actionLabel="Novo Evento"
            onAction={handleOpenCreate}
            icon={Heart}
          />}
          data={filteredEvents}
            columns={columns}
            loading={loading}
            hideHeader={true}
            totalCount={totalCount}
            currentPage={page}
            onPageChange={setPage}
            itemsPerPage={pageSize}
            searchPlaceholder="Pesquisar por animal ou tipo de evento..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Dossiê">
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

      <ReproductionForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedEvent}
        loading={(saveReproMutation.isPending || batchSaveReproMutation.isPending)}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê Reprodutivo"
        subtitle="Rastreabilidade do ciclo e próximos passos da matriz"
        items={historyItems}
        loading={historyLoading}
      />

      <BatchReproModal 
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onBatchSubmit={handleBatchSubmit}
        activeFarmId={activeFarmId || ''}
        tenantId={activeTenantId || ''}
      />

    </div>
  );
};
