import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight, 
  MoreVertical,
  Star,
  TrendingUp,
  History,
  Briefcase,
  Trash2,
  Edit3,
  Globe,
  FileText,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SupplierForm } from '../../components/Forms/SupplierForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import './SupplierManagement.css';

export const SupplierManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'HOMOLOGADO' | 'PENDENTE'>('HOMOLOGADO');
  const [loading, setLoading] = useState(true);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) {
      setLoading(false);
      return;
    }
    fetchSuppliers();
  }, [activeFarm]);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('tenant_id', activeFarm.tenantId)
      .order('nome', { ascending: true });
    
    if (data) {
      setSuppliers(data);
      const ativos = data.filter(s => s.status === 'ATIVO').length;
      const categorias = new Set(data.map(s => s.categoria)).size;
      
      setStats([
        { label: 'Fornecedores Ativos', value: ativos, icon: Building2, color: '#10b981', progress: 100 },
        { label: 'Volume Compras', value: 'R$ 2.4M', icon: TrendingUp, color: '#3b82f6', progress: 75, trend: 'up' },
        { label: 'Segmentos de Rede', value: categorias, icon: Briefcase, color: '#f59e0b', progress: 100 },
        { label: 'Rating Global', value: '4.8', icon: Star, color: '#166534', progress: 96 },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: any) => {
    setSelectedSupplier(sup);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) return;
    const payload = {
      nome: formData.nome,
      cnpj_cpf: formData.cnpj,
      contato: formData.contato,
      telefone: formData.telefone,
      email: formData.email,
      categoria: formData.categoria,
      status: formData.status
    };

    if (selectedSupplier) {
      const { error } = await supabase.from('fornecedores').update(payload).eq('id', selectedSupplier.id);
      if (!error) { setIsModalOpen(false); fetchSuppliers(); }
    } else {
      const { error } = await supabase.from('fornecedores').insert([{ ...payload, tenant_id: activeFarm.tenantId }]);
      if (!error) { setIsModalOpen(false); fetchSuppliers(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este fornecedor?')) return;
    const { error } = await supabase.from('fornecedores').delete().eq('id', id);
    if (!error) fetchSuppliers();
  };

  const handleViewHistory = async (sup: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    const { data } = await supabase.from('notas_entrada').select('*').eq('fornecedor_id', sup.id).order('data_entrada', { ascending: false });
    if (data && data.length > 0) {
      setHistoryItems(data.map(n => ({ id: n.id, date: n.data_entrada, title: 'Nota Fiscal: ' + n.numero_nota, subtitle: n.observacoes || 'Compra de Insumos', value: Number(n.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: 'success' })));
    } else {
      setHistoryItems([{ id: '1', date: sup.created_at, title: 'Cadastro Inicial', subtitle: 'Fornecedor homologado', value: 'OK', status: 'info' }]);
    }
    setHistoryLoading(false);
  };

  const columns = [
    {
      header: 'Fornecedor',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.nome}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.cnpj_cpf || 'Sem documento'}
          </div>
        </div>
      )
    },
    {
      header: 'Categoria',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Briefcase size={14} />
          <span>{item.categoria}</span>
        </div>
      )
    },
    {
      header: 'Contato',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Phone size={14} />
          <span>{item.telefone || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'ATIVO' ? 'active' : 'stopped'}`}>
          {item.status}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="suppliers-page animate-slide-up">
      {!activeFarm && (
        <div className="no-farm-selected-overlay">
          <div className="glass-card text-center p-12">
            <Building2 size={64} className="mx-auto mb-6 opacity-20" />
            <h2 className="text-2xl font-bold mb-2">Unidade não Selecionada</h2>
            <p className="text-slate-400">Selecione uma fazenda no menu lateral para gerenciar fornecedores.</p>
          </div>
        </div>
      )}
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <Building2 size={14} fill="currentColor" />
            <span>ELITE PROCUREMENT v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Fornecedores</h1>
          <p className="page-subtitle">Homologação de parceiros, análise de performance e histórico transacional de compras em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary">
            <Globe size={18} />
            MAPA DE REDE
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVO FORNECEDOR
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Building2} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+1.5%"
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'HOMOLOGADO' ? 'active' : ''}`}
            onClick={() => setActiveTab('HOMOLOGADO')}
          >
            Rede Homologada
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'PENDENTE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDENTE')}
          >
            Pendentes
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Pesquisar por nome, categoria ou contato..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-filter-group">
          <button className="icon-btn-secondary" title="Filtros Avançados">
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Fornecedores">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        <ModernTable 
          data={suppliers.filter(sup => {
            const matchesSearch = (sup.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (sup.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'HOMOLOGADO' ? sup.status === 'ATIVO' : sup.status !== 'ATIVO';
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

      <SupplierForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedSupplier}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê do Fornecedor"
        subtitle="Rastreabilidade completa de compras e atividades"
        items={historyItems}
        loading={historyLoading}
      />

    </div>
  );
};
