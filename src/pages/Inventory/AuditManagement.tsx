import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { useSearchParams } from 'react-router-dom';

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
  Target,
  PieChart,
  DollarSign,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { AuditForm } from '../../components/Forms/AuditForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { AuditFilterModal } from './components/AuditFilterModal';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const AuditManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter } = useFarmFilter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = usePersistentState('AuditManagement_isModalOpen', false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'HISTORY' | 'CRITICAL') || 'HISTORY';
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });
  };
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    accuracyRange: 'all',
    dateStart: '',
    dateEnd: ''
  });

  const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;

  const { data: audits = [], isLoading: loading } = useQuery({
    queryKey: ['audits', activeFarmId, activeTenantId, isGlobalMode],
    queryFn: async () => {
      let query = supabase
        .from('auditorias_estoque')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      
      query = applyFarmFilter(query);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: isReady
  });

  const concluidas = audits.filter((a: any) => a.status === 'completed').length;
  const emAndamento = audits.filter((a: any) => a.status === 'in_progress').length;
  const avgAccuracy = audits.length > 0 
    ? audits.reduce((acc: number, curr: any) => acc + (curr.accuracy || 0), 0) / audits.length 
    : 0;
  const custoPerdas = audits.reduce((acc: number, curr: any) => acc + (curr.custo_divergencia || 0), 0);
  const tempoMedio = audits.length > 0
    ? audits.reduce((acc: number, curr: any) => acc + (curr.tempo_auditoria_horas || 0), 0) / audits.length
    : 0;

  const stats = [
    { label: 'Auditorias Concluídas', value: concluidas > 0 ? concluidas : '---', icon: ClipboardCheck, color: '#10b981', 
      progress: audits.length > 0 ? (concluidas / audits.length) * 100 : 0, 
      change: concluidas > 0 ? 'Concluídas' : 'Nenhuma concluída',
      sparkline: buildSparkline(audits || [], 'data_inicio', 'divergencias_total')
    },
    { label: 'Acuracidade Geral', value: avgAccuracy > 0 ? `${avgAccuracy.toFixed(1)}%` : '---', icon: PieChart, color: '#3b82f6', 
      progress: avgAccuracy > 0 ? avgAccuracy : 0, 
      trend: (avgAccuracy > 95 ? 'up' : 'down') as any, 
      change: 'Média de Inventário',
      sparkline: buildSparkline(audits || [], 'data_inicio', 'acuracidade_perc')
    },
    { label: 'Custo de Perdas (Shrinkage)', 
      value: custoPerdas > 0 ? custoPerdas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---', 
      icon: DollarSign, color: '#ef4444', 
      progress: custoPerdas > 0 ? Math.min(100, (custoPerdas / 10000) * 100) : 0, 
      trend: (custoPerdas > 0 ? 'up' : 'neutral') as any, 
      change: custoPerdas > 0 ? 'Prejuízo Contabilizado' : 'Sem Perdas',
      sparkline: buildSparkline(audits || [], 'data_inicio', 'custo_divergencia')
    },
    { label: 'Tempo Médio de Auditoria', 
      value: tempoMedio > 0 ? `${tempoMedio.toFixed(1)}h` : '---', 
      icon: Clock, color: '#8b5cf6', 
      progress: tempoMedio > 0 ? Math.max(0, 100 - (tempoMedio * 5)) : 0, 
      trend: (tempoMedio > 0 ? 'down' : 'neutral') as any, 
      change: tempoMedio > 0 ? 'Horas por inventário' : 'Sem dados',
      sparkline: buildSparkline(audits || [], 'data_inicio', 'tempo_auditoria_horas')
    },
  ];

  const handleOpenCreate = () => {
    setSelectedAudit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (audit: any) => {
    setSelectedAudit(audit);
    setIsModalOpen(true);
  };

  const saveAuditMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (selectedAudit) {
        const { error } = await supabase.from('auditorias_estoque').update(payload).eq('id', selectedAudit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('auditorias_estoque').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      setIsModalOpen(false);
      toast.success(selectedAudit ? 'Auditoria atualizada!' : 'Auditoria registrada!');
    },
    onError: (err: any) => {
      toast.error('Erro ao salvar auditoria: ' + err.message);
    }
  });

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

    saveAuditMutation.mutate(payload);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = audits.filter(a => {
      const matchesSearch = (a.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) || (a.responsavel || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'HISTORY' ? true : (Number(a.accuracy || 100) < 95);
      
      const matchesStatus = filterValues.status === 'all' || a.status === filterValues.status;
      
      let matchesAccuracy = true;
      const acc = a.accuracy || 0;
      if (filterValues.accuracyRange === 'excellent') matchesAccuracy = acc >= 98;
      else if (filterValues.accuracyRange === 'good') matchesAccuracy = acc >= 90 && acc < 98;
      else if (filterValues.accuracyRange === 'critical') matchesAccuracy = acc < 90;

      const matchesDate = (!filterValues.dateStart || new Date(a.data || a.created_at) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(a.data || a.created_at) <= new Date(filterValues.dateEnd));

      return matchesSearch && matchesTab && matchesStatus && matchesAccuracy && matchesDate;
    });

    const exportData = filteredData.map(item => ({
      Data: item.data ? new Date(item.data).toLocaleDateString() : 'N/A',
      Titulo: item.titulo,
      Responsavel: item.responsavel || 'N/A',
      Categoria: item.categoria || 'Geral',
      Status: item.status === 'completed' ? 'Concluída' : 'Em Aberto',
      Acuracidade: item.accuracy ? `${item.accuracy}%` : '0%',
      Itens: item.items_count || 0
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_auditorias');
    else if (format === 'excel') exportToExcel(exportData, 'log_auditorias');
    else if (format === 'pdf') exportToPDF(exportData, 'log_auditorias', 'Relatório de Auditoria de Estoque');
  };

  const deleteAuditMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('auditorias_estoque').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Auditoria excluída com sucesso!');
    },
    onError: (err: any) => {
      toast.error('Erro ao excluir auditoria: ' + err.message);
    }
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta auditoria?')) return;
    deleteAuditMutation.mutate(id);
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
      header: 'Auditoria / Código',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>{item.titulo}</span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Categoria',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            {item.categoria || 'Geral'}
          </span>
          <span className="sub-meta" style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Estoque
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Data Inventário',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontWeight: 600, fontSize: '12px' }}>
          <Calendar size={14} />
          <span>{item.data ? new Date(item.data).toLocaleDateString() : 'N/A'}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Auditor / Responsável',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            {item.responsavel || 'N/A'}
          </span>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Verificado
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Acuracidade',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '135px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: 900, color: '#64748b' }}>
            <span>PERCENTUAL</span>
            <span style={{ color: Number(item.accuracy || 0) >= 98 ? '#10b981' : Number(item.accuracy || 0) > 90 ? '#f59e0b' : '#ef4444' }}>
              {item.accuracy ? `${item.accuracy}%` : 'PENDENTE'}
            </span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                borderRadius: '99px', 
                backgroundColor: Number(item.accuracy || 0) >= 98 ? '#10b981' : Number(item.accuracy || 0) > 90 ? '#f59e0b' : '#ef4444',
                width: `${item.accuracy || 0}%` 
              }}
            />
          </div>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${item.status === 'completed' ? 'active' : 'info'}`}>
            {item.status === 'completed' ? 'Concluída' : 'Em Aberto'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="audit-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Estoque & Insumos', href: '/estoque/dashboard' }, { label: 'Inventário & Auditoria' }]} />
          <h1 className="page-title">Inventário & Auditoria</h1>
          <p className="page-subtitle">Reconciliação física vs. contábil, análise de divergências e controle rigoroso de perdas.</p>
        </div>
        <div className="page-actions">

          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO INVENTÁRIO
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={ClipboardCheck} color="" 
            periodLabel="Inventario Atual"
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
            trend={stat.trend || 'up'}
            sparkline={stat.sparkline}
          
            periodLabel="Inventario Atual"
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            Histórico de Auditorias
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'CRITICAL' ? 'active' : ''}`}
            onClick={() => setActiveTab('CRITICAL')}
          >
            Itens Críticos
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Buscar auditoria por título ou responsável..." 
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
                const menu = document.getElementById('export-menu-audit');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-audit" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-audit')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-audit')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-audit')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>

        <AuditFilterModal 
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filters={filterValues}
          setFilters={setFilterValues}
        />
      </div>

      <div className="management-content">
         <ModernTable 
          emptyState={
            !searchTerm && filterValues.status === 'all' && filterValues.accuracyRange === 'all' && !filterValues.dateStart && !filterValues.dateEnd ? (
              <EmptyState
                title={activeTab === 'HISTORY' ? "Nenhuma auditoria registrada" : "Nenhum item crítico"}
                description={activeTab === 'HISTORY' ? "Você não possui histórico de inventário no momento." : "Não há auditorias com acuracidade crítica."}
                actionLabel={activeTab === 'HISTORY' ? "Novo Inventário" : undefined}
                onAction={activeTab === 'HISTORY' ? handleOpenCreate : undefined}
                icon={ClipboardCheck}
              />
            ) : (
              <EmptyState
                title="Nenhum registro encontrado"
                description="Sua busca não retornou resultados."
                icon={Search}
              />
            )
          } 
          data={audits.filter(a => {
            const matchesSearch = (a.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) || (a.responsavel || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'HISTORY' ? true : (Number(a.accuracy || 100) < 95);
            
            const matchesStatus = filterValues.status === 'all' || a.status === filterValues.status;
            
            let matchesAccuracy = true;
            const acc = a.accuracy || 0;
            if (filterValues.accuracyRange === 'excellent') matchesAccuracy = acc >= 98;
            else if (filterValues.accuracyRange === 'good') matchesAccuracy = acc >= 90 && acc < 98;
            else if (filterValues.accuracyRange === 'critical') matchesAccuracy = acc < 90;

            const matchesDate = (!filterValues.dateStart || new Date(a.data || a.created_at) >= new Date(filterValues.dateStart)) &&
                               (!filterValues.dateEnd || new Date(a.data || a.created_at) <= new Date(filterValues.dateEnd));

            return matchesSearch && matchesTab && matchesStatus && matchesAccuracy && matchesDate;
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
