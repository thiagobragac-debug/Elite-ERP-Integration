import React, { useState, useEffect } from 'react';
import { 
  Fuel, 
  Plus, 
  Search, 
  Filter,
  TrendingUp, 
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
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { FuelForm } from '../../components/Forms/FuelForm';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';

export const FuelManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'LOG' | 'ANALYSIS'>('LOG');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchLogs();
  }, [activeFarm]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('abastecimentos')
      .select('*, maquinas(nome)')
      .eq('fazenda_id', activeFarm.id)
      .order('data', { ascending: false });
    
    if (data) {
      setLogs(data);
      const totalLitros = data.reduce((acc, curr) => acc + Number(curr.litros || 0), 0);
      const gastoTotal = data.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
      const precoMedio = gastoTotal / (totalLitros || 1);
      
      setStats([
        { label: 'Consumo Energético', value: `${totalLitros.toLocaleString()} L`, icon: Droplets, color: '#10b981', progress: 100 },
        { label: 'Custo de Operação', value: gastoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: '#ef4444', progress: 85, trend: 'up' },
        { label: 'Eficiência de Frota', value: '92%', icon: Gauge, color: '#3b82f6', progress: 92 },
        { label: 'Preço Médio (L)', value: precoMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: BarChart3, color: '#f59e0b', progress: 45 },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setSelectedLog(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (log: any) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) return;
    const payload = {
      maquina_id: formData.machine_id,
      data: formData.date,
      litros: parseFloat(formData.liters),
      valor_total: parseFloat(formData.total_cost),
      valor_medidor: parseFloat(formData.meter_value),
      tipo_combustivel: formData.fuel_type,
      responsavel: formData.responsible,
      fazenda_id: activeFarm.id,
      tenant_id: activeFarm.tenantId
    };

    if (selectedLog) {
      const { error } = await supabase.from('abastecimentos').update(payload).eq('id', selectedLog.id);
      if (!error) { setIsModalOpen(false); fetchLogs(); }
    } else {
      const { error } = await supabase.from('abastecimentos').insert([payload]);
      if (!error) { setIsModalOpen(false); fetchLogs(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este abastecimento?')) return;
    const { error } = await supabase.from('abastecimentos').delete().eq('id', id);
    if (!error) fetchLogs();
  };

  const columns = [
    {
      header: 'Ativo / Data',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.maquinas?.nome || 'Ativo'}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.data ? new Date(item.data).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      )
    },
    {
      header: 'Consumo',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Droplets size={14} />
          <span>{item.litros} L ({item.tipo_combustivel})</span>
        </div>
      )
    },
    {
      header: 'Valor Total',
      accessor: (item: any) => (
        <span className="font-bold text-slate-900">
          {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      )
    },
    {
      header: 'Operador',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Activity size={14} />
          <span>{item.responsavel || 'N/A'}</span>
        </div>
      )
    }
  ];

  return (
    <div className="fuel-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Fuel size={14} fill="currentColor" />
            <span>ELITE FLEET v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Abastecimento</h1>
          <p className="page-subtitle">Telemetria de consumo, análise de autonomia e controle rigoroso de custos energéticos.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn primary">
            <Zap size={18} />
            KPI AUTONOMIA
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO REGISTRO
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Droplets} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+1.2%"
            trend={stat.trend || 'up'}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'LOG' ? 'active' : ''}`}
            onClick={() => setActiveTab('LOG')}
          >
            Log de Abastecimento
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'ANALYSIS' ? 'active' : ''}`}
            onClick={() => setActiveTab('ANALYSIS')}
          >
            Análise por Ativo
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar por máquina, combustível ou responsável..." 
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
          data={logs.filter(l => {
            const matchesSearch = (l.maquinas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (l.responsavel || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'LOG' ? true : l.status === 'analysis';
            return matchesSearch && matchesTab;
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
        onSubmit={handleSubmit}
        initialData={selectedLog}
      />
    </div>
  );
};
