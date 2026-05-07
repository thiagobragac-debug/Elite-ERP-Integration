import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter,
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  MoreVertical,
  Calendar,
  Clock,
  DollarSign,
  History,
  Trash2,
  Zap,
  Truck,
  FileText,
  Edit3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { MaintenanceForm } from '../../components/Forms/MaintenanceForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';

export const MaintenanceManagement: React.FC = () => {
  const { activeFarm } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchOrders();
  }, [activeFarm]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('manutencao_frota')
      .select('*, maquinas(nome)')
      .eq('fazenda_id', activeFarm.id)
      .order('data_inicio', { ascending: false });
    
    if (data) {
      setOrders(data);
      const abertas = data.filter(o => o.status === 'ABERTA' || o.status === 'open' || o.status === 'pending').length;
      const custoTotal = data.reduce((acc, curr) => acc + Number(curr.custo || 0), 0);
      const preventivas = data.filter(o => o.tipo === 'PREVENTIVA').length;
      
      setStats([
        { label: 'OS em Aberto', value: abertas, icon: AlertCircle, color: '#ed6c02', progress: (abertas / (data.length || 1)) * 100 },
        { label: 'Custos Mecânicos', value: custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: '#ef4444', progress: 85, trend: 'up' },
        { label: 'Preventivas (Mês)', value: preventivas, icon: CheckCircle2, color: '#10b981', progress: (preventivas / (data.length || 1)) * 100 },
        { label: 'Disponibilidade Ativos', value: '96.5%', icon: Settings, color: '#3b82f6', progress: 96 },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta ordem de serviço?')) return;
    const { error } = await supabase.from('manutencao_frota').delete().eq('id', id);
    if (!error) fetchOrders();
  };

  const handleSubmit = async (data: any) => {
    if (!activeFarm) return;
    const payload = {
      maquina_id: data.maquina_id,
      tipo: data.tipo,
      descricao: data.descricao,
      data_inicio: data.data_inicio,
      custo: parseFloat(data.custo),
      responsavel: data.responsavel,
      status: data.status,
    };

    if (selectedOrder) {
      const { error } = await supabase.from('manutencao_frota').update(payload).eq('id', selectedOrder.id);
      if (!error) { setIsModalOpen(false); fetchOrders(); }
    } else {
      const { error } = await supabase.from('manutencao_frota').insert([{ ...payload, fazenda_id: activeFarm.id, tenant_id: activeFarm.tenantId }]);
      if (!error) { setIsModalOpen(false); fetchOrders(); }
    }
  };

  const handleViewDetails = (order: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setTimeout(() => {
      setHistoryItems([
        { id: '1', date: order.data_inicio, title: 'OS #' + order.id.toString().slice(0,6), subtitle: order.descricao, value: order.custo ? `R$ ${order.custo}` : 'N/A', status: 'info' },
        { id: '2', date: order.data_inicio, title: 'Insumo Aplicado', subtitle: 'Filtro lubrificante blindado', value: 'R$ 85,00', status: 'success' },
        { id: '3', date: order.data_inicio, title: 'Mão de Obra', subtitle: order.responsavel, value: 'CONCLUÍDO', status: 'success' },
      ]);
      setHistoryLoading(false);
    }, 800);
  };

  const columns = [
    {
      header: 'Ativo / Maquina',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.maquinas?.nome || 'Ativo'}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.tipo}
          </div>
        </div>
      )
    },
    {
      header: 'Previsão',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Calendar size={14} />
          <span>{item.data_inicio ? new Date(item.data_inicio).toLocaleDateString() : 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Custo Total',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <DollarSign size={14} />
          <span className="font-bold">{item.custo ? Number(item.custo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '---'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'CONCLUIDA' ? 'active' : item.status === 'ABERTA' ? 'warning' : 'info'}`}>
          {item.status === 'CONCLUIDA' ? 'Finalizada' : item.status === 'ABERTA' ? 'Em Aberto' : 'Agendada'}
        </span>
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
            <span>ELITE FLEET v5.0</span>
          </div>
          <h1 className="page-title">Manutenção de Frota</h1>
          <p className="page-subtitle">Rastreabilidade completa de intervenções mecânicas, revisões preventivas e custos em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn primary">
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
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Wrench} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+0.5%"
            trend="up"
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            OS Ativas
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            Histórico Mecânico
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar por máquina, descrição ou responsável..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-filter-group">
          <button className="icon-btn-secondary" title="Filtros Avançados">
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Manutenções">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        <ModernTable 
          data={orders.filter(o => {
            const matchesSearch = (o.maquinas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'ACTIVE' ? o.status !== 'CONCLUIDA' : o.status === 'CONCLUIDA';
            return matchesSearch && matchesTab;
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

    </div>
  );
};
