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
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { ReproductionForm } from '../../components/Forms/ReproductionForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { BatchReproModal } from './components/BatchReproModal';

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
  const [stats, setStats] = useState<any[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  useEffect(() => {
    if (!activeFarm) return;
    fetchEvents();
  }, [activeFarm]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('eventos_reprodutivos')
      .select('*, animais(brinco)')
      .eq('fazenda_id', activeFarm.id)
      .order('data_evento', { ascending: false });
    
    if (data) {
      setEvents(data);
      const prenhas = data.filter(e => e.resultado === 'Prenha').length;
      const iatfs = data.filter(e => e.tipo_evento === 'IATF').length;
      
      setStats([
        { label: 'Taxa de Prenhez', value: `${((prenhas / (data.length || 1)) * 100).toFixed(1)}%`, icon: Activity, color: '#10b981', progress: (prenhas / (data.length || 1)) * 100 },
        { label: 'IATF em Ciclo', value: iatfs, icon: Heart, color: '#3b82f6', progress: 100 },
        { label: 'Previsão de Partos', value: '12', icon: Calendar, color: '#f59e0b', progress: 40 },
        { label: 'Eficiência Reprodutiva', value: '84%', icon: TrendingUp, color: '#166534', progress: 84 },
      ]);
    }
    setLoading(false);
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

  const handleViewDetails = (event: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: event.data_evento, title: 'Tipo de Evento: ' + event.tipo_evento, subtitle: 'Identificação: ' + (event.animais?.brinco || event.animal_id), value: event.resultado || 'Pendente', status: event.status === 'completed' ? 'success' : 'pending' },
      { id: '2', date: event.data_evento, title: 'Observações', subtitle: event.observacoes || 'Nenhuma observação registrada', value: 'Info', status: 'info' },
      { id: '3', date: event.data_evento, title: 'Próximo Passo', subtitle: event.tipo_evento === 'IATF' ? 'Palpação em 60 dias' : event.tipo_evento === 'Palpação' && event.resultado === 'Prenha' ? 'Previsão de Parto' : 'Novo Ciclo', value: 'Agendado', status: 'warning' },
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
      header: 'Resultado',
      accessor: (item: any) => (
        <span className={`status-pill ${item.resultado === 'Prenha' ? 'active' : 'warning'}`}>
          {item.resultado || 'Pendente'}
        </span>
      ),
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
          <button className="icon-btn-secondary" title="Filtros Avançados">
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Log">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        <ModernTable 
          data={events.filter(e => {
            const matchesSearch = (e.animais?.brinco || '').toLowerCase().includes(searchTerm.toLowerCase()) || (e.tipo_evento || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'ESTACAO' ? e.tipo_evento !== 'Parto' : e.tipo_evento === 'Parto';
            return matchesSearch && matchesTab;
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
