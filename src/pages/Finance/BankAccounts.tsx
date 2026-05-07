import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search,
  Filter,
  Wallet, 
  CreditCard, 
  ChevronRight, 
  TrendingUp, 
  Trash2, 
  Edit3, 
  ArrowUpRight,
  Zap,
  Layout,
  History,
  FileText,
  Activity,
  ShieldCheck,
  Building
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { BankAccountForm } from '../../components/Forms/BankAccountForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';

export const BankAccounts: React.FC = () => {
  const { activeFarm } = useTenant();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'BALANCES' | 'CASHFLOW'>('BALANCES');
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchAccounts();
  }, [activeFarm]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('tenant_id', activeFarm.tenantId)
        .order('banco', { ascending: true });
      
      if (data) {
        setAccounts(data);
        const liquidezTotal = data.reduce((acc, curr) => acc + Number(curr.saldo_atual || 0), 0);
        
        setStats([
          { label: 'Liquidez Disponível', value: liquidezTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Wallet, color: '#10b981', progress: 100 },
          { label: 'Utilização de Limites', value: '12%', icon: CreditCard, color: '#ef4444', progress: 12 },
          { label: 'Custódia Bancária', value: data.length, icon: Building, color: '#3b82f6', progress: 100 },
          { label: 'Rendimento Médio', value: '+4.2%', icon: TrendingUp, color: '#f59e0b', progress: 85, trend: 'up' },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: any) => {
    setSelectedAccount(acc);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) return;

    const payload = {
      banco: formData.banco,
      agencia: formData.agencia,
      conta: formData.conta,
      tipo: formData.tipo,
      saldo_atual: parseFloat(formData.saldo_inicial),
      descricao: formData.descricao,
      tenant_id: activeFarm.tenantId
    };

    if (selectedAccount) {
      const { error } = await supabase
        .from('contas_bancarias')
        .update(payload)
        .eq('id', selectedAccount.id);
      
      if (!error) {
        setIsModalOpen(false);
        fetchAccounts();
      }
    } else {
      const { error } = await supabase
        .from('contas_bancarias')
        .insert([payload]);

      if (!error) {
        setIsModalOpen(false);
        fetchAccounts();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    const { error } = await supabase.from('contas_bancarias').delete().eq('id', id);
    if (!error) fetchAccounts();
  };

  const handleViewStatement = async (acc: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    
    const { data } = await supabase
      .from('extrato_transacoes')
      .select('*')
      .eq('conta_id', acc.id)
      .order('data', { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      setHistoryItems(data.map(t => ({
        id: t.id,
        date: t.data,
        title: t.descricao,
        subtitle: t.tipo === 'CREDITO' ? 'Fluxo Entrante' : 'Fluxo Outgoing',
        value: Number(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        status: t.tipo === 'CREDITO' ? 'success' : 'warning'
      })));
    } else {
      setHistoryItems([
        { id: '1', date: new Date().toISOString(), title: 'Saldo Inicial Consolidação', subtitle: 'Ponto de equilíbrio', value: Number(acc.saldo_atual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: 'success' },
      ]);
    }
    setHistoryLoading(false);
  };

  const tableColumns = [
    {
      header: 'Banco / Instituição',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">{item.banco}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.tipo || 'CONTA CORRENTE'}
          </div>
        </div>
      )
    },
    {
      header: 'Agência / Conta',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <CreditCard size={14} />
          <span>{item.agencia} / {item.conta}</span>
        </div>
      )
    },
    {
      header: 'Saldo Atual',
      accessor: (item: any) => (
        <span className="main-text font-bold" style={{ color: 'hsl(var(--brand))' }}>
          {Number(item.saldo_atual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
      align: 'right' as const
    }
  ];

  return (
    <div className="bank-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <ShieldCheck size={14} fill="currentColor" />
            <span>ELITE TREASURY v5.0</span>
          </div>
          <h1 className="page-title">Gestão de Tesouraria</h1>
          <p className="page-subtitle">Centralização de saldos bancários, monitoramento de custódia e controle de liquidez.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary">
            <Layout size={18} />
            CONCILIAÇÃO
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            NOVA CONTA
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={Wallet} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+1.5%"
            trend={stat.trend || 'up'}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'BALANCES' ? 'active' : ''}`}
            onClick={() => setActiveTab('BALANCES')}
          >
            Saldos Consolidados
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'CASHFLOW' ? 'active' : ''}`}
            onClick={() => setActiveTab('CASHFLOW')}
          >
            Fluxo de Caixa
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Pesquisar por banco, agência ou conta..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-filter-group">
          <button className="icon-btn-secondary" title="Filtros Avançados">
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Extrato">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        <ModernTable 
          data={accounts.filter(acc => {
            const matchesSearch = (acc.banco || '').toLowerCase().includes(searchTerm.toLowerCase()) || (acc.conta || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'BALANCES' ? true : acc.status === 'cashflow';
            return matchesSearch && matchesTab;
          })}
          columns={tableColumns}
          loading={loading}
          hideHeader={true}
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" onClick={() => handleViewStatement(item)} title="Extrato">
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
      </div>

      <BankAccountForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedAccount}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê Financeiro"
        subtitle="Rastreabilidade de saldos e movimentações bancárias"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
