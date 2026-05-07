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
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ClientForm } from '../../components/Forms/ClientForm';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { HistoryModal } from '../../components/Modals/HistoryModal';

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

  useEffect(() => {
    if (!activeFarm) return;
    fetchClients();
  }, [activeFarm]);

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
      </div>

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
