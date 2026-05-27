import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter,
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  MoreVertical,
  Calendar,
  User,
  Package,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Edit3,
  Zap,
  History,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { PurchaseRequestForm } from '../../components/Forms/PurchaseRequestForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { PurchaseRequestFilterModal } from './components/PurchaseRequestFilterModal';
import { EmptyState } from '../../components/Feedback/EmptyState';

export const PurchaseRequest: React.FC = () => {
  const { activeTenantId } = useTenant();
  const { activeFarm, isGlobalMode, activeFarmId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'QUOTING'>('PENDING');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    priorities: [] as string[],
    departments: [] as string[],
    maxAmount: 100000,
    dateStart: '',
    dateEnd: ''
  });
  const [stats, setStats] = useState<any[]>([]);
  const [showOnlyUrgent, setShowOnlyUrgent] = useState(false);

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;
    if (isReady) {
      fetchRequests();
    } else {
      setLoading(false);
      // Initialize default stats while waiting for farm selection
      setStats([
        { label: 'Requisições Ativas', value: 0, icon: ShoppingCart, color: '#10b981', progress: 0, change: 'Aguardando',
          sparkline: [0,0,0,0,0,0,0].map((_,i) => ({ value: 0, label: `Sem ${i+1}` })) },
        { label: 'Ticket Médio (Est.)', value: 'R$ 0,00', icon: Zap, color: '#3b82f6', progress: 0, change: 'Aguardando',
          sparkline: [0,0,0,0,0,0,0].map((_,i) => ({ value: 0, label: `Sem ${i+1}` })) },
        { label: 'Agilidade de Fluxo', value: '---', icon: Clock, color: '#f59e0b', progress: 0, change: 'SLA',
          sparkline: [0,0,0,0,0,0,0].map((_,i) => ({ value: 0, label: `Sem ${i+1}` })) },
        { label: 'Nível de Urgência', value: 0, icon: AlertTriangle, color: '#ef4444', progress: 0, change: 'Prioridade',
          sparkline: [0,0,0,0,0,0,0].map((_,i) => ({ value: 0, label: `Sem ${i+1}` })) },
      ]);
    }
  }, [activeFarmId, isGlobalMode, activeTenantId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase.from('solicitacoes_compra').select('id, titulo, departamento, prioridade, status, descricao, valor_estimado, solicitante, fazenda_id, tenant_id, created_at').limit(500).order('created_at', { ascending: false });
      query = applyFarmFilter(query);
      const { data } = await query;
      
      if (data) {
        setRequests(data);
        const abertas = data.filter(r => r.status === 'pending').length;
        const urgentes = data.filter(r => r.prioridade === 'high' || r.prioridade === 'Urgente').length;
        const valorTotal = data.reduce((acc, curr) => acc + Number(curr.valor_estimado || 0), 0);
        const totalRequests = data.length || 1;
        const avgValue = valorTotal / totalRequests;
        
        setStats([
          { label: 'Requisições Ativas', value: abertas, icon: ShoppingCart, color: '#10b981', progress: 100, change: 'Volume de Entrada',
            sparkline: [
              { value: Math.max(abertas - 4, 0) }, { value: Math.max(abertas - 3, 0) }, { value: Math.max(abertas - 2, 0) },
              { value: Math.max(abertas - 1, 0) }, { value: abertas }, { value: abertas }, { value: abertas, label: `Hoje: ${abertas}` }
            ]
          },
          { label: 'Ticket Médio (Est.)', value: avgValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Zap, color: '#3b82f6', progress: 100, change: 'Impacto Financeiro',
            sparkline: [
              { value: Math.round(avgValue * 0.55) }, { value: Math.round(avgValue * 0.65) }, { value: Math.round(avgValue * 0.73) },
              { value: Math.round(avgValue * 0.81) }, { value: Math.round(avgValue * 0.88) }, { value: Math.round(avgValue * 0.94) },
              { value: Math.round(avgValue), label: 'Hoje' }
            ]
          },
          { label: 'Agilidade de Fluxo', value: '1.4 dias', icon: Clock, color: '#f59e0b', progress: 85, trend: 'up' as const, change: 'SLA Aprovação',
            sparkline: [
              { value: 3.1, label: '3.1d' }, { value: 2.7, label: '2.7d' }, { value: 2.3, label: '2.3d' },
              { value: 2.0, label: '2.0d' }, { value: 1.8, label: '1.8d' }, { value: 1.6, label: '1.6d' },
              { value: 1.4, label: 'Hoje: 1.4d' }
            ]
          },
          { label: 'Nível de Urgência', value: urgentes, icon: AlertTriangle, color: '#ef4444', progress: (urgentes / totalRequests) * 100, trend: 'up' as const, change: 'Prioridade Alta',
            sparkline: [
              { value: Math.max(urgentes - 2, 0) }, { value: Math.max(urgentes - 2, 0) }, { value: Math.max(urgentes - 1, 0) },
              { value: urgentes }, { value: urgentes }, { value: urgentes }, { value: urgentes, label: `Hoje: ${urgentes}` }
            ]
          },
        ]);
      }
    } catch (err) {
      console.error('[PurchaseRequest] Error:', err);
      setStats([
        { label: 'Requisições Ativas', value: 0, icon: ShoppingCart, color: '#10b981', progress: 0, change: 'Sem dados',
          sparkline: [0,0,0,0,0,0,0].map((_,i) => ({ value: 0, label: `Sem ${i+1}` })) },
        { label: 'Ticket Médio (Est.)', value: 'R$ 0,00', icon: Zap, color: '#3b82f6', progress: 0, change: 'Sem dados',
          sparkline: [0,0,0,0,0,0,0].map((_,i) => ({ value: 0, label: `Sem ${i+1}` })) },
        { label: 'Agilidade de Fluxo', value: '---', icon: Clock, color: '#f59e0b', progress: 0, change: 'SLA',
          sparkline: [0,0,0,0,0,0,0].map((_,i) => ({ value: 0, label: `Sem ${i+1}` })) },
        { label: 'Nível de Urgência', value: 0, icon: AlertTriangle, color: '#ef4444', progress: 0, change: 'Prioridade',
          sparkline: [0,0,0,0,0,0,0].map((_,i) => ({ value: 0, label: `Sem ${i+1}` })) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedRequest(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (request: any) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!canCreate) {
      alert('⚠️ Selecione uma unidade específica para criar uma nova solicitação. No modo Visão Global, o cadastro requer uma fazenda definida.');
      return;
    }
    const payload = {
      titulo: formData.title || formData.titulo,
      departamento: formData.department || formData.departamento,
      prioridade: formData.priority || formData.prioridade,
      valor_estimado: parseFloat(formData.estimatedValue || formData.valor_estimado),
      descricao: formData.description || formData.descricao,
      status: selectedRequest?.status || 'pending',
      solicitante: formData.solicitante || 'Usuário Atual'
    };

    if (selectedRequest) {
      const { error } = await supabase.from('solicitacoes_compra').update(payload).eq('id', selectedRequest.id);
      if (!error) { setIsModalOpen(false); fetchRequests(); }
    } else {
      const { error } = await supabase.from('solicitacoes_compra').insert([{ ...payload, ...insertPayload }]);
      if (!error) { setIsModalOpen(false); fetchRequests(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta solicitação?')) return;
    const { error } = await supabase.from('solicitacoes_compra').delete().eq('id', id);
    if (!error) fetchRequests();
  };

  const handleViewDetails = (req: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryItems([
        { id: '1', date: req.created_at, title: 'Item Solicitado: ' + (req.titulo || req.title), subtitle: 'Departamento: ' + (req.departamento || req.department), value: 'R$ ' + Number(req.valor_estimado).toLocaleString(), status: req.status === 'approved' ? 'success' : 'pending' },
        { id: '2', date: req.created_at, title: 'Justificativa Operacional', subtitle: req.descricao || 'Necessidade de reposição', value: 'OK', status: 'info' },
        { id: '3', date: new Date().toISOString(), title: 'Triagem Compras', subtitle: 'Aguardando cotação de mercado', value: '--', status: 'warning' },
      ]);
      setHistoryLoading(false);
    }, 800);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = requests.filter(r => {
      const matchesSearch = (r.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (r.titulo || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'PENDING' ? r.status === 'pending' : r.status === 'approved';
      const matchesUrgency = showOnlyUrgent ? (r.prioridade === 'high' || r.prioridade === 'Urgente') : true;
      const matchesPriority = filterValues.priorities.length === 0 || filterValues.priorities.includes(r.prioridade?.toLowerCase());
      const matchesDept = filterValues.departments.length === 0 || filterValues.departments.includes(r.departamento);
      const matchesAmount = Number(r.valor_estimado) <= filterValues.maxAmount;
      const matchesDate = (!filterValues.dateStart || new Date(r.created_at) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(r.created_at) <= new Date(filterValues.dateEnd));

      return matchesSearch && matchesTab && matchesUrgency && matchesPriority && matchesDept && matchesAmount && matchesDate;
    });

    const exportData = filteredData.map(item => ({
      ID: '#' + (item.id?.slice(0, 8)?.toUpperCase() || 'N/A'),
      Titulo: item.titulo || 'SOLICITAÇÃO',
      Departamento: item.departamento,
      Solicitante: item.solicitante || '---',
      Prioridade: item.prioridade,
      Valor_Estimado: 'R$ ' + Number(item.valor_estimado).toLocaleString(),
      Data: new Date(item.created_at).toLocaleDateString(),
      Status: item.status === 'approved' ? 'Em Cotação' : item.status === 'pending' ? 'Triagem' : 'Rejeitado'
    }));

    if (format === 'csv') exportToCSV(exportData, 'solicitacoes_compra');
    else if (format === 'excel') exportToExcel(exportData, 'solicitacoes_compra');
    else if (format === 'pdf') exportToPDF(exportData, 'solicitacoes_compra', 'Relatório de Solicitações de Compra');
  };

  const tableColumns = [
    {
      header: 'Solicitação / Código',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            {item.titulo || 'SOLICITAÇÃO'}
          </span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Departamento / Origem',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} color="#94a3b8" />
            {item.departamento}
          </span>
          <span className="sub-meta" style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
            Solicitante: {item.solicitante || 'N/A'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Prioridade',
      accessor: (item: any) => {
        const isUrgent = item.prioridade === 'high' || item.prioridade === 'urgent' || item.prioridade === 'Urgente';
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className={`status-pill ${isUrgent ? 'stopped' : 'info'}`} style={{ fontSize: '9px', padding: '2px 8px', fontWeight: 800 }}>
              {isUrgent ? 'URGENTE' : 'NORMAL'}
            </span>
          </div>
        );
      },
      align: 'center' as const
    },
    {
      header: 'Dias em Espera',
      accessor: (item: any) => {
        const daysAgo = Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 3600 * 24));
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: daysAgo > 3 ? '#ef4444' : '#475569', fontWeight: 700, fontSize: '12px' }}>
            <Clock size={14} />
            <span>{daysAgo} {daysAgo === 1 ? 'dia' : 'dias'}</span>
          </div>
        );
      },
      align: 'center' as const
    },
    {
      header: 'Valor Estimado',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}>
            {Number(item.valor_estimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Status Triagem',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${item.status === 'approved' ? 'active' : item.status === 'pending' ? 'warning' : 'stopped'}`}>
            {item.status === 'approved' ? 'Em Cotação' : item.status === 'pending' ? 'Triagem' : 'Rejeitado'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="requests-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <ShoppingCart size={14} fill="currentColor" />
            <span>TAUZE PROCUREMENT v5.0</span>
          </div>
          <h1 className="page-title">Solicitação de Compra</h1>
          <p className="page-subtitle">Fluxo interno de requisições de materiais, serviços e reposição de ativos em tempo real.</p>
        </div>
        <div className="page-actions">
          <button 
            className={`glass-btn secondary ${showOnlyUrgent ? 'active' : ''}`} 
            onClick={() => setShowOnlyUrgent(!showOnlyUrgent)}
            style={showOnlyUrgent ? { 
              background: 'hsl(var(--brand) / 0.1)', 
              borderColor: 'hsl(var(--brand))',
              color: 'hsl(var(--brand))',
              boxShadow: '0 0 15px hsl(var(--brand) / 0.2)'
            } : {}}
          >
            <Zap size={18} fill={showOnlyUrgent ? "currentColor" : "none"} />
            {showOnlyUrgent ? 'FILTRO ATIVO' : 'PRIORIDADES'}
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA REQUISIÇÃO
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={ShoppingCart} color=""  periodLabel="Mês Atual" />)
        ) : stats.map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change={stat.change}
            trend={stat.trend}
            sparkline={stat.sparkline}
            periodLabel={stat.periodLabel}
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            Aguardando Triagem
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'QUOTING' ? 'active' : ''}`}
            onClick={() => setActiveTab('QUOTING')}
          >
            Em Cotação
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Pesquisar por título, solicitante ou departamento..." 
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
                const menu = document.getElementById('export-menu-request');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-request" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-request')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-request')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-request')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <PurchaseRequestFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        <ModernTable 
          emptyState={
            requests.filter(r => (activeTab === 'PENDING' ? r.status === 'pending' : r.status === 'approved')).length === 0 ? (
              <EmptyState
                title={activeTab === 'PENDING' ? "Nenhuma solicitação aguardando triagem" : "Nenhuma solicitação em cotação"}
                description={activeTab === 'PENDING' ? "Não há solicitações de compra aguardando triagem no momento." : "Não há solicitações de compra em cotação de mercado."}
                actionLabel="Nova Requisição"
                onAction={handleOpenCreate}
                icon={ShoppingCart}
              />
            ) : (
              <EmptyState
                title="Nenhum registro encontrado"
                description="Sua busca não retornou resultados."
                icon={Search}
              />
            )
          } 
          data={requests.filter(r => {
            const matchesSearch = (r.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (r.titulo || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'PENDING' ? r.status === 'pending' : r.status === 'approved';
            const matchesUrgency = showOnlyUrgent ? (r.prioridade === 'high' || r.prioridade === 'Urgente') : true;
            
            const matchesPriority = filterValues.priorities.length === 0 || filterValues.priorities.includes(r.prioridade?.toLowerCase());
            const matchesDept = filterValues.departments.length === 0 || filterValues.departments.includes(r.departamento);
            const matchesAmount = Number(r.valor_estimado) <= filterValues.maxAmount;
            const matchesDate = (!filterValues.dateStart || new Date(r.created_at) >= new Date(filterValues.dateStart)) &&
                               (!filterValues.dateEnd || new Date(r.created_at) <= new Date(filterValues.dateEnd));

            return matchesSearch && matchesTab && matchesUrgency && matchesPriority && matchesDept && matchesAmount && matchesDate;
          })}
          columns={tableColumns}
          loading={loading}
          hideHeader={true}
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

      <PurchaseRequestForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedRequest}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê da Solicitação"
        subtitle="Rastreabilidade completa da requisição e aprovações"
        items={historyItems}
        loading={historyLoading}
      />

    </div>
  );
};
