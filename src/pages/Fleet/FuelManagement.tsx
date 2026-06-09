import React, { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

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
  Fuel, 
  Plus, 
  Search, 
  Filter,
  TrendingUp, 
  TrendingDown,
  BarChart3,  
  Calendar, 
  ChevronRight, 
  MoreVertical,
  Truck,
  Droplets,
  DollarSign,
  History,
  Trash2,
  Edit3,
  Zap,
  Gauge,
  Activity,
  FileText,
  X,
  Package
} from 'lucide-react';
import { SidePanel } from '../../components/Layout/SidePanel';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { FuelForm } from '../../components/Forms/FuelForm';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { FuelFilterModal } from './components/FuelFilterModal';
import './FuelManagement.css';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

export const FuelManagement: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter } = useFarmFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = usePersistentState('FuelManagement_isModalOpen', false);
  const [formActionId, setFormActionId] = useState<number>(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'LOG' | 'ANALYSIS') || 'LOG';
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });
  };
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = usePersistentState('FuelManagement_isAnalysisOpen', false);
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState('FuelManagement_showAdvancedFilters', false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    fuelTypes: [] as string[],
    minLiters: 0,
    maxLiters: 1000,
    dateStart: '',
    dateEnd: ''
  });

  const { data: logs = [], isLoading: loading, error } = useQuery({
    queryKey: ['fuel_logs', activeFarmId, activeTenantId, isGlobalMode],
    queryFn: async () => {
      let query = supabase
        .from('abastecimentos')
        .select('*, maquinas:maquina_id(nome)')
        .order('data', { ascending: false })
        .limit(500);
      
      query = applyFarmFilter(query);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: isGlobalMode ? !!activeTenantId : !!activeFarmId
  });

  const stats = useMemo(() => {
    if (!logs || logs.length === 0) {
      return [
        { label: 'Consumo Energético', value: '---', icon: Droplets, color: '#10b981', progress: 0, change: 'Sem dados', sparkline: [] },
        { label: 'Custo de Operação', value: '---', icon: DollarSign, color: '#ef4444', progress: 0, change: 'Sem dados', sparkline: [] },
        { label: 'Eficiência de Frota', value: '---', icon: Gauge, color: '#3b82f6', progress: 0, change: 'Sem dados', sparkline: [] },
        { label: 'Preço Médio (L)', value: '---', icon: BarChart3, color: '#f59e0b', progress: 0, change: 'Sem dados', sparkline: [] },
      ];
    }
    const totalLitros = logs.reduce((acc, curr) => acc + Number(curr.litros || 0), 0);
    const gastoTotal = logs.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
    const precoMedio = gastoTotal / (totalLitros || 1);

    return [
      { label: 'Consumo Energético', value: totalLitros > 0 ? `${totalLitros.toLocaleString()} L` : '---', icon: Droplets, color: '#10b981', progress: totalLitros > 0 ? 100 : 0, change: totalLitros > 0 ? 'Total período' : 'Sem abastecimentos',
        sparkline: buildSparkline(logs, 'data', 'litros')
      },
      { label: 'Custo de Operação', value: gastoTotal > 0 ? gastoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---', icon: DollarSign, color: '#ef4444', 
        progress: gastoTotal > 0 ? Math.min(100, (gastoTotal / 50000) * 100) : 0, 
        trend: gastoTotal > 0 ? ('up' as const) : undefined, 
        change: gastoTotal > 0 ? 'Gasto Acumulado' : 'Sem gastos',
        sparkline: buildSparkline(logs, 'data', 'valor_total')
      },
      { 
        label: 'Eficiência Diesel', 
        value: (() => {
          const maquinas = new Set(logs.map((l: any) => l.maquina_id).filter(Boolean));
          const totalMaq = maquinas.size;
          if (totalMaq === 0 || logs.length === 0) return '---';
          const mediaLitros = totalLitros / logs.length;
          const eficientes = logs.filter((l: any) => Number(l.litros || 0) <= mediaLitros).length;
          const pct = Math.round((eficientes / logs.length) * 100);
          return `${pct}%`;
        })(),
        icon: Gauge, color: '#3b82f6', 
        progress: (() => {
          if (logs.length === 0) return 0;
          const mediaLitros = totalLitros / logs.length;
          const eficientes = logs.filter((l: any) => Number(l.litros || 0) <= mediaLitros).length;
          return Math.round((eficientes / logs.length) * 100);
        })(),
        change: logs.length > 0 ? 'Diesel abaixo da média' : 'Sem dados',
        sparkline: buildSparkline(logs, 'data', null)
      },
      { label: 'Preço Médio (L)', value: precoMedio > 0 ? precoMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---', icon: BarChart3, color: '#f59e0b', 
        progress: precoMedio > 0 ? Math.min(100, (precoMedio / 10) * 100) : 0, 
        change: precoMedio > 0 ? 'Custo/Litro' : 'Sem dados',
        sparkline: buildSparkline(logs, 'data', 'valor_total')
      },
    ];
  }, [logs]);

  const handleOpenCreate = () => {
    setSelectedLog(null);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (log: any) => {
    setSelectedLog(log);
    setFormActionId(Date.now());
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
      const payload = {
        maquina_id: formData.machine_id,
        estoque_id: formData.estoque_id,
        data: formData.date,
        litros: parseFloat(formData.liters),
        valor_total: parseFloat(formData.total_cost),
        valor_medidor: parseFloat(formData.meter_value),
        tipo_combustivel: formData.fuel_type,
        responsavel: formData.responsible,
        fazenda_id: activeFarm?.id,
        tenant_id: activeTenantId
      };

      if (selectedLog) {
        const { error } = await supabase.from('abastecimentos').update(payload).eq('id', selectedLog.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('abastecimentos').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel_logs', activeFarmId, activeTenantId, isGlobalMode] });
      queryClient.invalidateQueries({ queryKey: ['fleet_dashboard'] });
      setIsModalOpen(false);
      toast.success(selectedLog ? 'Abastecimento atualizado com sucesso!' : 'Abastecimento registrado com sucesso!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao salvar abastecimento: ' + err.message);
    }
  });

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) return;
    saveMutation.mutate(formData);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = logs.filter(l => {
      const matchesSearch = (l.maquinas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (l.responsavel || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'LOG' ? true : l.tipo_combustivel === 'Especial';
      
      const isEfficient = l.litros / (l.valor_total || 1) < 0.2;
      const matchesStatus = filterValues.status === 'all' || 
                           (filterValues.status === 'efficient' && isEfficient) ||
                           (filterValues.status === 'high-consumption' && !isEfficient);
      
      const matchesFuel = filterValues.fuelTypes.length === 0 || filterValues.fuelTypes.includes(l.tipo_combustivel);
      const matchesLiters = l.litros <= filterValues.maxLiters;
      const matchesDate = (!filterValues.dateStart || new Date(l.data) >= new Date(filterValues.dateStart)) &&
                         (!filterValues.dateEnd || new Date(l.data) <= new Date(filterValues.dateEnd));

      return matchesSearch && matchesTab && matchesStatus && matchesFuel && matchesLiters && matchesDate;
    });

    const exportData = filteredData.map(item => ({
      Data: item.data ? new Date(item.data).toLocaleDateString() : 'N/A',
      Maquina: item.maquinas?.nome || 'Ativo',
      Litros: item.litros,
      Tipo_Combustivel: item.tipo_combustivel,
      Valor_Total: item.valor_total,
      Responsavel: item.responsavel || '-',
      Medidor: item.valor_medidor || '-'
    }));

    if (format === 'csv') exportToCSV(exportData, 'log_abastecimento');
    else if (format === 'excel') exportToExcel(exportData, 'log_abastecimento');
    else if (format === 'pdf') exportToPDF(exportData, 'log_abastecimento', 'Relatório de Abastecimento de Frota');
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('abastecimentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel_logs', activeFarmId, activeTenantId, isGlobalMode] });
      queryClient.invalidateQueries({ queryKey: ['fleet_dashboard'] });
      toast.success('Abastecimento excluído com sucesso!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao excluir abastecimento: ' + err.message);
    }
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este abastecimento?')) return;
    deleteMutation.mutate(id);
  };

  const columns = [
    {
      header: 'Ativo / Equipamento',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>
            {item.maquinas?.nome || 'Ativo'}
          </span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.maquina_id?.slice(0, 8).toUpperCase() || 'N/A'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Data Abastecimento',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontWeight: 600, fontSize: '12px' }}>
          <Calendar size={14} />
          <span>{item.data ? new Date(item.data).toLocaleDateString() : 'N/A'}</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Combustível',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            {item.tipo_combustivel || 'Diesel'}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Volume (Litros)',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#0f172a' }}>
          <Droplets size={14} color="#3b82f6" />
          <span>{item.litros} L</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Custo Total BRL',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}>
            {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Performance Telemetria',
      accessor: (item: any) => {
        const isEfficient = (item.litros || 0) < 150;
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className={`status-pill ${isEfficient ? 'active' : 'warning'}`}>
              {isEfficient ? 'Alta Eficiência' : 'Alto Consumo'}
            </span>
          </div>
        );
      },
      align: 'center' as const
    }
  ];
  const autonomyAnalysis = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    const grouped = logs.reduce((acc: any, log: any) => {
      const id = log.maquina_id;
      if (!id) return acc;
      
      if (!acc[id]) {
        acc[id] = {
          nome: log.maquinas?.nome || 'Desconhecido',
          unidade_medida: log.tipo_combustivel === 'Especial' ? 'km' : 'horas', // Placeholder if not fully fetched
          litrosTotais: 0,
          custoTotal: 0,
          medidores: [],
        };
      }
      
      acc[id].litrosTotais += Number(log.litros || 0);
      acc[id].custoTotal += Number(log.valor_total || 0);
      if (log.valor_medidor) {
        acc[id].medidores.push(Number(log.valor_medidor));
      }
      
      return acc;
    }, {});

    return Object.values(grouped).map((m: any) => {
      let deltaMedidor = 0;
      let consumoReal = 0;
      
      if (m.medidores.length > 1) {
        const min = Math.min(...m.medidores);
        const max = Math.max(...m.medidores);
        deltaMedidor = max - min;
        
        if (deltaMedidor > 0) {
          if (m.unidade_medida === 'horas') {
            consumoReal = m.litrosTotais / deltaMedidor; // L/h
          } else {
            consumoReal = deltaMedidor / m.litrosTotais; // km/L
          }
        }
      }
      
      return {
        ...m,
        deltaMedidor,
        consumoReal
      };
    }).sort((a: any, b: any) => b.custoTotal - a.custoTotal);
  }, [logs]);

  return (
    <div className="fuel-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Máquina & Frota', href: '/frota/dashboard' }, { label: 'Abastecimentos' }]} />
          <h1 className="page-title">Abastecimentos</h1>
          <p className="page-subtitle">Telemetria de consumo, análise de autonomia e controle rigoroso de custos energéticos.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn primary" onClick={() => setIsAnalysisOpen(true)}>
            <Zap size={18} />
            KPI AUTONOMIA
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO REGISTRO
          </button>
        </div>
      </header>

      <style>{`
        .next-gen-kpi-grid {
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 20px !important;
          margin-bottom: 32px !important;
        }

        @media (max-width: 1024px) {
          .next-gen-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .next-gen-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={Droplets} color="" 
            periodLabel="Frota Ativa"
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
            trend={stat.trend === 'up' || stat.trend === 'down' ? stat.trend : undefined}
            sparkline={stat.sparkline}
          
            periodLabel="Frota Ativa"
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'LOG' ? 'active' : ''}`}
            onClick={() => setActiveTab('LOG')}
          >
            Log de Abastecimento
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'ANALYSIS' ? 'active' : ''}`}
            onClick={() => setActiveTab('ANALYSIS')}
          >
            Análise por Ativo
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Buscar por máquina, combustível ou responsável..." 
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
                const menu = document.getElementById('export-menu-fuel');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-fuel" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-fuel')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-fuel')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-fuel')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>
      </div>

      <FuelFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="management-content">
        <ModernTable 
          emptyState={
            <EmptyState
              title="Nenhum abastecimento encontrado"
              description="Não há registros de abastecimento que correspondam à sua busca."
              actionLabel="Novo Registro"
              onAction={handleOpenCreate}
              icon={Fuel}
            />
          }
          data={logs.filter(l => {
            const matchesSearch = (l.maquinas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (l.responsavel || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'LOG' ? true : l.tipo_combustivel === 'Especial';
            
            const isEfficient = l.litros / (l.valor_total || 1) < 0.2;
            const matchesStatus = filterValues.status === 'all' || 
                                 (filterValues.status === 'efficient' && isEfficient) ||
                                 (filterValues.status === 'high-consumption' && !isEfficient);
            
            const matchesFuel = filterValues.fuelTypes.length === 0 || filterValues.fuelTypes.includes(l.tipo_combustivel);
            const matchesLiters = l.litros <= filterValues.maxLiters;
            const matchesDate = (!filterValues.dateStart || new Date(l.data) >= new Date(filterValues.dateStart)) &&
                               (!filterValues.dateEnd || new Date(l.data) <= new Date(filterValues.dateEnd));

            return matchesSearch && matchesTab && matchesStatus && matchesFuel && matchesLiters && matchesDate;
          })}
          columns={columns}
          loading={loading}
          hideHeader={true}
          searchPlaceholder="Filtrar telemetria..."
          actions={(item) => (
            <div className="modern-actions">
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

      <FuelForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        actionId={formActionId}
        onSubmit={handleSubmit}
        initialData={selectedLog}
      />

      <SidePanel size="large"
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        onSubmit={(e) => { e.preventDefault(); setIsAnalysisOpen(false); }}
        title="Análise de Autonomia"
        subtitle="Performance energética por ativo da frota"
        icon={TrendingUp}
        submitLabel="Fechar Relatório"
        hideSubmit={true}
      >
        <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
          {autonomyAnalysis.length === 0 ? (
            <EmptyState 
              title="Sem dados de telemetria"
              description="Registre mais de um abastecimento para a mesma máquina com o horímetro preenchido para calcular o L/h real."
              icon={Activity}
            />
          ) : (
            <>
              {/* Executive Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', background: 'hsl(var(--bg-main))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={12}/> Gasto Total Frota</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '8px', color: '#ef4444' }}>
                    {autonomyAnalysis.reduce((acc, curr) => acc + curr.custoTotal, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'hsl(var(--bg-main))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}><Droplets size={12}/> Volume Queimado</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '8px', color: '#3b82f6' }}>
                    {autonomyAnalysis.reduce((acc, curr) => acc + curr.litrosTotais, 0).toLocaleString()} L
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingDown size={12}/> Top Despesa</span>
                  <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '8px', color: '#1e293b' }}>
                    {autonomyAnalysis[0]?.nome}
                  </div>
                </div>
              </div>

              {/* Ranking Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                {autonomyAnalysis.map((m: any, index: number) => {
                  const isGargalo = index < 2 && m.custoTotal > 5000;
                  return (
                    <div key={index} style={{ background: 'hsl(var(--bg-main)/0.5)', padding: '20px', borderRadius: '16px', border: `1px solid ${isGargalo ? '#ef4444' : 'hsl(var(--border))'}`, position: 'relative', overflow: 'hidden' }}>
                      {isGargalo && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#ef4444' }} />}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingLeft: isGargalo ? '12px' : '0' }}>
                        <div>
                          <span style={{ fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {m.nome}
                            {isGargalo && <span style={{ fontSize: '10px', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '12px' }}>GARGALO</span>}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '20px', fontWeight: 900, color: isGargalo ? '#ef4444' : '#1e293b' }}>
                            {m.consumoReal > 0 ? m.consumoReal.toFixed(1) : '---'} <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>{m.unidade_medida === 'horas' ? 'L/h' : 'km/L'}</span>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: 'hsl(var(--bg-main))', padding: '12px', borderRadius: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>Trabalho (Período)</label>
                          <span style={{ fontWeight: 700, color: '#3b82f6' }}>{m.deltaMedidor > 0 ? m.deltaMedidor : '---'} {m.unidade_medida === 'horas' ? 'h' : 'km'}</span>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>Volume</label>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>{m.litrosTotais.toLocaleString()} L</span>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>Custo Total</label>
                          <span style={{ fontWeight: 700, color: '#ef4444' }}>{m.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>Abastecimentos</label>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>{m.medidores.length}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </SidePanel>
    </div>
  );
};
