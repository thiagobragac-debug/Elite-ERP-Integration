import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Filter,
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  MoreVertical,
  Calendar,
  History,
  FileText,
  BarChart2,
  Package,
  Trash2,
  Edit3,
  Zap,
  TrendingUp,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { AuditForm } from '../../components/Forms/AuditForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';

export const AuditManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'CRITICAL'>('HISTORY');
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchAudits();
  }, [activeFarm]);

  const fetchAudits = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('auditorias_estoque')
      .select('*')
      .eq('fazenda_id', activeFarm.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setAudits(data);
      
      const concluidas = data.filter(a => a.status === 'completed').length;
      const emAndamento = data.filter(a => a.status === 'in_progress').length;
      const avgAccuracy = data.length > 0 
        ? data.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / data.length 
        : 0;
      const totalItems = data.reduce((acc, curr) => acc + (curr.items_count || 0), 0);
      
      setStats([
        { label: 'Auditorias Concluídas', value: concluidas, icon: ClipboardCheck, color: '#10b981', progress: 100 },
        { label: 'Acuracidade Média', value: `${avgAccuracy.toFixed(1)}%`, icon: Target, color: '#3b82f6', progress: avgAccuracy },
        { label: 'Itens Auditados', value: totalItems.toLocaleString(), icon: Package, color: '#f59e0b', progress: 85 },
        { label: 'Sessões Ativas', value: emAndamento, icon: History, color: '#6366f1', progress: 100 },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setSelectedAudit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (audit: any) => {
    setSelectedAudit(audit);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) return;
    
    const payload = {
      titulo: formData.title,
      data: formData.date,
      responsavel: formData.responsible,
      categoria: formData.category,
      status: selectedAudit?.status || 'in_progress',
      fazenda_id: activeFarm.id,
      tenant_id: activeFarm.tenantId
    };

    if (selectedAudit) {
      const { error } = await supabase.from('auditorias_estoque').update(payload).eq('id', selectedAudit.id);
      if (!error) { setIsModalOpen(false); fetchAudits(); }
    } else {
      const { error } = await supabase.from('auditorias_estoque').insert([payload]);
      if (!error) { setIsModalOpen(false); fetchAudits(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta auditoria?')) return;
    const { error } = await supabase.from('auditorias_estoque').delete().eq('id', id);
    if (!error) fetchAudits();
  };

  const handleViewDetails = (audit: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryItems([
        { id: '1', date: audit.data || audit.created_at, title: 'Item: Sal Mineral 20kg', subtitle: 'Esperado: 45 | Encontrado: 44', value: '-1 un', status: 'error' },
        { id: '2', date: audit.data || audit.created_at, title: 'Item: Farelo de Soja', subtitle: 'Esperado: 120 | Encontrado: 120', value: 'OK', status: 'success' },
        { id: '3', date: audit.data || audit.created_at, title: 'Item: Milho Moído', subtitle: 'Esperado: 200 | Encontrado: 202', value: '+2 un', status: 'warning' },
      ]);
      setHistoryLoading(false);
    }, 800);
  };

  const columns = [
    {
      header: 'Auditoria / Data',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.titulo}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.data ? new Date(item.data).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      )
    },
    {
      header: 'Responsável',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <span>{item.responsavel || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Acuracidade',
      accessor: (item: any) => (
        <div className="flex flex-col gap-1 min-w-[120px]">
          <div className="flex justify-between text-[10px] font-black italic">
            <span>PERCENTUAL</span>
            <span>{item.accuracy ? `${item.accuracy}%` : 'PENDENTE'}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${Number(item.accuracy || 0) >= 98 ? 'bg-emerald-500' : Number(item.accuracy || 0) > 90 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${item.accuracy || 0}%` }}
            />
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'completed' ? 'active' : 'info'}`}>
          {item.status === 'completed' ? 'Concluída' : 'Em Aberto'}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="audit-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <ClipboardCheck size={14} fill="currentColor" />
            <span>ELITE AUDIT v5.0</span>
          </div>
          <h1 className="page-title">Inventário & Auditoria</h1>
          <p className="page-subtitle">Reconciliação física vs. contábil, análise de divergências e controle rigoroso de perdas.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary">
            <TrendingUp size={18} />
            BI ANALYTICS
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO INVENTÁRIO
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={ClipboardCheck} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+2.4%"
            trend="up"
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            Histórico de Auditorias
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'CRITICAL' ? 'active' : ''}`}
            onClick={() => setActiveTab('CRITICAL')}
          >
            Itens Críticos
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar auditoria por título ou responsável..." 
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
          data={audits.filter(a => {
            const matchesSearch = (a.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) || (a.responsavel || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'HISTORY' ? true : a.critical === true;
            return matchesSearch && matchesTab;
          })}
          columns={columns}
          loading={loading}
          hideHeader={true}
          searchPlaceholder="Filtrar base de auditoria..."
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

      <AuditForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedAudit}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Detalhamento da Auditoria"
        subtitle="Conferência de itens e divergências encontradas"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
