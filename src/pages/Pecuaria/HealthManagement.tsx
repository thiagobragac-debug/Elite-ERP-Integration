import React, { useState, useEffect } from 'react';
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
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { HealthForm } from '../../components/Forms/HealthForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import './HealthManagement.css';

export const HealthManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'MANEJOS' | 'PROTOCOLOS'>('MANEJOS');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!activeFarm) return;
    fetchEvents();
  }, [activeFarm]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sanidade')
      .select('*, animais(brinco)')
      .eq('fazenda_id', activeFarm.id)
      .order('data_manejo', { ascending: false });
    
    if (data) {
      setEvents(data);
      const totalManejos = data.length;
      const emCarencia = data.filter(e => e.carencia_dias > 0 && new Date(e.data_manejo).getTime() + (e.carencia_dias * 24 * 60 * 60 * 1000) > Date.now()).length;
      
      setStats([
        { label: 'Eficácia de Protocolos', value: '92%', icon: ShieldCheck, color: '#10b981', progress: 92 },
        { label: 'Alertas de Carência', value: emCarencia, icon: AlertCircle, color: '#ef4444', progress: (emCarencia / (totalManejos || 1)) * 100, trend: 'down' },
        { label: 'Histórico de Manejos', value: totalManejos, icon: HeartPulse, color: 'hsl(32 95% 44%)', progress: 100 },
        { label: 'Próximas Vacinações', value: '3', icon: Calendar, color: 'hsl(230 60% 50%)', progress: 30 },
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

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este registro sanitário?')) return;
    const { error } = await supabase.from('sanidade').delete().eq('id', id);
    if (!error) fetchEvents();
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
      header: 'Protocolo / Título', 
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.titulo}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.tipo}
          </div>
        </div>
      )
    },
    { 
      header: 'Fármaco', 
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <FlaskConical size={14} />
          <span>{item.produto || 'N/A'}</span>
        </div>
      )
    },
    { 
      header: 'Data Manejo', 
      accessor: (item: any) => (
        <div className="table-cell-meta text-slate-500">
          <Calendar size={14} />
          <span>{item.data_manejo ? new Date(item.data_manejo).toLocaleDateString() : 'N/A'}</span>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'REALIZADO' ? 'success' : 'pending'}`}>
          {item.status}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="health-mgmt-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <ShieldCheck size={14} fill="currentColor" />
            <span>ELITE LIVESTOCK v5.0</span>
          </div>
          <h1 className="page-title">Gestão Sanitária</h1>
          <p className="page-subtitle">Rastreabilidade de vacinas, tratamentos e controle de carência medicamentosa em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => {}}>
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
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={HeartPulse} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+0.5%"
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'MANEJOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('MANEJOS')}
          >
            Manejos Sanitários
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'PROTOCOLOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('PROTOCOLOS')}
          >
            Protocolos Ativos
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Filtrar por protocolo ou fármaco..." 
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
            const matchesSearch = (e.titulo || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'MANEJOS' ? e.tipo !== 'PROTOCOLO' : e.tipo === 'PROTOCOLO';
            return matchesSearch && matchesTab;
          })}
          columns={tableColumns}
          loading={loading}
          hideHeader={true}
          searchPlaceholder="Filtrar por protocolo ou fármaco..."
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Detalhes">
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

      <HealthForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={async () => {
          setIsModalOpen(false);
          fetchEvents();
        }}
        initialData={selectedEvent}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê Sanitário"
        subtitle="Rastreabilidade completa do manejo e fármacos aplicados"
        items={historyItems}
        loading={false}
      />
    </div>
  );
};
