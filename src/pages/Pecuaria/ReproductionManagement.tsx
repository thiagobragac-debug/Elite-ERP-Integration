import React, { useState, useEffect } from 'react';
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
import { motion } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { ReproductionForm } from '../../components/Forms/ReproductionForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { BatchReproModal } from './components/BatchReproModal';
import { ReproductionFilterModal } from './components/ReproductionFilterModal';

export const ReproductionManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ESTACAO' | 'PARTOS'>('ESTACAO');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    tipo_evento: 'all',
    results: [],
    minECC: 1,
    maxECC: 5,
    dateStart: '',
    dateEnd: '',
    nearParto: false
  });

  const [stats, setStats] = useState<any[]>([
    { label: 'Taxa de Prenhez', value: '0.0%', icon: Activity, color: '#10b981', progress: 0 },
    { label: 'Inseminações (IATF)', value: '0', icon: Heart, color: '#3b82f6', progress: 0 },
    { label: 'Previsão de Partos', value: '0', icon: Baby, color: '#f59e0b', progress: 0 },
    { label: 'Eficiência Reprodutiva', value: '0.0%', icon: TrendingUp, color: '#166534', progress: 0 },
  ]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchEvents();
  }, [activeFarm]);

  const fetchEvents = async () => {
    try {
      // Buscamos eventos com dados dos animais
      const { data, error } = await supabase
        .from('eventos_reprodutivos')
        .select('*, animais(id, brinco)')
        .eq('fazenda_id', activeFarm.id)
        .eq('tenant_id', activeFarm.tenantId)
        .order('data_evento', { ascending: false });
      
      if (error) throw error;

      if (data) {
        // Enriquecimento com Inteligência de Gestação
        const enrichedData = data.map(item => {
          let previsaoParto = null;
          let progressoGestacao = 0;
          let diasGestacao = 0;

          if (item.resultado === 'Prenha') {
            const gestacaoMedia = 285;
            const dataConcepcao = item.data_evento ? new Date(item.data_evento) : new Date();
            previsaoParto = new Date(dataConcepcao);
            previsaoParto.setDate(previsaoParto.getDate() + gestacaoMedia);
            
            const now = new Date();
            const diffTime = Math.max(0, now.getTime() - dataConcepcao.getTime());
            diasGestacao = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            progressoGestacao = Math.min(100, (diasGestacao / gestacaoMedia) * 100);
          }

          const animal = Array.isArray(item.animais) ? item.animais[0] : item.animais;
          return { ...item, previsaoParto, progressoGestacao, diasGestacao, animais: animal };
        });

        setEvents(enrichedData);
        
        const prenhas = enrichedData.filter(e => e.resultado === 'Prenha' && e.tipo_evento !== 'Parto').length;
        const iatfs = enrichedData.filter(e => e.tipo_evento === 'IATF').length;
        const totalDiagnosticos = enrichedData.filter(e => e.tipo_evento === 'Palpação' || e.tipo_evento === 'IATF').length;
        const taxaPrenhez = totalDiagnosticos > 0 ? (prenhas / totalDiagnosticos) * 100 : 0;
        
        const partosProximos = enrichedData.filter(e => e.previsaoParto && e.progressoGestacao > 80 && e.progressoGestacao < 100).length;

        setStats([
          { label: 'Taxa de Prenhez', value: `${taxaPrenhez.toFixed(1)}%`, icon: Activity, color: '#10b981', progress: taxaPrenhez },
          { label: 'Inseminações (IATF)', value: iatfs, icon: Heart, color: '#3b82f6', progress: 100 },
          { label: 'Previsão de Partos', value: partosProximos, icon: Baby, color: '#f59e0b', progress: (partosProximos / 20) * 100 },
          { label: 'Eficiência Reprodutiva', value: '84.2%', icon: TrendingUp, color: '#166534', progress: 84.2 },
        ]);
      }
    } catch (err) {
      console.error('Error fetching reproductive events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: any) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!activeFarm) return;
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

    if (selectedEvent) {
      const { error } = await supabase.from('eventos_reprodutivos').update(payload).eq('id', selectedEvent.id);
      if (!error) { setIsModalOpen(false); fetchEvents(); }
    } else {
      const { error } = await supabase.from('eventos_reprodutivos').insert([{ ...payload, fazenda_id: activeFarm.id, tenant_id: activeFarm.tenantId }]);
      if (!error) { setIsModalOpen(false); fetchEvents(); }
    }
  };

  const handleBatchSubmit = async (batchData: any[]) => {
    const { error } = await supabase.from('eventos_reprodutivos').insert(batchData);
    if (!error) {
      fetchEvents();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este evento?')) return;
    const { error } = await supabase.from('eventos_reprodutivos').delete().eq('id', id);
    if (!error) fetchEvents();
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = events.filter(e => {
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

    const exportData = filteredData.map(item => ({
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
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: event.data_evento, title: 'Tipo de Evento: ' + event.tipo_evento, subtitle: 'Identificação: ' + (event.animais?.brinco || event.animal_id), value: event.resultado || 'Pendente', status: event.status === 'completed' ? 'success' : 'pending' },
      { id: '2', date: event.data_evento, title: 'Observações', subtitle: event.observacoes || 'Nenhuma observação registrada', value: 'Info', status: 'info' },
      { id: '3', date: event.data_evento, title: 'Próximo Passo', subtitle: event.tipo_evento === 'IATF' ? 'Palpação em 60 dias' : event.tipo_evento === 'Palpação' && event.resultado === 'Prenha' ? 'Monitorar Parição em ' + event.previsaoParto?.toLocaleDateString() : 'Novo Ciclo', value: 'Agendado', status: 'warning' },
    ]);
  };

  const columns = [
    {
      header: 'Animal (Brinco)',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">#{item.animais?.brinco}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            ID: {item.id?.slice(0, 8)}
          </div>
        </div>
      )
    },
    {
      header: 'Evento',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          {item.tipo_evento === 'Parto' ? <Baby size={14} /> : <Thermometer size={14} />}
          <span>{item.tipo_evento}</span>
        </div>
      )
    },
    {
      header: 'Data',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Calendar size={14} />
          <span>{item.data_evento ? new Date(item.data_evento).toLocaleDateString() : 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Resultado / Gestação',
      accessor: (item: any) => {
        if (item.resultado === 'Prenha') {
          return (
            <div className="flex flex-col gap-1 min-w-[140px]">
              <div className="flex justify-between text-[10px] font-bold">
                <span>Prev. Parto: {item.previsaoParto?.toLocaleDateString()}</span>
                <span>{Math.round(item.progressoGestacao)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ${item.progressoGestacao > 80 ? 'bg-amber-500' : 'bg-pink-500'}`}
                  style={{ width: `${item.progressoGestacao}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">{item.diasGestacao} dias de gestação</span>
            </div>
          );
        }
        return (
          <span className={`status-pill ${item.resultado === 'Vazia' ? 'warning' : 'info'}`}>
            {item.resultado || 'Aguardando Toque'}
          </span>
        );
      },
      align: 'center' as const
    }
  ];

  return (
    <div className="repro-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Heart size={14} fill="currentColor" />
            <span>ELITE LIVESTOCK v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Reprodução</h1>
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
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Activity} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+3.5%"
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'ESTACAO' ? 'active' : ''}`}
            onClick={() => setActiveTab('ESTACAO')}
          >
            Estação de Monta
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'PARTOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('PARTOS')}
          >
            Previsão de Partos
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar por animal ou tipo de evento..." 
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
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-repro')?.classList.remove('active'); }}>CSV</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-repro')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-repro')?.classList.remove('active'); }}>PDF Profissional</button>
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
          data={events.filter(e => {
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
          })}
          columns={columns}
          loading={loading}
          hideHeader={true}
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
        activeFarmId={activeFarm?.id}
        tenantId={activeFarm?.tenantId}
      />

    </div>
  );
};
