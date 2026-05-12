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
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { HealthForm } from '../../components/Forms/HealthForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';
import { HealthProtocolsModal } from './components/HealthProtocolsModal';
import { HealthFilterModal } from './components/HealthFilterModal';
import './HealthManagement.css';

export const HealthManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'MANEJOS' | 'PROTOCOLOS'>('MANEJOS');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    tipo: 'all',
    onlyBlocked: false,
    minCarencia: 0,
    dateStart: '',
    dateEnd: ''
  });
  const [isProtocolsModalOpen, setIsProtocolsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!activeFarmId && !isGlobalMode) return;
    fetchEvents();
  }, [activeFarmId, isGlobalMode]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sanidade')
        .select(`
          *,
          animais:animal_id (brinco),
          lotes:lote_id (nome)
        `)
        .order('data_manejo', { ascending: false });
      
      query = applyFarmFilter(query);
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching health events:', error);
        setLoading(false);
        return;
      }

      const enrichedData = data.map(item => {
        const dataManejo = item.data_manejo ? new Date(item.data_manejo) : new Date();
        const dataLiberacao = new Date(dataManejo);
        dataLiberacao.setDate(dataLiberacao.getDate() + (item.carencia_dias || 0));
        
        const now = new Date();
        const diffTime = dataLiberacao.getTime() - now.getTime();
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isBlocked = diasRestantes > 0 && item.status === 'REALIZADO';

        const animal = Array.isArray(item.animais) ? item.animais[0] : item.animais;
        const lote = Array.isArray(item.lotes) ? item.lotes[0] : item.lotes;

        return { 
          ...item, 
          dataLiberacao, 
          diasRestantes, 
          isBlocked,
          targetName: animal?.brinco ? `#${animal.brinco}` : (lote?.nome || 'Manejo Geral'),
          targetType: animal?.brinco ? 'Individual' : 'Lote'
        };
      });

      setEvents(enrichedData);
      
      const totalManejos = enrichedData.length;
      const emCarencia = enrichedData.filter(e => e.isBlocked).length;
      const pendentes = enrichedData.filter(e => e.status === 'PENDENTE').length;
      
      setStats([
        { 
          label: 'Conformidade Sanitária', 
          value: '94.5%', 
          icon: ShieldCheck, 
          color: '#10b981', 
          progress: 94.5,
          change: '+0.8%',
          trend: 'up',
          periodLabel: 'Nível de Governança',
          sparkline: [
            { value: 90, label: '90%' }, { value: 92, label: '92%' }, { value: 91, label: '91%' }, 
            { value: 93, label: '93%' }, { value: 94, label: '94%' }, { value: 94.5, label: '94.5%' }
          ]
        },
        { 
          label: 'Alertas de Carência', 
          value: emCarencia.toString(), 
          icon: AlertCircle, 
          color: emCarencia > 0 ? '#ef4444' : '#10b981', 
          progress: Math.min((emCarencia / (totalManejos || 1)) * 100, 100), 
          trend: emCarencia > 0 ? 'up' : 'down',
          change: emCarencia > 0 ? 'Trava Ativa' : 'Seguro',
          periodLabel: 'Bloqueio de Venda',
          sparkline: [
            { value: 5, label: '5' }, { value: 8, label: '8' }, { value: 4, label: '4' }, 
            { value: 2, label: '2' }, { value: 1, label: '1' }, { value: emCarencia, label: emCarencia.toString() }
          ]
        },
        { 
          label: 'Agenda de Manejos', 
          value: pendentes.toString(), 
          icon: Calendar, 
          color: '#3b82f6', 
          progress: Math.min((pendentes / (totalManejos || 1)) * 100, 100),
          change: 'Próximos 7d', 
          trend: 'up', 
          periodLabel: 'Execução Pendente',
          sparkline: [
            { value: 10, label: '10' }, { value: 15, label: '15' }, { value: 8, label: '8' }, 
            { value: 12, label: '12' }, { value: 5, label: '5' }, { value: pendentes, label: pendentes.toString() }
          ]
        },
        { 
          label: 'Eficácia Sanit.', 
          value: '94.5%', 
          icon: FlaskConical, 
          color: '#8b5cf6', 
          progress: 94.5,
          change: '+1.2%', 
          trend: 'up', 
          periodLabel: 'Controle de Patógenos',
          sparkline: [
            { value: 90, label: '90%' }, { value: 92, label: '92%' }, { value: 91, label: '91%' }, 
            { value: 93, label: '93%' }, { value: 94, label: '94%' }, { value: 94.5, label: '94.5%' }
          ]
        }
      ]);
    } catch (err) {
      console.error(err);
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
      header: 'Alvo (Animal / Lote)', 
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.targetName}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider text-slate-400">
            {item.targetType}
          </div>
        </div>
      )
    },
    { 
      header: 'Segurança (Carência)', 
      accessor: (item: any) => {
        if (item.isBlocked) {
          return (
            <div className="flex flex-col gap-1 min-w-[140px]">
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-red-600">
                <AlertCircle size={14} />
                <span>BLOQUEADO ({item.diasRestantes}d)</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">
                Liberação: {item.dataLiberacao instanceof Date && !isNaN(item.dataLiberacao.getTime()) 
                  ? item.dataLiberacao.toLocaleDateString() 
                  : '---'}
              </span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600">
            <CheckCircle2 size={14} />
            <span>LIBERADO</span>
          </div>
        );
      },
      align: 'center' as const
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

  const handleSubmit = async (data: any) => {
    if (!activeFarm) return;
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

    if (selectedEvent) {
      const { error } = await supabase.from('sanidade').update(payload).eq('id', selectedEvent.id);
      if (!error) { setIsModalOpen(false); fetchEvents(); }
    } else {
      const { error } = await supabase.from('sanidade').insert([{ ...payload, ...insertPayload }]);
      if (!error) { setIsModalOpen(false); fetchEvents(); }
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = events.filter(e => {
      const matchesSearch = (e.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (e.produto || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'MANEJOS' ? e.tipo === 'MANEJO' : e.tipo === 'PROTOCOLO';
      const matchesStatus = filterValues.status === 'all' || e.status === filterValues.status;
      const matchesDate = (!filterValues.dateStart || new Date(e.data_planejada) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(e.data_planejada) <= new Date(filterValues.dateEnd));
      
      return matchesSearch && matchesTab && matchesStatus && matchesDate;
    });

    const exportData = filteredData.map(item => ({
      Data: new Date(item.data_planejada).toLocaleDateString(),
      Titulo: item.titulo,
      Produto: item.produto,
      Dosagem: item.dosagem,
      Status: item.status,
      Carencia: item.carencia_dias ? `${item.carencia_dias} dias` : 'N/A'
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_saude');
    else if (format === 'excel') exportToExcel(exportData, 'log_saude');
    else if (format === 'pdf') exportToPDF(exportData, 'log_saude', 'Relatório de Manejo Sanitário');
  };

  return (
    <div className="health-mgmt-page animate-slide-up">
      <GlobalModeBanner />
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge" style={{ background: 'hsl(var(--bg-sidebar))', color: 'hsl(var(--brand))', border: '1px solid hsl(var(--brand) / 0.3)' }}>
            <ShieldCheck size={14} fill="currentColor" />
            <span>ELITE LIVESTOCK v5.0</span>
          </div>
          <h1 className="page-title">Gestão Sanitária</h1>
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
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            {...stat}
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
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-health')?.classList.remove('active'); }}>CSV</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-health')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-health')?.classList.remove('active'); }}>PDF Profissional</button>
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
        {events.length === 0 && !loading ? (
          <EmptyState
            title="Nenhum registro sanitário"
            description="Nenhum manejo ou protocolo foi lançado para esta unidade. Inicie o controle sanitário registrando a primeira vacinação ou tratamento."
            actionLabel="Novo Registro"
            onAction={handleOpenCreate}
            icon={HeartPulse}
          />
        ) : (
          <ModernTable 
            data={events.filter(e => {
              const matchesSearch = (e.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) || (e.targetName || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'MANEJOS' ? e.tipo !== 'PROTOCOLO' : e.tipo === 'PROTOCOLO';
              
              const matchesStatus = filterValues.status === 'all' || e.status === filterValues.status;
              const matchesTipo = filterValues.tipo === 'all' || e.tipo === filterValues.tipo;
              const matchesBlocked = !filterValues.onlyBlocked || e.isBlocked;
              const matchesCarencia = (e.carencia_dias || 0) >= filterValues.minCarencia;

              const matchesDate = (!filterValues.dateStart || new Date(e.data_manejo) >= new Date(filterValues.dateStart)) &&
                                 (!filterValues.dateEnd || new Date(e.data_manejo) <= new Date(filterValues.dateEnd));

              return matchesSearch && matchesTab && matchesStatus && matchesTipo && matchesBlocked && matchesCarencia && matchesDate;
            })}
            columns={tableColumns}
            loading={loading}
            hideHeader={true}
            searchPlaceholder="Filtrar por protocolo ou fármaco..."
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Detalhes"><History size={18} /></button>
                <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar"><Edit3 size={18} /></button>
                <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir"><Trash2 size={18} /></button>
              </div>
            )}
          />
        )}
      </div>

      <HealthForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
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

      <HealthProtocolsModal 
        isOpen={isProtocolsModalOpen}
        onClose={() => setIsProtocolsModalOpen(false)}
        onApply={async (data) => {
          const { protocol, targetType, targetId, startDate } = data;
          
          try {
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

            const { error } = await supabase
              .from('sanidade')
              .insert(insertions);

            if (error) throw error;

            alert(`Protocolo ${protocol.name} aplicado com sucesso! ${insertions.length} manejos agendados.`);
            fetchEvents();
          } catch (err) {
            console.error('Error applying protocol:', err);
            alert('Erro ao aplicar protocolo');
          }
          setIsProtocolsModalOpen(false);
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
          background: white;
          border: 1px solid #e2e8f0;
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
          background: #f1f5f9;
          color: #0f172a;
        }
      `}</style>
    </div>
  );
};
