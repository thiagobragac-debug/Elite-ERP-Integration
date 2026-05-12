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
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { PurchaseRequestForm } from '../../components/Forms/PurchaseRequestForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { GlobalModeBanner } from '../../components/GlobalMode/GlobalModeBanner';
import { PurchaseRequestFilterModal } from './components/PurchaseRequestFilterModal';

export const PurchaseRequest: React.FC = () => {
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
    priorities: [],
    departments: [],
    maxAmount: 100000,
    dateStart: '',
    dateEnd: ''
  });
  const [stats, setStats] = useState<any[]>([]);
  const [showOnlyUrgent, setShowOnlyUrgent] = useState(false);

  useEffect(() => {
    if (!activeFarmId && !isGlobalMode) return;
    fetchRequests();
  }, [activeFarmId, isGlobalMode]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase.from('solicitacoes_compra').select('*').order('created_at', { ascending: false });
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
          { label: 'Requisições Ativas', value: abertas, icon: ShoppingCart, color: '#10b981', progress: 100, change: 'Volume de Entrada' },
          { label: 'Ticket Médio (Est.)', value: avgValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Zap, color: '#3b82f6', progress: 100, change: 'Impacto Financeiro' },
          { label: 'Agilidade de Fluxo', value: '1.4 dias', icon: Clock, color: '#f59e0b', progress: 85, trend: 'up', change: 'SLA Aprovação' },
          { label: 'Nível de Urgência', value: urgentes, icon: AlertTriangle, color: '#ef4444', progress: (urgentes / totalRequests) * 100, trend: 'up', change: 'Prioridade Alta' },
        ]);
      }
    } catch (err) {
      console.error(err);
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

  const tableColumns = [
    {
      header: 'ID / Título',
      accessor: (item: any) => {
        const isUrgent = item.prioridade === 'high' || item.prioridade === 'urgent' || item.prioridade === 'Urgente';
        const isHighValue = Number(item.valor_estimado) > 5000;
        return (
          <div className="table-cell-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="flex flex-col">
              <span className="main-text">#{item.id?.slice(0, 8)?.toUpperCase() || 'N/A'}</span>
              <div className="sub-meta uppercase font-bold text-[10px] tracking-wider flex items-center gap-2">
                <span>{item.titulo || 'SOLICITAÇÃO'}</span>
                {isHighValue && <span className="text-amber-600 bg-amber-50 px-1 rounded border border-amber-200">NÍVEL EXECUTIVO</span>}
              </div>
            </div>
            {isUrgent && (
              <span style={{ 
                fontSize: '8px', 
                fontWeight: 900, 
                color: '#ef4444', 
                background: '#fef2f2', 
                padding: '2px 6px', 
                borderRadius: '4px',
                border: '1px solid #fee2e2'
              }}>
                URGENTE
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Origem / Espera',
      accessor: (item: any) => {
        const daysAgo = Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 3600 * 24));
        return (
          <div className="table-cell-meta">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <User size={14} />
                <span>{item.departamento}</span>
              </div>
              <span className={`text-[10px] font-bold uppercase ${daysAgo > 3 ? 'text-red-500' : 'text-slate-400'}`}>
                HA {daysAgo} DIAS EM AGUARDO
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Vlr Estimado',
      accessor: (item: any) => (
        <span className="main-text font-bold" style={{ color: 'hsl(var(--brand))' }}>
          {Number(item.valor_estimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
      align: 'right' as const
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'approved' ? 'active' : item.status === 'pending' ? 'warning' : 'stopped'}`}>
          {item.status === 'approved' ? 'Em Cotação' : item.status === 'pending' ? 'Triagem' : 'Rejeitado'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="requests-page animate-slide-up">
      <GlobalModeBanner />
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <ShoppingCart size={14} fill="currentColor" />
            <span>ELITE PROCUREMENT v5.0</span>
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
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={ShoppingCart} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+4.2%"
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            Aguardando Triagem
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'QUOTING' ? 'active' : ''}`}
            onClick={() => setActiveTab('QUOTING')}
          >
            Em Cotação
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Pesquisar por título, solicitante ou departamento..." 
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

      <PurchaseRequestFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        <ModernTable 
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
