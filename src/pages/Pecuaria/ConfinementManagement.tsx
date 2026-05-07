import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  ChevronRight, 
  MoreVertical,
  Clock,
  TrendingUp,
  DollarSign,
  Beef,
  Scale,
  Target,
  Activity,
  Building,
  History,
  Edit3,
  Trash2,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { ConfinementForm } from '../../components/Forms/ConfinementForm';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';

export const ConfinementManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [confinements, setConfinements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ATIVOS' | 'HISTORICO'>('ATIVOS');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!activeFarm) return;
    fetchConfinements();
  }, [activeFarm]);

  const fetchConfinements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('confinamento')
      .select('*, lotes(nome)')
      .eq('fazenda_id', activeFarm.id)
      .eq('tenant_id', activeFarm.tenantId);
    
    if (data) {
      setConfinements(data);
      const totalAnimais = data.reduce((acc, curr) => acc + (curr.capacidade_animais || 0), 0);
      const curraisAtivos = data.length;
      
      setStats([
        { label: 'Efetivo Confinado', value: totalAnimais, icon: Activity, color: '#10b981', progress: 100 },
        { label: 'Currais Ativos', value: curraisAtivos, icon: Building2, color: '#3b82f6', progress: 85 },
        { label: 'GMD Médio Alvo', value: '1.450 kg', icon: TrendingUp, color: '#f59e0b', progress: 80 },
        { label: 'Capacidade Ocupada', value: '78%', icon: Target, color: '#166534', progress: 78 },
      ]);
    }
    setLoading(false);
  };

  const handleAddPen = async (data: any) => {
    if (!activeFarm) return;
    
    const { error } = await supabase.from('confinamento').insert([{
      nome_curral: data.nome_curral,
      capacidade_animais: parseInt(data.capacidade_animais),
      dof_alvo: parseInt(data.dof_alvo),
      data_inicio: data.data_inicio,
      lote_id: data.lote_id || null,
      fazenda_id: activeFarm.id,
      tenant_id: activeFarm.tenantId
    }]);

    if (!error) {
      setIsModalOpen(false);
      fetchConfinements();
    }
  };

  const handleViewDetails = (pen: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: pen.data_inicio, title: 'Início do Ciclo', subtitle: 'Check-in de lote', value: 'OK', status: 'success' },
      { id: '2', date: pen.data_inicio, title: 'Lote Vinculado', subtitle: pen.lotes?.nome || 'N/A', value: pen.capacidade_animais + ' Cabeças', status: 'info' },
      { id: '3', date: new Date().toISOString(), title: 'Status Nutricional', subtitle: 'Dieta de terminação', value: 'Em dia', status: 'success' },
    ]);
  };

  const columns = [
    {
      header: 'Curral',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome_curral}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            Lote: {item.lotes?.nome || 'N/A'}
          </div>
        </div>
      )
    },
    {
      header: 'Início',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Clock size={14} />
          <span>{item.data_inicio ? new Date(item.data_inicio).toLocaleDateString() : 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Animais',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Beef size={14} />
          <span>{item.capacidade_animais} cab.</span>
        </div>
      )
    },
    {
      header: 'Performance',
      accessor: (item: any) => {
        const start = item.data_inicio ? new Date(item.data_inicio) : new Date();
        const now = new Date();
        const dof = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const progress = (item.dof_alvo && dof) ? Math.min(100, (dof / item.dof_alvo) * 100) : 0;
        return (
          <span className={`status-pill ${progress > 90 ? 'warning' : 'active'}`}>
            {progress > 90 ? 'Terminação' : 'Engorda'}
          </span>
        );
      },
      align: 'center' as const
    }
  ];

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este curral?')) return;
    const { error } = await supabase.from('confinamento').delete().eq('id', id);
    if (!error) fetchConfinements();
  };

  return (
    <div className="confinement-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Building2 size={14} fill="currentColor" />
            <span>ELITE LIVESTOCK v5.0</span>
          </div>
          <h1 className="page-title">Módulo Confinamento</h1>
          <p className="page-subtitle">Terminação intensiva, controle de DOF e projeção de performance em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary">
            <Scale size={18} />
            Check-out Lote
          </button>
          <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Novo Check-in
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Activity} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+1.8%"
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'ATIVOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('ATIVOS')}
          >
            Currais Ativos
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'HISTORICO' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORICO')}
          >
            Histórico de Ciclos
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar por curral ou lote..." 
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
          data={confinements.filter(p => {
            const matchesSearch = (p.nome_curral || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'ATIVOS' ? p.status !== 'archived' : p.status === 'archived';
            return matchesSearch && matchesTab;
          })}
          columns={columns}
          loading={loading}
          hideHeader={true}
          searchPlaceholder="Filtrar base de currais..."
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Detalhes">
                <History size={18} />
              </button>
              <button className="action-dot edit" onClick={() => {}} title="Editar">
                <Edit3 size={18} />
              </button>
              <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir">
                <Trash2 size={18} />
              </button>
            </div>
          )}
        />
      </div>

      <ConfinementForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddPen} 
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê do Confinamento"
        subtitle="Rastreabilidade de ciclo e performance nutricional"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
