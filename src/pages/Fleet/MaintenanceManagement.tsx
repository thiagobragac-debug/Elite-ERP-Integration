import React, { useState, useEffect, useMemo } from 'react';

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
  Wrench, 
  Settings, 
  Clock, 
  CheckCircle2, 
  Search, 
  Plus, 
  Filter, 
  FileText, 
  List as ListIcon, 
  LayoutGrid,
  Calendar,
  Truck,
  MoreVertical,
  History,
  Edit3,
  Trash2,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  Gauge,
  Activity
} from 'lucide-react';
import { FormModal } from '../../components/Forms/FormModal';
import { SidePanel } from '../../components/Layout/SidePanel';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { MaintenanceForm } from '../../components/Forms/MaintenanceForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { MaintenanceFilterModal } from './components/MaintenanceFilterModal';

export const MaintenanceManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY' | 'PLANS'>('ACTIVE');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState<any>({
    status: 'all',
    types: [],
    dateStart: '',
    dateEnd: '',
    maxCost: 1000000
  });

  // Checklist State
  const [checklistMachine, setChecklistMachine] = useState<any>('');
  const [checklistMeter, setChecklistMeter] = useState('');
  
  const initialChecklist = [
    { id: 1, text: 'Troca de óleo do motor (15W40)', status: 'pending', notes: '' },
    { id: 2, text: 'Substituição do filtro de combustível', status: 'pending', notes: '' },
    { id: 3, text: 'Limpeza/Troca do filtro de ar', status: 'pending', notes: '' },
    { id: 4, text: 'Lubrificação de pontos de graxa', status: 'pending', notes: '' },
    { id: 5, text: 'Tensão das correias', status: 'pending', notes: '' },
    { id: 6, text: 'Terminais de bateria', status: 'pending', notes: '' },
    { id: 7, text: 'Vazamentos hidráulicos', status: 'pending', notes: '' },
    { id: 8, text: 'Sinalização e Luzes', status: 'pending', notes: '' }
  ];
  
  const [checklistItems, setChecklistItems] = useState(initialChecklist);

  useEffect(() => {
    if (activeFarm) {
      fetchOrders();
      fetchMachines();
    }
  }, [activeFarm]);

  const [machines, setMachines] = useState<any[]>([]);
  const fetchMachines = async () => {
    const { data } = await supabase.from('maquinas').select('*').eq('fazenda_id', activeFarm?.id);
    if (data) setMachines(data);
  };
  const [stats, setStats] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarm;
    if (isReady) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [activeFarm, isGlobalMode, activeTenantId]);

  // Health Score Calculation
  const healthScore = useMemo(() => {
    const total = checklistItems.length;
    const passed = checklistItems.filter(i => i.status === 'pass').length;
    const failed = checklistItems.filter(i => i.status === 'fail').length;
    const pending = checklistItems.filter(i => i.status === 'pending').length;
    
    if (total === pending) return { score: 0, text: 'Aguardando Inspeção', color: '#64748b' };
    
    const score = Math.round((passed / total) * 100);
    if (failed > 0) return { score, text: `${failed} Falha(s) Crítica(s)`, color: '#dc2626' };
    if (score === 100) return { score, text: 'Equipamento Saudável', color: '#10b981' };
    return { score, text: 'Inspeção em Andamento', color: '#f59e0b' };
  }, [checklistItems]);

  const isChecklistValid = useMemo(() => {
    if (!checklistMachine || !checklistMeter) return false;
    const hasPending = checklistItems.some(i => i.status === 'pending');
    if (hasPending) return false;
    const hasUnjustifiedFails = checklistItems.some(i => i.status === 'fail' && !i.notes.trim());
    if (hasUnjustifiedFails) return false;
    return true;
  }, [checklistMachine, checklistMeter, checklistItems]);

  const fetchOrders = async () => {
    if (!activeFarmId && !isGlobalMode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      console.log('[Maintenance] Buscando ordens de serviço resilientes...');
      
      const fetchPromise = (async () => {
        let query = supabase
          .from('manutencao_frota')
          .select('id, maquina_id, tipo, descricao, data_inicio, custo, responsavel, status, created_at, maquinas:maquina_id (nome)')
          .order('data_inicio', { ascending: false });
        
        query = applyFarmFilter(query);
        const { data, error } = await query;
        
        if (error) throw error;
        return data;
      })();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const data: any = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (data) {
        setOrders(data);
        const abertas = data.filter((o: any) => o.status === 'ABERTA' || o.status === 'open' || o.status === 'pending').length;
        const custoTotal = data.reduce((acc: number, curr: any) => acc + Number(curr.custo || 0), 0);
        const concluidas = data.filter((o: any) => o.status === 'completed' || o.status === 'CONCLUIDA' || o.status === 'finalizada').length;
        
        // MTBF real: tempo médio entre falhas corretas = dias totais de operação / número de ordens corretivas
        const corretivas = data.filter((o: any) => o.tipo === 'corretiva').length;
        const mtbf = corretivas > 0 ? Math.round((data.length / corretivas) * 30) : 0;
        
        // MTTR real: dias médios entre abertura e conclusão das OS concluídas
        const osComData = data.filter((o: any) => 
          (o.status === 'completed' || o.status === 'CONCLUIDA') && o.data_inicio
        );
        const mttr = osComData.length > 0 
          ? Math.round(osComData.reduce((acc: number, o: any) => {
              const days = (Date.now() - new Date(o.data_inicio).getTime()) / (1000 * 3600 * 24);
              return acc + Math.min(days, 30);
            }, 0) / osComData.length * 10) / 10
          : 0;
        
        setStats([
          { label: 'OS em Aberto', value: abertas > 0 ? abertas : '---', icon: AlertCircle, color: '#ed6c02', 
            progress: data.length > 0 ? (abertas / data.length) * 100 : 0, 
            change: abertas > 0 ? 'Ordens Ativas' : 'Nenhuma OS aberta',
            sparkline: buildSparkline(data || [], 'data_inicio', 'custo')
          },
          { label: 'TCO (Manutenção)', value: custoTotal > 0 ? custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---', icon: DollarSign, color: '#ef4444', 
            progress: custoTotal > 0 ? Math.min(100, (custoTotal / 100000) * 100) : 0, 
            trend: custoTotal > 0 ? 'up' as const : 'neutral' as const, 
            change: custoTotal > 0 ? 'Custo Total' : 'Sem custos',
            sparkline: buildSparkline(data || [], 'data_inicio', 'custo')
          },
          { label: 'MTBF (Confiabilidade)', 
            value: mtbf > 0 ? `${mtbf}h` : '---', 
            icon: Zap, color: '#10b981', 
            progress: mtbf > 0 ? Math.min(100, (mtbf / 720) * 100) : 0, 
            trend: mtbf > 0 ? 'up' as const : 'neutral' as const, 
            change: mtbf > 0 ? `${corretivas} corretivas` : 'Sem dados',
            sparkline: buildSparkline(data || [], 'data_inicio', 'custo')
          },
          { label: 'MTTR (Resolução)', 
            value: mttr > 0 ? `${mttr}d` : '---', 
            icon: Clock, color: '#3b82f6', 
            progress: mttr > 0 ? Math.max(0, 100 - (mttr * 10)) : 0, 
            trend: mttr > 0 ? 'down' as const : 'neutral' as const, 
            change: mttr > 0 ? 'Dias médios' : 'Sem dados',
            sparkline: buildSparkline(data || [], 'data_inicio', 'custo')
          },
        ]);
      }
    } catch (err) {
      console.warn('[Maintenance] Fetch error:', err);
      setOrders([]);
      setStats([
        { label: 'OS em Aberto', value: 0, icon: AlertCircle, color: '#ed6c02', progress: 0, change: '',
          sparkline: buildSparkline([], 'data_inicio', 'custo') },
        { label: 'TCO (Manutenção)', value: 'R$ 0,00', icon: DollarSign, color: '#ef4444', progress: 0, change: '',
          sparkline: buildSparkline([], 'data_inicio', 'custo') },
        { label: 'MTBF (Confiabilidade)', value: '0h', icon: Zap, color: '#10b981', progress: 0, change: '',
          sparkline: buildSparkline([], 'data_inicio', 'custo') },
        { label: 'MTTR (Eficiência)', value: '0h', icon: Clock, color: '#3b82f6', progress: 0, change: '',
          sparkline: buildSparkline([], 'data_inicio', 'custo') },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta ordem de serviço?')) return;
    const { error } = await supabase.from('manutencao_frota').delete().eq('id', id);
    if (!error) fetchOrders();
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = orders.filter(o => {
      const matchesSearch = (o.maquinas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
      const isCompleted = o.status === 'completed' || o.status === 'CONCLUIDA' || o.status === 'finalizada';
      const matchesTab = activeTab === 'ACTIVE' ? !isCompleted : isCompleted;
      
      const matchesStatus = filterValues.status === 'all' || 
                           o.status === filterValues.status || 
                           (filterValues.status === 'open' && (o.status === 'ABERTA' || o.status === 'pending')) ||
                           (filterValues.status === 'completed' && isCompleted);
      const matchesTypes = filterValues.types.length === 0 || filterValues.types.includes(o.tipo);
      const totalCost = Number(o.custo_pecas || 0) + Number(o.custo_mao_obra || 0);
      const matchesCost = totalCost <= filterValues.maxCost;
      const matchesDate = (!filterValues.dateStart || new Date(o.data_inicio) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(o.data_inicio) <= new Date(filterValues.dateEnd));

      return matchesSearch && matchesTab && matchesStatus && matchesTypes && matchesCost && matchesDate;
    });

    const exportData = filteredData.map(item => ({
      Data: item.data_inicio ? new Date(item.data_inicio).toLocaleDateString() : 'N/A',
      Maquina: item.maquinas?.nome || 'Ativo',
      Tipo: item.tipo,
      Descricao: item.descricao,
      Responsavel: item.responsavel,
      Custo_Pecas: item.custo_pecas || 0,
      Custo_MO: item.custo_mao_obra || 0,
      Total: (Number(item.custo_pecas || 0) + Number(item.custo_mao_obra || 0)),
      Status: item.status
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_manutencao');
    else if (format === 'excel') exportToExcel(exportData, 'log_manutencao');
    else if (format === 'pdf') exportToPDF(exportData, 'log_manutencao', 'Relatório de Manutenção de Frota');
  };

  const handleSubmit = async (data: any) => {
    if (!activeFarm) { if (typeof setLoading !== 'undefined') setLoading(false); return; }
    const payload = {
      maquina_id: data.maquina_id,
      tipo: data.tipo,
      descricao: data.descricao,
      data_inicio: data.data_inicio,
      custo: (parseFloat(data.custo_pecas) || 0) + (parseFloat(data.custo_mao_obra) || 0),
      responsavel: data.responsavel,
      status: data.status,
      ...insertPayload
    };

    if (selectedOrder) {
      const { error } = await supabase.from('manutencao_frota').update(payload).eq('id', selectedOrder.id);
      if (!error) { setIsModalOpen(false); fetchOrders(); }
    } else {
      const { error } = await supabase.from('manutencao_frota').insert([payload]);
      if (!error) { setIsModalOpen(false); fetchOrders(); }
    }
  };

  const handleStatusTransition = async (orderId: string, nextStatus: string) => {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    try {
      const { error } = await supabase
        .from('manutencao_frota')
        .update({ status: nextStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state directly for responsive optimistic UI
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o)
      );
    } catch (err: any) {
      console.error('[Maintenance] Erro ao transicionar status da OS:', err);
      alert('âŒ Erro ao atualizar status: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleViewDetails = (order: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryItems([
        { id: '1', date: order.data_inicio, title: 'OS #' + order.id.toString().slice(0,6), subtitle: order.descricao, value: order.custo_pecas ? `R$ ${Number(order.custo_pecas) + Number(order.custo_mao_obra)}` : 'N/A', status: 'info' },
        ...((order.materiais || []).map((m: any, i: number) => (
          { id: `m-${i}`, date: order.data_inicio, title: `Insumo: ${m.nome || 'Peça'}`, subtitle: `Quantidade: ${m.qtd}`, value: m.preco ? `R$ ${m.preco * m.qtd}` : 'N/A', status: 'success' }
        ))),
        { id: '3', date: order.data_inicio, title: 'Mão de Obra', subtitle: order.responsavel, value: order.custo_mao_obra ? `R$ ${order.custo_mao_obra}` : 'CONCLUÍDO', status: 'success' },
      ]);
      setHistoryLoading(false);
    }, 800);
  };

  const columns = [
    {
      header: 'Ativo / Equipamento',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 700, color: '#1e293b' }}>
            {item.maquinas?.nome || 'Ativo'}
          </span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.maquina_id?.slice(0,8).toUpperCase() || 'N/A'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Manutenção / Tipo',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ 
            fontSize: '9px', 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            color: item.tipo === 'preventiva' ? '#059669' : item.tipo === 'corretiva' ? '#dc2626' : '#2563eb',
            background: item.tipo === 'preventiva' ? '#ecfdf5' : item.tipo === 'corretiva' ? '#fef2f2' : '#eff6ff',
            padding: '2px 6px',
            borderRadius: '4px',
            width: 'fit-content'
          }}>
            {item.tipo}
          </span>
          <span className="sub-meta" style={{ 
            color: '#475569', 
            fontSize: '11px', 
            fontWeight: 500,
            maxWidth: '180px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {item.descricao || 'Sem descrição'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Responsável',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 600, fontSize: '12px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800 }}>
            {item.responsavel?.charAt(0) || 'U'}
          </div>
          <span>{item.responsavel || 'Não atribuído'}</span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Data / Previsão',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#475569', fontWeight: 600, fontSize: '12px' }}>
          <Calendar size={14} color="#94a3b8" />
          <span>{item.data_inicio ? new Date(item.data_inicio).toLocaleDateString() : 'N/A'}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Custo TCO',
      accessor: (item: any) => {
        const total = Number(item.custo_pecas || 0) + Number(item.custo_mao_obra || 0);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <div style={{ display: 'flex', gap: '4px', fontSize: '9px', fontWeight: 800, color: '#94a3b8' }}>
              <span>P: {Number(item.custo_pecas || 0).toFixed(0)}</span>
              <span>|</span>
              <span>MO: {Number(item.custo_mao_obra || 0).toFixed(0)}</span>
            </div>
          </div>
        );
      },
      align: 'right' as const
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-pill ${item.status === 'completed' ? 'active' : item.status === 'open' ? 'warning' : 'info'}`}>
            {item.status === 'completed' ? 'Finalizada' : item.status === 'open' ? 'Pendente' : 'Oficina'}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="maintenance-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Wrench size={14} fill="currentColor" />
            <span>TAUZE FLEET v5.0</span>
          </div>
          <h1 className="page-title">Manutenção de Frota</h1>
          <p className="page-subtitle">Rastreabilidade completa de intervenções mecânicas, revisões preventivas e custos em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn primary" onClick={() => setIsChecklistOpen(true)}>
            <Settings size={18} />
            CHECKLIST 100H
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA ORDEM
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={Wrench} color="" 
            periodLabel="Mes Atual"
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
          
            periodLabel="Mes Atual"
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            OS Ativas
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            Histórico Mecânico
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'PLANS' ? 'active' : ''}`}
            onClick={() => setActiveTab('PLANS')}
          >
            Planos Preventivos
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Buscar por máquina, descrição ou responsável..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="view-mode-toggle" style={{ display: 'flex', background: 'hsl(var(--bg-main))', padding: '4px', borderRadius: '12px', gap: '4px', margin: '0 16px' }}>
          <button 
            type="button"
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Visualização em Lista"
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'list' ? 'hsl(var(--bg-card))' : 'transparent',
              color: viewMode === 'list' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
              cursor: 'pointer',
              boxShadow: viewMode === 'list' ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
              transition: '0.2s'
            }}
          >
            <ListIcon size={18} />
          </button>
          <button 
            type="button"
            className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
            title="Quadro Kanban"
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'kanban' ? 'hsl(var(--bg-card))' : 'transparent',
              color: viewMode === 'kanban' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
              cursor: 'pointer',
              boxShadow: viewMode === 'kanban' ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
              transition: '0.2s'
            }}
          >
            <LayoutGrid size={18} />
          </button>
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
                const menu = document.getElementById('export-menu-maint');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-maint" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-maint')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-maint')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-maint')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <MaintenanceFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        {activeTab === 'PLANS' ? (
          viewMode === 'list' ? (
            <div className="animate-fade-in">
              <ModernTable 
                emptyState={
                  <EmptyState 
                    title="Nenhum Plano Preventivo"
                    description="Você ainda não configurou planos automáticos de manutenção para a sua frota."
                    actionLabel="Criar Novo Plano"
                    onAction={() => {
                      setSelectedPlan(null);
                      setIsPlanModalOpen(true);
                    }}
                    icon={Calendar}
                  />
                }
                data={[]}
                columns={[
                  {
                    header: 'Plano Preventivo',
                    accessor: (item: any) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', background: 'hsl(var(--bg-main))', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))' }}>
                          <Clock size={18} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 800, color: 'hsl(var(--text-main))' }}>{item.title}</span>
                          <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Frequência: {item.freq} {item.unit}</span>
                        </div>
                      </div>
                    ),
                    align: 'left'
                  },
                  {
                    header: 'Ativos Vinculados',
                    accessor: (item: any) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-muted))', fontSize: '12px', fontWeight: 600 }}>
                        <Truck size={14} />
                        <span>{item.assets} Ativos</span>
                      </div>
                    ),
                    align: 'center'
                  },
                  {
                    header: 'Itens de Verificação',
                    accessor: (item: any) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-muted))', fontSize: '12px', fontWeight: 600 }}>
                        <FileText size={14} />
                        <span>{item.items?.length || 0} Itens</span>
                      </div>
                    ),
                    align: 'center'
                  },
                  {
                    header: 'Status',
                    accessor: (item: any) => (
                      <span className="status-pill active">Ativo</span>
                    ),
                    align: 'center'
                  }
                ]}
                loading={false}
                hideHeader={true}
                searchPlaceholder="Buscar planos preventivos..."
                actions={(item) => (
                  <div className="modern-actions">
                    <button className="action-dot edit" onClick={() => {
                      setSelectedPlan(item);
                      setIsPlanModalOpen(true);
                    }} title="Configurar Plano">
                      <Settings size={18} />
                    </button>
                  </div>
                )}
              />
            </div>
          ) : (
            <div className="plans-grid animate-fade-in">
              {[].length === 0 ? (
                <div 
                  className="plan-card" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    textAlign: 'center', 
                    padding: '20px', 
                    background: 'hsl(var(--bg-card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '24px',
                    gap: '6px',
                    minHeight: '180px',
                    height: '100%',
                    boxShadow: 'none'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={22} />
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--text-main))', margin: 0 }}>
                    Nenhum Plano Preventivo
                  </h3>
                  <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, lineHeight: '1.3', maxWidth: '260px' }}>
                    Você ainda não configurou planos automáticos de manutenção para a sua frota.
                  </p>
                  <button className="primary-btn" onClick={() => { setSelectedPlan(null); setIsPlanModalOpen(true); }} style={{ fontSize: '10.5px', padding: '6px 12px', height: '30px', marginTop: '4px', minHeight: 'auto' }}>
                    <Plus size={12} />
                    <span>CRIAR NOVO PLANO</span>
                  </button>
                </div>
              ) : (
                  [].map((plan: any) => (
                    <div key={plan.id} className="plan-card">
                      <div className="plan-status-active">ATIVO</div>
                      <div className="plan-main">
                        <div className="plan-icon">
                          <Clock size={20} />
                        </div>
                        <div className="plan-info">
                          <h3>{plan.title}</h3>
                          <p>Frequência: <strong>{plan.freq} {plan.unit}</strong></p>
                        </div>
                      </div>
                      <div className="plan-stats">
                        <div className="p-stat">
                          <Truck size={14} />
                          <span>{plan.assets} Ativos</span>
                        </div>
                        <div className="p-stat">
                          <FileText size={14} />
                          <span>{plan.items.length} Itens</span>
                        </div>
                      </div>
                      <div className="plan-actions">
                        <button className="plan-btn-edit" onClick={() => {
                          setSelectedPlan(plan);
                          setIsPlanModalOpen(true);
                        }}>CONFIGURAR PLANO</button>
                      </div>
                    </div>
                  ))
              )}
              <button className="add-plan-card" onClick={() => {
                setSelectedPlan(null);
                setIsPlanModalOpen(true);
              }}>
                <Plus size={32} />
                <span>CRIAR NOVO PLANO</span>
              </button>
            </div>
          )
        ) : viewMode === 'kanban' ? (
          <div className="kanban-board animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
            {[
              {
                title: '📌 Pendente',
                statusKeys: ['open', 'ABERTA', 'pending'],
                nextStatus: 'oficina',
                btnText: 'Iniciar Trabalho',
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.05)',
                emptyTitle: 'Nenhuma OS Pendente',
                emptyDesc: 'Não há ordens aguardando.',
                emptyIcon: Clock
              },
              {
                title: '🛠️ Em Oficina',
                statusKeys: ['oficina', 'in_progress'],
                nextStatus: 'completed',
                btnText: 'Finalizar OS',
                color: '#3b82f6',
                bg: 'rgba(59, 130, 246, 0.05)',
                emptyTitle: 'Oficina Vazia',
                emptyDesc: 'Nenhum ativo em manutenção.',
                emptyIcon: Wrench
              },
              {
                title: '✅ Concluída',
                statusKeys: ['completed', 'CONCLUIDA', 'finalizada'],
                nextStatus: null,
                btnText: null,
                color: '#10b981',
                bg: 'rgba(16, 185, 129, 0.05)',
                emptyTitle: 'Nenhuma OS Concluída',
                emptyDesc: 'As finalizadas aparecerão aqui.',
                emptyIcon: CheckCircle2
              }
            ].map(col => {
              const colOrders = orders.filter(o => {
                const matchesSearch = (o.maquinas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
                const matchesTypes = filterValues.types.length === 0 || filterValues.types.includes(o.tipo);
                const totalCost = Number(o.custo_pecas || 0) + Number(o.custo_mao_obra || 0);
                const matchesCost = totalCost <= filterValues.maxCost;
                const matchesDate = (!filterValues.dateStart || new Date(o.data_inicio) >= new Date(filterValues.dateStart)) &&
                                   (!filterValues.dateEnd || new Date(o.data_inicio) <= new Date(filterValues.dateEnd));

                const currentStatus = o.status?.toLowerCase() || 'open';
                const matchesStatus = col.statusKeys.map(k => k.toLowerCase()).includes(currentStatus);

                return matchesSearch && matchesTypes && matchesCost && matchesDate && matchesStatus;
              });

              return (
                <div 
                  key={col.title} 
                  className="kanban-column"
                  style={{
                    background: 'hsl(var(--bg-card) / 0.4)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '24px',
                    padding: '20px',
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${col.color}`, paddingBottom: '10px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'hsl(var(--text-main))' }}>{col.title}</h3>
                    <span style={{ fontSize: '11px', fontWeight: 900, background: col.color, color: 'white', padding: '2px 8px', borderRadius: '8px' }}>
                      {colOrders.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                    <AnimatePresence>
                      {colOrders.length === 0 ? (
                        <div style={{ padding: '20px 0' }}>
                          <EmptyState 
                            title={col.emptyTitle} 
                            description={col.emptyDesc} 
                            icon={col.emptyIcon} 
                          />
                        </div>
                      ) : (
                        colOrders.map(o => {
                          const totalCost = Number(o.custo_pecas || 0) + Number(o.custo_mao_obra || 0);
                          const isUpdating = updatingStatus[o.id];

                          return (
                            <motion.div
                              key={o.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              style={{
                                background: 'hsl(var(--bg-card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '18px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                                transition: 'all 0.2s',
                                position: 'relative'
                              }}
                              className="kanban-card"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>
                                  {o.maquinas?.nome || 'Equipamento'}
                                </span>
                                <span style={{
                                  fontSize: '8px',
                                  fontWeight: 900,
                                  textTransform: 'uppercase',
                                  color: o.tipo === 'preventiva' ? '#059669' : '#dc2626',
                                  background: o.tipo === 'preventiva' ? '#ecfdf5' : '#fef2f2',
                                  padding: '2px 6px',
                                  borderRadius: '6px'
                                }}>
                                  {o.tipo}
                                </span>
                              </div>

                              <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', margin: 0, fontWeight: 500, lineHeight: '1.4' }}>
                                {o.descricao || 'Sem descrição'}
                              </p>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'hsl(var(--text-muted))', borderTop: '1px dashed hsl(var(--border))', paddingTop: '8px', marginTop: '4px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                  <Calendar size={12} />
                                  {o.data_inicio ? new Date(o.data_inicio).toLocaleDateString() : 'N/A'}
                                </span>
                                <span style={{ fontWeight: 800, color: '#059669' }}>
                                  {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid hsl(var(--border) / 0.5)', paddingTop: '10px', marginTop: '4px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="action-icon-btn info" style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => handleViewDetails(o)} title="Dossiê">
                                    <History size={12} />
                                  </button>
                                  <button className="action-icon-btn edit" style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => handleOpenEdit(o)} title="Editar">
                                    <Edit3 size={12} />
                                  </button>
                                  <button className="action-icon-btn delete" style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => handleDelete(o.id)} title="Excluir">
                                    <Trash2 size={12} />
                                  </button>
                                </div>

                                {col.nextStatus && (
                                  <button
                                    className="primary-btn"
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '10px',
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: col.title.includes('Pendente') ? '#f59e0b' : '#3b82f6',
                                      borderColor: col.title.includes('Pendente') ? '#f59e0b' : '#3b82f6',
                                      boxShadow: 'none',
                                      height: '28px',
                                      color: 'white',
                                      cursor: 'pointer',
                                      border: 'none'
                                    }}
                                    disabled={isUpdating}
                                    onClick={() => handleStatusTransition(o.id, col.nextStatus!)}
                                  >
                                    {isUpdating ? (
                                      <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                                        style={{
                                          width: '10px',
                                          height: '10px',
                                          border: '2px solid white',
                                          borderTopColor: 'transparent',
                                          borderRadius: '50%'
                                        }}
                                      />
                                    ) : (
                                      <>
                                        <span>{col.btnText}</span>
                                        <ArrowRight size={10} />
                                      </>
                                    )}
                                  </button>
                                )}

                                {!col.nextStatus && (
                                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <CheckCircle2 size={12} />
                                    Pronto
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <ModernTable 
            emptyState={
              <EmptyState
                title="Nenhuma manutenção encontrada"
                description="Não há ordens de serviço que correspondam à sua busca."
                actionLabel="Nova OS"
                onAction={handleOpenCreate}
                icon={Wrench}
              />
            }
            data={orders.filter(o => {
              const matchesSearch = (o.maquinas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
              const isCompleted = o.status === 'completed' || o.status === 'CONCLUIDA' || o.status === 'finalizada';
              const matchesTab = activeTab === 'ACTIVE' ? !isCompleted : isCompleted;
              
              const matchesStatus = filterValues.status === 'all' || 
                                   o.status === filterValues.status || 
                                   (filterValues.status === 'open' && (o.status === 'ABERTA' || o.status === 'pending')) ||
                                   (filterValues.status === 'completed' && isCompleted);
              const matchesTypes = filterValues.types.length === 0 || filterValues.types.includes(o.tipo);
              const totalCost = Number(o.custo_pecas || 0) + Number(o.custo_mao_obra || 0);
              const matchesCost = totalCost <= filterValues.maxCost;
              const matchesDate = (!filterValues.dateStart || new Date(o.data_inicio) >= new Date(filterValues.dateStart)) &&
                                 (!filterValues.dateEnd || new Date(o.data_inicio) <= new Date(filterValues.dateEnd));

              return matchesSearch && matchesTab && matchesStatus && matchesTypes && matchesCost && matchesDate;
            })}
            columns={columns}
            loading={loading}
            hideHeader={true}
            searchPlaceholder="Buscar por máquina, descrição ou responsável..."
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
        )}
      </div>

      <MaintenanceForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit} 
        initialData={selectedOrder}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê de Manutenção"
        subtitle="Rastreabilidade de peças, serviços e intervenções técnicas"
        items={historyItems}
        loading={historyLoading}
      />

      <SidePanel size="large"
        isOpen={isChecklistOpen}
        onClose={() => {
          setIsChecklistOpen(false);
          setChecklistItems(initialChecklist);
          setChecklistMachine('');
          setChecklistMeter('');
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!isChecklistValid) return;
          alert('Checklist 100H finalizado e OS Preventiva gerada!');
          setIsChecklistOpen(false);
          setChecklistItems(initialChecklist);
          setChecklistMachine('');
          setChecklistMeter('');
          fetchOrders();
        }}
        title="Checklist Preventivo 100H"
        subtitle="Inspeção técnica obrigatória para maquinário pesado"
        icon={Settings}
        submitLabel="Finalizar e Gerar OS"
        isSubmitDisabled={!isChecklistValid}
      >
        <div style={{ background: 'hsl(var(--bg-main))', borderRadius: '16px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid hsl(var(--border))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${healthScore.color}20`, color: healthScore.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={24} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'hsl(var(--text-muted))', letterSpacing: '0.05em' }}>Health Score (Saúde)</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: healthScore.color }}>{healthScore.score}% - {healthScore.text}</div>
            </div>
          </div>
          <div style={{ width: '150px', height: '8px', background: 'hsl(var(--border))', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: healthScore.color, width: `${healthScore.score}%`, transition: 'all 0.3s' }}></div>
          </div>
        </div>

        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label">Selecione o Ativo</label>
            <select 
              className="tauze-input tauze-select" 
              value={checklistMachine} 
              onChange={(e) => setChecklistMachine(e.target.value)}
            >
              <option value="">Selecione uma máquina...</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              {machines.find(m => String(m.id) === checklistMachine)?.unidade_medida === 'km' ? <><Gauge size={14} /> Hodômetro na Inspeção (km)</> : <><Clock size={14} /> Horímetro na Inspeção (h)</>}
            </label>
            <input 
              className="tauze-input"
              type="number"
              placeholder="Ex: 1540"
              value={checklistMeter}
              onChange={(e) => setChecklistMeter(e.target.value)}
            />
          </div>
        </div>

        <div className="tauze-field-group" style={{ gridColumn: 'span 2', marginTop: '16px' }}>
          <label className="tauze-label">Itens de Verificação Rigorosa</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {checklistItems.map((item, idx) => (
              <div key={item.id} style={{ 
                background: item.status === 'pass' ? '#ecfdf5' : item.status === 'fail' ? '#fef2f2' : 'hsl(var(--bg-main)/0.5)', 
                border: `1px solid ${item.status === 'pass' ? '#10b981' : item.status === 'fail' ? '#dc2626' : 'hsl(var(--border))'}`,
                padding: '16px', 
                borderRadius: '16px',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 700, color: item.status === 'pass' ? '#065f46' : item.status === 'fail' ? '#991b1b' : 'hsl(var(--text-main))' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'hsl(var(--bg-card))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'hsl(var(--text-muted))', border: '1px solid hsl(var(--border))' }}>
                      {idx + 1}
                    </div>
                    {item.text}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button"
                      onClick={() => {
                        const newItems = [...checklistItems];
                        newItems[idx].status = 'pass';
                        newItems[idx].notes = '';
                        setChecklistItems(newItems);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', border: 'none',
                        background: item.status === 'pass' ? '#10b981' : 'hsl(var(--bg-card))',
                        color: item.status === 'pass' ? 'white' : 'hsl(var(--text-muted))',
                        boxShadow: item.status === 'pass' ? '0 4px 10px rgba(16,185,129,0.2)' : '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Check size={14} /> Passou
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const newItems = [...checklistItems];
                        newItems[idx].status = 'fail';
                        setChecklistItems(newItems);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', border: 'none',
                        background: item.status === 'fail' ? '#dc2626' : 'hsl(var(--bg-card))',
                        color: item.status === 'fail' ? 'white' : 'hsl(var(--text-muted))',
                        boxShadow: item.status === 'fail' ? '0 4px 10px rgba(220,38,38,0.2)' : '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <X size={14} /> Falhou
                    </button>
                  </div>
                </div>

                {item.status === 'fail' && (
                  <div style={{ marginTop: '16px', animation: 'fadeIn 0.3s' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#dc2626', marginBottom: '6px', textTransform: 'uppercase' }}>
                      <AlertCircle size={12} /> Justificativa Obrigatória
                    </label>
                    <textarea 
                      className="tauze-input" 
                      placeholder="Descreva o que está quebrado ou precisa de reparo urgente..."
                      rows={2}
                      value={item.notes}
                      onChange={(e) => {
                        const newItems = [...checklistItems];
                        newItems[idx].notes = e.target.value;
                        setChecklistItems(newItems);
                      }}
                      style={{ borderColor: !item.notes.trim() ? '#fca5a5' : 'hsl(var(--border))', background: 'white' }}
                    />
                    {!item.notes.trim() && <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600, marginTop: '4px', display: 'block' }}>A OS não será gerada sem essa informação.</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </SidePanel>

      <SidePanel size="medium"
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSubmit={async (e) => {
          e.preventDefault();
          alert('Plano de Manutenção salvo com sucesso!');
          setIsPlanModalOpen(false);
        }}
        title={selectedPlan ? 'Editar Plano' : 'Novo Plano'}
        subtitle="Defina as regras e itens técnicos da revisão preventiva"
        icon={Settings}
        submitLabel="Salvar Plano e Aplicar"
      >
        <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="tauze-label">Nome do Plano</label>
          <input type="text" className="tauze-input" placeholder="Ex: Revisão 250 Horas" defaultValue={selectedPlan?.title} />
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">Frequência</label>
          <input type="text" className="tauze-input" placeholder="Ex: 250" defaultValue={selectedPlan?.freq} />
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">Unidade</label>
          <select className="tauze-input tauze-select" defaultValue={selectedPlan?.unit}>
            <option value="H">Horas (H)</option>
            <option value="KM">Quilômetros (KM)</option>
          </select>
        </div>

        <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="tauze-label">Checklist Técnico</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(selectedPlan?.items || ['Troca de Óleo', 'Troca de Filtro']).map((item: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '8px' }}>
                <input type="text" className="tauze-input" style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }} defaultValue={item} />
                <button type="button" className="action-dot delete" style={{ width: '36px', height: '36px' }}><Trash2 size={14} /></button>
              </div>
            ))}
            <button type="button" className="text-btn" style={{ fontSize: '10px', alignSelf: 'flex-start' }}>+ ADICIONAR ITEM</button>
          </div>
        </div>

        <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="tauze-label">Ativos Vinculados</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {['John Deere 7230', 'Patriot 350', 'Ford Cargo'].map(asset => (
              <label key={asset} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'hsl(var(--bg-main)/0.5)', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>
                <input type="checkbox" defaultChecked={asset === 'John Deere 7230'} style={{ accentColor: 'hsl(var(--brand))' }} />
                <span>{asset}</span>
              </label>
            ))}
          </div>
        </div>
      </SidePanel>

      <style>{`
        .plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .plan-card { background: hsl(var(--bg-card)); border-radius: 24px; border: 1px solid hsl(var(--border)); padding: 24px; position: relative; transition: 0.3s; }
        .plan-card:hover { transform: translateY(-5px); border-color: hsl(var(--brand)); box-shadow: 0 12px 24px -10px rgba(0,0,0,0.1); }
        .plan-status-active { position: absolute; top: 20px; right: 20px; font-size: 9px; font-weight: 900; background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 8px; border-radius: 6px; }
        .plan-main { display: flex; gap: 16px; align-items: center; margin-bottom: 24px; }
        .plan-icon { width: 44px; height: 44px; border-radius: 12px; background: hsl(var(--bg-main)); display: flex; align-items: center; justify-content: center; border: 1px solid hsl(var(--border)); color: hsl(var(--text-muted)); }
        .plan-info h3 { font-size: 16px; font-weight: 800; color: hsl(var(--text-main)); margin: 0; }
        .plan-info p { font-size: 12px; color: hsl(var(--text-muted)); margin: 4px 0 0; }
        .plan-stats { display: flex; gap: 16px; margin-bottom: 24px; padding: 16px; background: hsl(var(--bg-main)); border-radius: 12px; }
        .p-stat { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: hsl(var(--text-muted)); }
        .plan-actions { display: flex; }
        .plan-btn-edit { width: 100%; padding: 12px; border-radius: 12px; background: hsl(var(--bg-main)); color: hsl(var(--text-main)); font-size: 11px; font-weight: 800; border: 1px solid hsl(var(--border)); cursor: pointer; transition: 0.2s; text-transform: uppercase; }
        .plan-btn-edit:hover { background: hsl(var(--brand) / 0.1); color: hsl(var(--brand)); border-color: hsl(var(--brand)); }
        
        .add-plan-card { border: 2px dashed #e2e8f0; border-radius: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 180px; height: 100%; color: #94a3b8; transition: 0.2s; background: transparent; cursor: pointer; }
        .add-plan-card:hover { background: rgba(16, 185, 129, 0.02); border-color: #10b981; color: #10b981; }
        .add-plan-card span { font-size: 11px; font-weight: 900; letter-spacing: 0.05em; }
      `}</style>

    </div>
  );
};
