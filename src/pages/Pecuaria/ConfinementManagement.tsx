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
  FileText,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { ConfinementForm } from '../../components/Forms/ConfinementForm';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { CheckOutModal } from './components/CheckOutModal';

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);

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

  const handleCheckOut = async (data: any) => {
    const { error } = await supabase
      .from('confinamento')
      .update({
        data_fim: data.data_fim,
        peso_final: data.peso_final,
        destino: data.destino,
        status: 'archived'
      })
      .eq('id', data.id);

    if (!error) {
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
          <button className="glass-btn secondary" onClick={() => setIsCheckOutModalOpen(true)}>
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

        <div className="view-mode-toggle">
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Visualização em Lista"
          >
            <ListIcon size={18} />
          </button>
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Visualização em Cards"
          >
            <LayoutGrid size={18} />
          </button>
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
        {viewMode === 'list' ? (
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
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="user-cards-grid"
          >
            {confinements
              .filter(p => {
                const matchesSearch = (p.nome_curral || '').toLowerCase().includes(searchTerm.toLowerCase());
                const matchesTab = activeTab === 'ATIVOS' ? p.status !== 'archived' : p.status === 'archived';
                return matchesSearch && matchesTab;
              })
              .map(p => {
                const start = p.data_inicio ? new Date(p.data_inicio) : new Date();
                const now = new Date();
                const dof = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                const progress = (p.dof_alvo && dof) ? Math.min(100, (dof / p.dof_alvo) * 100) : 0;
                const isTermination = progress > 90;

                return (
                  <motion.div 
                    key={p.id} 
                    layout
                    className={`user-card-premium ${isTermination ? 'warning-badge' : 'info-badge'}`}
                  >
                    <div className="card-left-section">
                      <div className="card-avatar">
                        <Building2 size={32} />
                      </div>
                      <div className="card-bottom-actions">
                        <button className="action-icon-btn" onClick={() => handleViewDetails(p)} title="Histórico"><History size={16} /></button>
                        <button className="action-icon-btn" onClick={() => {}} title="Editar"><Edit3 size={16} /></button>
                        <button className="action-icon-btn delete" onClick={() => handleDelete(p.id)} title="Excluir"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    <div className="card-main-content">
                      <div className="card-header-info">
                        <h3>{p.nome_curral}</h3>
                        <span className="card-role-badge">{isTermination ? 'Terminação' : 'Engorda'}</span>
                      </div>

                      <div className="card-meta-grid">
                        <div className="meta-item">
                          <Beef size={14} className="meta-icon" />
                          <span>Lote: {p.lotes?.nome || 'Vazio'}</span>
                        </div>
                        <div className="meta-item">
                          <Activity size={14} className="meta-icon" />
                          <span>{p.capacidade_animais || 0} Animais</span>
                        </div>
                        <div className="meta-item">
                          <Clock size={14} className="meta-icon" />
                          <span>DOF: {dof} dias (Alvo: {p.dof_alvo})</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </motion.div>
        )}
      </div>

      <style>{`
        .view-mode-toggle {
          display: flex;
          background: hsl(var(--bg-main));
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
          margin: 0 16px;
        }

        .view-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: hsl(var(--text-muted));
          cursor: pointer;
          transition: 0.2s;
        }

        .view-btn.active {
          background: hsl(var(--bg-card));
          color: #16a34a;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .user-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
          padding: 8px;
        }

        .user-card-premium {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          display: flex;
          overflow: hidden;
          padding: 0;
          height: 180px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          position: relative;
          text-align: left;
        }

        .user-card-premium::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: hsl(var(--border-strong));
          transition: 0.3s;
        }

        .user-card-premium.active::before {
          background: #16a34a;
          box-shadow: 4px 0 15px rgba(22, 163, 74, 0.3);
        }

        .user-card-premium.stopped-badge::before {
          background: #f59e0b;
          box-shadow: 4px 0 15px rgba(245, 158, 11, 0.3);
        }

        .user-card-premium:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-lg);
          border-color: hsl(var(--brand) / 0.3);
        }

        .card-left-section {
          width: 130px;
          background: hsl(var(--bg-main) / 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid hsl(var(--border));
        }

        .card-avatar {
          width: 70px;
          height: 70px;
          background: #0f172a;
          color: white;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 12px;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2);
        }

        .card-main-content {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-header-info h3 {
          font-size: 19px;
          font-weight: 900;
          color: hsl(var(--text-main));
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          color: #16a34a;
          background: hsl(var(--brand) / 0.1);
          padding: 4px 10px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-top: 12px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: hsl(var(--text-muted));
          font-size: 12px;
          font-weight: 600;
        }

        .meta-icon {
          color: #16a34a;
        }

        .card-bottom-actions {
          display: flex;
          gap: 8px;
          margin-top: 15px;
        }

        .action-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-card));
          color: hsl(var(--text-muted));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-icon-btn:hover {
          background: #0f172a;
          color: white;
          transform: scale(1.1);
        }

        .action-icon-btn.delete:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
        }
      `}</style>

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

      <CheckOutModal 
        isOpen={isCheckOutModalOpen}
        onClose={() => setIsCheckOutModalOpen(false)}
        activePens={confinements.filter(p => p.status !== 'archived' && p.lote_id)}
        onCheckOut={handleCheckOut}
      />
    </div>
  );
};
