import React, { useState, useEffect } from 'react';
import { 
  HandCoins, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  Calendar,
  Users,
  FileText,
  Clock,
  Trash2,
  Tag,
  ChevronRight,
  Search,
  Eye,
  Check,
  Edit3,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TransactionForm } from '../../components/Forms/TransactionForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import './AccountsReceivable.css';

export const AccountsReceivable: React.FC = () => {
  const { activeFarm } = useTenant();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'TODAS' | 'PENDENTE' | 'RECEBIDO'>('TODAS');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!activeFarm) return;
    fetchInvoices();
  }, [activeFarm]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('contas_receber')
        .select('*, clientes(nome)')
        .eq('fazenda_id', activeFarm.id)
        .order('data_vencimento', { ascending: true });
      
      if (data) {
        setInvoices(data);
        const totalAReceber = data.filter(i => i.status === 'PENDENTE').reduce((acc, curr) => acc + Number(curr.valor_total), 0);
        const recebidoMes = data.filter(i => i.status === 'RECEBIDO').reduce((acc, curr) => acc + Number(curr.valor_total), 0);
        const emAtraso = data.filter(i => i.status === 'PENDENTE' && new Date(i.data_vencimento) < new Date()).reduce((acc, curr) => acc + Number(curr.valor_total), 0);
        
        setStats([
          { label: 'Projeção de Receita', value: totalAReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: HandCoins, color: '#10b981', progress: 100 },
          { label: 'Liquidado (Mês)', value: recebidoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: TrendingUp, color: '#3b82f6', progress: 75, trend: 'up' },
          { label: 'Inadimplência', value: emAtraso.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Clock, color: '#ef4444', progress: (emAtraso / (totalAReceber || 1)) * 100 },
          { label: 'Títulos Ativos', value: data.length, icon: FileText, color: '#f59e0b', progress: 100 },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedInvoice(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) return;

    const payload = {
      descricao: formData.description,
      valor_total: parseFloat(formData.value),
      data_vencimento: formData.dueDate,
      categoria: formData.category,
      cliente_id: formData.entityId,
      metodo_recebimento: formData.paymentMethod,
      status: formData.status,
      fazenda_id: activeFarm.id,
      tenant_id: activeFarm.tenantId
    };

    if (selectedInvoice) {
      const { error } = await supabase
        .from('contas_receber')
        .update(payload)
        .eq('id', selectedInvoice.id);
      
      if (!error) {
        setIsModalOpen(false);
        fetchInvoices();
      }
    } else {
      const { error } = await supabase
        .from('contas_receber')
        .insert([payload]);

      if (!error) {
        setIsModalOpen(false);
        fetchInvoices();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return;
    const { error } = await supabase.from('contas_receber').delete().eq('id', id);
    if (!error) fetchInvoices();
  };

  const handleMarkAsReceived = async (id: string) => {
    const { error } = await supabase
      .from('contas_receber')
      .update({ status: 'RECEBIDO', data_recebimento: new Date().toISOString() })
      .eq('id', id);
    if (!error) fetchInvoices();
  };

  const handleViewDetails = (inv: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: inv.data_vencimento, title: 'Título: ' + inv.descricao, subtitle: 'Cliente: ' + (inv.clientes?.nome || inv.cliente || 'Geral'), value: Number(inv.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: inv.status === 'RECEBIDO' ? 'success' : 'pending' },
      { id: '2', date: inv.data_vencimento, title: 'Categoria', subtitle: inv.categoria || 'Geral', value: inv.metodo_recebimento || 'N/A', status: 'info' },
      { id: '3', date: inv.data_vencimento, title: 'Origem', subtitle: 'Venda de Gado', value: '100%', status: 'success' },
    ]);
  };

  const columns = [
    {
      header: 'Vencimento / Título',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className={`main-text ${new Date(item.data_vencimento) < new Date() && item.status === 'PENDENTE' ? 'text-red-500' : ''}`}>
            {new Date(item.data_vencimento).toLocaleDateString()}
          </span>
          <div className="sub-meta">
            <FileText size={12} />
            <span>{item.descricao}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Cliente',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Users size={14} />
          <span>{item.clientes?.nome || item.cliente || 'Geral'}</span>
        </div>
      )
    },
    {
      header: 'Valor Bruto',
      accessor: (item: any) => (
        <span className="font-bold text-slate-900">
          {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'RECEBIDO' ? 'active' : item.status === 'ATRASADO' ? 'danger' : 'warning'}`}>
          {item.status}
        </span>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="accounts-receivable-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <HandCoins size={14} fill="currentColor" />
            <span>ELITE RECEIVABLES v5.0</span>
          </div>
          <h1 className="page-title">Contas a Receber</h1>
          <p className="page-subtitle">Rastreabilidade de receitas, liquidação de faturas e saúde do crédito em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn primary" onClick={() => {}}>
            <Calendar size={18} />
            PREVISÃO
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA RECEITA
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+4.8%"
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'TODAS' ? 'active' : ''}`}
            onClick={() => setActiveTab('TODAS')}
          >
            Todas Receitas
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'PENDENTE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDENTE')}
          >
            Pendentes
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'RECEBIDO' ? 'active' : ''}`}
            onClick={() => setActiveTab('RECEBIDO')}
          >
            Recebidas
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Filtrar por descrição ou cliente..." 
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
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <KPISkeleton />
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState 
            title="Nenhum recebível cadastrado" 
            description="Você ainda não registrou nenhuma conta a receber para esta unidade. Comece adicionando uma nova venda ou fatura."
            actionLabel="Adicionar Receita"
            onAction={handleOpenCreate}
            icon={HandCoins}
          />
        ) : (
          <ModernTable 
            data={invoices.filter(i => {
              const matchesSearch = (i.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) || (i.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'TODAS' || i.status === activeTab;
              return matchesSearch && matchesTab;
            })}
            columns={columns}
            loading={loading}
            hideHeader={true}
            actions={(item) => (
              <div className="modern-actions">
                {item.status === 'PENDENTE' && (
                  <button className="action-dot success" onClick={() => handleMarkAsReceived(item.id)} title="Baixar">
                    <Check size={18} />
                  </button>
                )}
                <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Dossiê">
                  <FileText size={18} />
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

      <TransactionForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="receivable"
        initialData={selectedInvoice}
        onSubmit={handleSubmit}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê da Receita"
        subtitle="Rastreabilidade completa do recebível"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
