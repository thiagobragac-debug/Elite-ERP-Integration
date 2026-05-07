import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight, 
  MoreVertical,
  Star,
  TrendingUp,
  Trash2,
  Edit3,
  History,
  FileText,
  Target,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ClientForm } from '../../components/Forms/ClientForm';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { useSearchParams } from 'react-router-dom';

export const ClientManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ATIVO' | 'LEAD'>('ATIVO');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    if (!activeFarm) return;
    fetchClients();
  }, [activeFarm]);

  const [searchParams] = useSearchParams();

  // Deep Linking: Abre o cliente automaticamente se vier da auditoria
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && clients.length > 0) {
      console.log('[DeepLink] Tentando abrir cliente:', id);
      const client = clients.find(c => c.id === id);
      if (client) {
        console.log('[DeepLink] Cliente encontrado, abrindo modal...');
        handleOpenEdit(client);
        // Limpa os params para evitar loops
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        console.warn('[DeepLink] Cliente não encontrado na lista atual');
      }
    }
  }, [searchParams, clients]);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('tenant_id', activeFarm.tenantId)
      .order('nome', { ascending: true });
    
    if (data) {
      setClients(data);
      const total = data.length;
      
      setStats([
        { label: 'Rede de Clientes', value: total, icon: Users, color: '#10b981', progress: 100 },
        { label: 'Volume de Vendas', value: 'R$ 8.7M', icon: TrendingUp, color: '#3b82f6', progress: 85, trend: 'up' },
        { label: 'Market Share', value: '14%', icon: Target, color: '#f59e0b', progress: 14 },
        { label: 'Satisfação Global', value: '4.9', icon: Star, color: '#166534', progress: 98 },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: any) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) return;
    const payload = {
      nome: formData.name,
      documento: formData.cnpj,
      tipo: formData.type,
      email: formData.email,
      telefone: formData.phone,
      localizacao: formData.location,
      limite_credito: formData.creditLimit,
      status: formData.status
    };

    if (selectedClient) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', selectedClient.id);
      if (!error) { setIsModalOpen(false); fetchClients(); }
    } else {
      const { error } = await supabase.from('clientes').insert([{ ...payload, tenant_id: activeFarm.tenantId }]);
      if (!error) { setIsModalOpen(false); fetchClients(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este cliente?')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (!error) fetchClients();
  };

  const handleViewHistory = (client: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: client.created_at, title: 'Cadastro Inicial', subtitle: 'Ponto de equilíbrio', value: 'OK', status: 'success' },
      { id: '2', date: new Date().toISOString(), title: 'Análise de Crédito', subtitle: 'Limite: ' + (client.limite_credito || 'N/A'), value: 'APROVADO', status: 'success' },
    ]);
  };

  const columns = [
    {
      header: 'Cliente',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.documento || 'Sem documento'}
          </div>
        </div>
      )
    },
    {
      header: 'Localização',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <MapPin size={14} />
          <span>{item.localizacao || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Tipo',
      accessor: (item: any) => (
        <span className="sub-meta uppercase font-bold text-[10px] tracking-wider">
          {item.tipo}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${(item.status || '').toUpperCase() === 'ATIVO' ? 'active' : 'warning'}`}>
          {(item.status || 'Lead').toUpperCase()}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="crm-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Users size={14} fill="currentColor" />
            <span>ELITE CRM v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Clientes</h1>
          <p className="page-subtitle">Homologação de compradores, análise de crédito e histórico comercial consolidado em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary">
            <Star size={18} />
            SEGMENTOS
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO CLIENTE
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Users} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+5.2%"
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'ATIVO' ? 'active' : ''}`}
            onClick={() => setActiveTab('ATIVO')}
          >
            Clientes Ativos
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'LEAD' ? 'active' : ''}`}
            onClick={() => setActiveTab('LEAD')}
          >
            Leads / Prospectos
          </button>
        </div>
        
        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar por nome, cidade ou tipo de comprador..." 
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
          <button className="icon-btn-secondary" title="Exportar">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        {viewMode === 'list' ? (
          <ModernTable 
            data={clients.filter(client => {
              const matchesSearch = (client.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (client.tipo || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'ATIVO' ? client.status?.toUpperCase() === 'ATIVO' : client.status?.toUpperCase() !== 'ATIVO';
              return matchesSearch && matchesTab;
            })}
            columns={columns}
            loading={loading}
            hideHeader={true}
            actions={(item) => (
              <div className="modern-actions">
                <button className="action-dot info" onClick={() => handleViewHistory(item)} title="Dossiê">
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
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="user-cards-grid"
          >
            {clients
              .filter(client => {
                const matchesSearch = (client.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (client.tipo || '').toLowerCase().includes(searchTerm.toLowerCase());
                const matchesTab = activeTab === 'ATIVO' ? client.status?.toUpperCase() === 'ATIVO' : client.status?.toUpperCase() !== 'ATIVO';
                return matchesSearch && matchesTab;
              })
              .map(client => (
                <motion.div 
                  key={client.id} 
                  layout
                  className={`user-card-premium ${client.status?.toUpperCase() === 'ATIVO' ? 'active' : 'warning-badge'}`}
                >
                  <div className="card-left-section">
                    <div className="card-avatar">
                      {client.nome?.charAt(0) || 'C'}
                    </div>
                    <div className="card-bottom-actions">
                      <button className="action-icon-btn" onClick={() => handleViewHistory(client)} title="Dossiê"><History size={16} /></button>
                      <button className="action-icon-btn" onClick={() => handleOpenEdit(client)} title="Editar"><Edit3 size={16} /></button>
                      <button className="action-icon-btn delete" onClick={() => handleDelete(client.id)} title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="card-main-content">
                    <div className="card-header-info">
                      <h3>{client.nome}</h3>
                      <span className="card-role-badge">{client.tipo || 'Cliente'}</span>
                    </div>

                    <div className="card-meta-grid">
                      <div className="meta-item">
                        <FileText size={14} className="meta-icon" />
                        <span>{client.documento || 'Sem Documento'}</span>
                      </div>
                      <div className="meta-item">
                        <MapPin size={14} className="meta-icon" />
                        <span>{client.localizacao || 'Brasil'}</span>
                      </div>
                      <div className="meta-item">
                        <Phone size={14} className="meta-icon" />
                        <span>{client.telefone || 'Sem telefone'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </motion.div>
        )}
      </div>

      <style>{`
        .view-mode-toggle {
          display: flex;
          background: #f1f5f9;
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
          color: #64748b;
          cursor: pointer;
          transition: 0.2s;
        }

        .view-btn.active {
          background: white;
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
          background: white;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
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
          background: #cbd5e1;
          transition: 0.3s;
        }

        .user-card-premium.active::before {
          background: #16a34a;
          box-shadow: 4px 0 15px rgba(22, 163, 74, 0.3);
        }

        .user-card-premium.warning-badge::before {
          background: #f59e0b;
          box-shadow: 4px 0 15px rgba(245, 158, 11, 0.3);
        }

        .user-card-premium:hover {
          transform: translateX(8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          border-color: #16a34a33;
        }

        .card-left-section {
          width: 130px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #f1f5f9;
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
          color: #0f172a;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          color: #16a34a;
          background: #f0fdf4;
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
          color: #64748b;
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
          border: 1px solid #f1f5f9;
          background: white;
          color: #64748b;
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

      <ClientForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedClient}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê do Cliente"
        subtitle="Rastreabilidade completa de crédito e interações"
        items={historyItems}
        loading={historyLoading}
      />

    </div>
  );
};
