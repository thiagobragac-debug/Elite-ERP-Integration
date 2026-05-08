import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  FileText,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
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

      {createPortal(
        <AnimatePresence>
          {isAnalysisOpen && (
            <div className="modal-overlay" onClick={() => setIsAnalysisOpen(false)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 50 }}
                className="analysis-panel"
                onClick={e => e.stopPropagation()}
              >
                <header className="analysis-header">
                  <div className="title-group">
                    <div className="icon-badge">
                      <TrendingUp size={22} className="text-brand" />
                    </div>
                    <div>
                      <h2>Análise de Autonomia</h2>
                      <p>Performance energética por ativo da frota</p>
                    </div>
                  </div>
                  <button className="close-btn" onClick={() => setIsAnalysisOpen(false)}>
                    <X size={20} />
                  </button>
                </header>

                <div className="analysis-content">
                  <div className="analysis-grid">
                    {Object.entries(
                      logs.reduce((acc: any, log: any) => {
                        const name = log.maquinas?.nome || 'Desconhecido';
                        if (!acc[name]) acc[name] = { litros: 0, abastecimentos: 0, custo: 0 };
                        acc[name].litros += Number(log.litros);
                        acc[name].abastecimentos += 1;
                        acc[name].custo += Number(log.valor_total);
                        return acc;
                      }, {})
                    ).map(([name, data]: [string, any]) => (
                      <div key={name} className="analysis-card">
                        <div className="card-top">
                          <span className="machine-name">{name}</span>
                          <span className="efficiency-badge">{(data.litros / data.abastecimentos).toFixed(1)} L/médio</span>
                        </div>
                        <div className="card-main">
                          <div className="stat">
                            <label>Total Consumido</label>
                            <span>{data.litros.toLocaleString()} L</span>
                          </div>
                          <div className="stat">
                            <label>Custo Total</label>
                            <span>{data.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                        </div>
                        <div className="progress-bar-wrapper">
                          <div className="bar-label">Carga de Operação</div>
                          <div className="bar-bg">
                            <div className="bar-fill" style={{ width: `${Math.min(100, (data.litros / 1000) * 100)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px); z-index: 10000; display: flex;
          align-items: center; justify-content: center; padding: 40px;
        }
        .analysis-panel {
          background: white; width: 100%; max-width: 900px; height: 650px;
          border-radius: 28px; border: 1px solid #e2e8f0; box-shadow: -20px 0 50px rgba(0,0,0,0.1);
          display: flex; flex-direction: column; overflow: hidden;
        }
        .analysis-header { padding: 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .title-group { display: flex; gap: 16px; align-items: center; }
        .icon-badge { width: 44px; height: 44px; border-radius: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; }
        .analysis-header h2 { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; }
        .analysis-header p { font-size: 13px; color: #64748b; margin: 2px 0 0; }
        .close-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px; transition: 0.2s; color: #94a3b8; }
        .close-btn:hover { background: #fee2e2; color: #ef4444; }

        .analysis-content { flex: 1; padding: 32px; overflow-y: auto; background: #f8fafc; }
        .analysis-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
        .analysis-card { background: white; padding: 20px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .machine-name { font-size: 15px; font-weight: 800; color: #0f172a; }
        .efficiency-badge { font-size: 11px; font-weight: 700; color: #059669; background: #ecfdf5; padding: 4px 10px; border-radius: 6px; }
        
        .card-main { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .stat label { display: block; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
        .stat span { font-size: 16px; font-weight: 800; color: #1e293b; }

        .progress-bar-wrapper { border-top: 1px solid #f1f5f9; padding-top: 12px; }
        .bar-label { font-size: 10px; font-weight: 700; color: #64748b; margin: 12px 0 6px; }
        .bar-bg { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
        .bar-fill { height: 100%; background: hsl(var(--brand)); border-radius: 3px; transition: 1s ease-out; }
      `}</style>
    </div>
  );
};
