import React, { useState, useEffect } from 'react';

function buildSparkline(records: any[], dateField: string, valueField: string | null, buckets = 7): { value: number; label: string }[] {
  if (!records || records.length === 0) return [];
  const sorted = [...records].filter(r => r[dateField]).sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) return [];
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter(r => { const t = new Date(r[dateField]).getTime(); return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd; });
    const v = inBucket.length === 0 ? 0 : valueField ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0) : inBucket.length;
    return { value: Number(v.toFixed(2)), label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
  });
}
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
  Building,
  LayoutGrid,
  List as ListIcon,
  Clock,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { BankAccountForm } from '../../components/Forms/BankAccountForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { BankAccountFilterModal } from './components/BankAccountFilterModal';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { isValidUUID } from '../../utils/validation';
import { useViewMode } from '../../hooks/useViewMode';

import { useTenant } from '../../contexts/TenantContext';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

export const BankAccounts: React.FC = () => {
  const { activeFarm, isGlobalMode, activeFarmId, activeTenantId, applyFarmFilter, canCreate, insertPayload } = useFarmFilter();
  const { activeCompany, companies } = useTenant();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'BALANCES' | 'CASHFLOW'>('BALANCES');
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewMode, setViewMode] = useViewMode('finance-bank-accounts', 'grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({
    type: 'all',
    balanceStatus: 'all',
    institution: 'all'
  });

  const [stats, setStats] = useState<any[]>([
    { label: 'Liquidez Disponível', value: '---', icon: Wallet, color: '#10b981', progress: 0, sparkline: buildSparkline([] || [], 'created_at', 'saldo_atual') },
    { label: 'Utilização de Limites', value: '---', icon: CreditCard, color: '#ef4444', progress: 0, sparkline: buildSparkline([] || [], 'created_at', 'saldo_atual') },
    { label: 'Custódia Bancária', value: '---', icon: Building, color: '#3b82f6', progress: 0, sparkline: buildSparkline([] || [], 'created_at', 'saldo_atual') },
    { label: 'Yield Estratégico', value: '---', icon: TrendingUp, color: '#f59e0b', progress: 0, sparkline: buildSparkline([] || [], 'created_at', 'saldo_atual') },
  ]);

  useEffect(() => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarm;
    if (isReady) {
      fetchAccounts();
    } else {
      setLoading(false);
    }
  }, [activeFarm, isGlobalMode, activeTenantId]);

  const fetchAccounts = async () => {
    const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;
    if (!isReady) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const fetchPromise = (async () => {
        let query = supabase
          .from('contas_bancarias')
          .select('*').limit(500)
          .order('banco', { ascending: true })
          .eq('tenant_id', activeTenantId);
        
        if (!isGlobalMode && activeCompany?.id) {
          query = query.or(`unidade_id.eq.${activeCompany.id},is_global.eq.true`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      })();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );

      const data: any = await Promise.race([fetchPromise, timeoutPromise]);
      
      const [] = data || [];
      setAccounts([]);

      const totalSaldos = [].reduce((acc: number, curr: any) => acc + Number(curr.saldo_atual || 0), 0);
      const totalLimites = [].reduce((acc: number, curr: any) => acc + Number(curr.limite_credito || 0), 0);
      const liquidezTotal = totalSaldos + totalLimites;
      
      setStats([
        { 
          label: 'Liquidez Disponível', 
          value: liquidezTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
          icon: Wallet, color: '#10b981', progress: 100, change: 'Saldos + Limites', periodLabel: 'Real-Time',
          sparkline: buildSparkline([] || [], 'created_at', 'saldo_atual')
        },
        { 
          label: 'Utilização de Limites', 
          value: totalLimites > 0 ? `${((Math.abs(Math.min(0, totalSaldos)) / totalLimites) * 100).toFixed(1)}%` : '---', 
          icon: CreditCard, color: '#ef4444', 
          progress: totalLimites > 0 ? (Math.abs(Math.min(0, totalSaldos)) / totalLimites) * 100 : 0,
          change: totalLimites > 0 ? totalLimites.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sem limites cadastrados', periodLabel: 'Crédito Tomado',
          sparkline: buildSparkline([] || [], 'created_at', 'saldo_atual')
        },
        { 
          label: 'Custódia Bancária', value: [].length > 0 ? [].length : '---', icon: Building, color: '#3b82f6', 
          progress: [].length > 0 ? 100 : 0, 
          change: [].length > 0 ? 'Instituições' : 'Sem contas', periodLabel: 'Pontos de Contato',
          sparkline: buildSparkline([] || [], 'created_at', 'saldo_atual')
        },
        { 
          label: 'Benchmark Médio', 
          value: (() => {
            const withBenchmark = [].filter((a: any) => a.benchmark_rendimento);
            if (withBenchmark.length === 0) return '---';
            const avg = withBenchmark.reduce((acc: number, a: any) => acc + Number(a.benchmark_rendimento || 0), 0) / withBenchmark.length;
            return avg > 0 ? `${avg.toFixed(2)}%` : '---';
          })(),
          icon: TrendingUp, color: '#f59e0b', 
          progress: (() => {
            const withBenchmark = [].filter((a: any) => a.benchmark_rendimento);
            if (withBenchmark.length === 0) return 0;
            const avg = withBenchmark.reduce((acc: number, a: any) => acc + Number(a.benchmark_rendimento || 0), 0) / withBenchmark.length;
            return Math.min(100, avg * 10);
          })(),
          trend: 'up' as const, 
          change: [].filter((a: any) => a.benchmark_rendimento).length > 0 ? 'Rendimento cadastrado' : 'Sem benchmark', 
          periodLabel: 'Rendimento Médio',
          sparkline: buildSparkline([] || [], 'created_at', 'saldo_atual')
        },
      ]);
    } catch (err) {
      setAccounts([]);
      setStats([
        { label: 'Liquidez Disponível', value: '---', icon: Wallet, color: '#10b981', progress: 0, change: 'Erro de Conexão', periodLabel: 'Modo Real', sparkline: [] },
        { label: 'Utilização de Limites', value: '---', icon: CreditCard, color: '#ef4444', progress: 0, change: 'Erro de Conexão', periodLabel: 'Crédito Tomado', sparkline: [] },
        { label: 'Custódia Bancária', value: '---', icon: Building, color: '#3b82f6', progress: 0, change: 'Erro de Conexão', periodLabel: 'Pontos de Contato', sparkline: [] },
        { label: 'Yield Estratégico', value: '---', icon: TrendingUp, color: '#f59e0b', progress: 0, trend: 'up' as const, change: 'Erro de Conexão', periodLabel: 'Rendimento Médio', sparkline: [] },
      ]);
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
    if (!activeTenantId) { if (typeof setLoading !== 'undefined') setLoading(false); return; }

    const payload = {
      banco: formData.banco,
      agencia: formData.agencia,
      conta: formData.conta,
      tipo: formData.tipo,
      saldo_atual: parseFloat(formData.saldo_inicial),
      limite_credito: parseFloat(formData.limite_credito || '0'),
      benchmark_rendimento: formData.benchmark_rendimento,
      descricao: formData.descricao,
      tenant_id: activeTenantId,
      unidade_id: formData.is_global ? null : (formData.unidade_id || activeCompany?.id || null),
      is_global: formData.is_global || false
    };

    const saveToSupabase = async (payloadToSave: any) => {
      if (selectedAccount) {
        return await supabase
          .from('contas_bancarias')
          .update(payloadToSave)
          .eq('id', selectedAccount.id);
      } else {
        return await supabase
          .from('contas_bancarias')
          .insert([payloadToSave]);
      }
    };

    let result = await saveToSupabase(payload);
    
    // Compatibility Fallback: If columns don't exist in DB, retry with basic payload
    if (result.error && (result.error.message.includes('column') || result.error.code === '42703')) {
      console.warn('Advanced columns not found, falling back to basic payload');
      const basicPayload = {
        banco: formData.banco,
        agencia: formData.agencia,
        conta: formData.conta,
        tipo: formData.tipo,
        saldo_atual: parseFloat(formData.saldo_inicial),
        descricao: formData.descricao,
        tenant_id: activeTenantId
      };
      result = await saveToSupabase(basicPayload);
    }

    if (!result.error) {
      setIsModalOpen(false);
      fetchAccounts();
    } else {
      alert('Erro ao salvar conta: ' + result.error.message);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData = accounts.filter(acc => {
      const matchesSearch = (acc.banco || '').toLowerCase().includes(searchTerm.toLowerCase()) || (acc.conta || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'BALANCES' ? true : (acc.saldo_atual > 0);
      const matchesType = filterValues.type === 'all' || acc.tipo === filterValues.type;
      const matchesBalance = filterValues.balanceStatus === 'all' || 
                            (filterValues.balanceStatus === 'positive' ? acc.saldo_atual >= 0 : acc.saldo_atual < 0);
      const matchesInst = filterValues.institution === 'all' || (acc.banco || '').toLowerCase().includes(filterValues.institution.toLowerCase());
      return matchesSearch && matchesTab && matchesType && matchesBalance && matchesInst;
    });

    const exportData = filteredData.map(item => ({
      Banco: item.banco,
      Agencia: item.agencia,
      Conta: item.conta,
      Tipo: item.tipo || 'CONTA CORRENTE',
      Saldo: item.saldo_atual || 0,
      Limite: item.limite_credito || 0,
      Descricao: item.descricao || '-'
    }));

    if (format === 'csv') exportToCSV(exportData, 'contas_bancarias');
    else if (format === 'excel') exportToExcel(exportData, 'contas_bancarias');
    else if (format === 'pdf') exportToPDF(exportData, 'contas_bancarias', 'Relatório de Tesouraria - Contas Bancárias');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    const { error } = await supabase.from('contas_bancarias').delete().eq('id', id);
    if (!error) fetchAccounts();
  };

  const handleViewStatement = async (acc: any) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('extrato_transacoes')
        .select('*')
        .eq('conta_id', acc.id)
        .order('data', { ascending: false })
        .limit(10);

      if (error) throw error;

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
          { id: '11111111-1111-1111-1111-111111111111', date: new Date().toISOString(), title: 'Saldo Inicial Consolidação', subtitle: 'Ponto de equilíbrio', value: Number(acc.saldo_atual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: 'success' },
        ]);
      }
    } catch (err) {
      console.warn('Could not fetch real statement, using initial balance fallback:', err);
      setHistoryItems([
        { id: '1', date: new Date().toISOString(), title: 'Saldo Inicial Consolidação', subtitle: 'Ponto de equilíbrio', value: Number(acc.saldo_atual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: 'success' },
      ]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const tableColumns = [
    {
      header: 'Banco / Instituição',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span className="main-text" style={{ fontWeight: 800, color: '#1e293b' }}>{item.banco}</span>
          <span className="sub-meta" style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>
            ID: {item.id?.slice(0, 8).toUpperCase() || 'N/A'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Agência & Conta',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            Cc: {item.conta}
          </span>
          <span className="sub-meta" style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
            Ag: {item.agencia}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Tipo de Conta',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
            {item.tipo || 'Corrente'}
          </span>
          <span style={{ 
            fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
            background: item.is_global ? 'hsl(var(--brand) / 0.1)' : 'hsl(var(--text-muted) / 0.1)', 
            color: item.is_global ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))'
          }}>
            {item.is_global ? 'USO GLOBAL' : (companies.find((c: any) => c.id === item.unidade_id)?.name || 'NÃO VINCULADO')}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Limite Crédito',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
            {Number(item.limite_credito || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      ),
      align: 'center' as const
    },
    {
      header: 'Uso do Limite',
      accessor: (item: any) => {
        const utilPercent = item.saldo_atual < 0 && item.limite_credito > 0 
          ? Math.min(100, (Math.abs(item.saldo_atual) / item.limite_credito) * 100) 
          : 0;
        
        return item.limite_credito > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: 900, color: '#64748b' }}>
              <span>OCUPAÇÃO</span>
              <span style={{ color: utilPercent > 80 ? '#f43f5e' : '#10b981' }}>{utilPercent.toFixed(0)}%</span>
            </div>
            <div style={{ height: '6px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  transition: 'width 0.5s', 
                  backgroundColor: utilPercent > 80 ? '#f43f5e' : '#10b981',
                  width: `${utilPercent}%` 
                }}
              />
            </div>
          </div>
        ) : (
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Sem Limite</span>
        );
      },
      align: 'center' as const
    },
    {
      header: 'Saldo Disponível',
      accessor: (item: any) => (
        <div style={{ width: '100%', textAlign: 'right', fontWeight: 900, color: item.saldo_atual >= 0 ? '#059669' : '#e11d48' }}>
          {Number(item.saldo_atual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      ),
      align: 'right' as const
    }
  ];

  return (
    <div className="bank-accounts-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Financeiro', href: '/financeiro/intelligence' }, { label: 'Gestão de Tesouraria' }]} />
          <h1 className="page-title">Gestão de Tesouraria</h1>
          <p className="page-subtitle" style={{ marginTop: '8px' }}>Centralização de saldos bancários, monitoramento de custódia e controle de liquidez.</p>
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
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={Wallet} color=""  periodLabel="Mês Atual" />)
        ) : (stats || []).map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change={stat.change || '---'}
            trend={stat.trend || 'up'}
            sparkline={stat.sparkline}
            periodLabel={stat.periodLabel}
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'BALANCES' ? 'active' : ''}`}
            onClick={() => setActiveTab('BALANCES')}
          >
            Saldos Consolidados
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'CASHFLOW' ? 'active' : ''}`}
            onClick={() => setActiveTab('CASHFLOW')}
          >
            Fluxo de Caixa
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Pesquisar por banco, agência ou conta..." 
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

         <div className="tauze-filter-group">
          <button 
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`} 
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={20} />
          </button>
          <div className="export-dropdown-container">
            <button 
              className="icon-btn-secondary" 
              title="Exportar"
              onClick={() => {
                const menu = document.getElementById('export-menu-bank');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-bank" className="export-menu">
              <button onClick={() => { handleExport('csv'); document.getElementById('export-menu-bank')?.classList.remove('active'); }}>Excel (.CSV)</button>
              <button onClick={() => { handleExport('excel'); document.getElementById('export-menu-bank')?.classList.remove('active'); }}>Excel (.xlsx)</button>
              <button onClick={() => { handleExport('pdf'); document.getElementById('export-menu-bank')?.classList.remove('active'); }}>PDF</button>
            </div>
          </div>
        </div>

        <BankAccountFilterModal 
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filters={filterValues}
          setFilters={setFilterValues}
        />
      </div>

      <div className="management-content">
        {viewMode === 'list' ? (
           <ModernTable 
            emptyState={
              accounts.length === 0 ? (
                <EmptyState
                  title="Nenhuma conta bancária"
                  description="Você ainda não possui contas bancárias cadastradas para esta unidade. Comece adicionando sua primeira conta para gerir a tesouraria."
                  actionLabel="Nova Conta"
                  onAction={handleOpenCreate}
                  icon={Building2}
                />
              ) : (
                <EmptyState
                  title="Nenhum registro encontrado"
                  description="Sua busca não retornou resultados."
                  icon={Search}
                />
              )
            }
            data={accounts.filter(acc => {
              const matchesSearch = (acc.banco || '').toLowerCase().includes(searchTerm.toLowerCase()) || (acc.conta || '').toLowerCase().includes(searchTerm.toLowerCase());
              const matchesTab = activeTab === 'BALANCES' ? true : (acc.saldo_atual > 0);
              
              const matchesType = filterValues.type === 'all' || acc.tipo === filterValues.type;
              const matchesBalance = filterValues.balanceStatus === 'all' || 
                                    (filterValues.balanceStatus === 'positive' ? acc.saldo_atual >= 0 : acc.saldo_atual < 0);
              const matchesInst = filterValues.institution === 'all' || (acc.banco || '').toLowerCase().includes(filterValues.institution.toLowerCase());

              return matchesSearch && matchesTab && matchesType && matchesBalance && matchesInst;
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
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="user-cards-grid"
          >
             {(() => {
                const filteredAccounts = accounts.filter(acc => {
                  const matchesSearch = (acc.banco || '').toLowerCase().includes(searchTerm.toLowerCase()) || (acc.conta || '').toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesTab = activeTab === 'BALANCES' ? true : (acc.saldo_atual > 0);
                  
                  const matchesType = filterValues.type === 'all' || acc.tipo === filterValues.type;
                  const matchesBalance = filterValues.balanceStatus === 'all' || 
                                        (filterValues.balanceStatus === 'positive' ? acc.saldo_atual >= 0 : acc.saldo_atual < 0);
                  const matchesInst = filterValues.institution === 'all' || (acc.banco || '').toLowerCase().includes(filterValues.institution.toLowerCase());

                  return matchesSearch && matchesTab && matchesType && matchesBalance && matchesInst;
                });

                if (filteredAccounts.length === 0) {
                  return (
                    <div 
                      className="user-card-premium"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '20px',
                        background: 'hsl(var(--bg-card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '24px',
                        gap: '6px',
                        minHeight: '180px',
                        height: '100%',
                        boxShadow: 'none'
                      }}
                    >
                      <div 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          background: 'rgba(16, 185, 129, 0.1)', 
                          color: '#10b981', 
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Building2 size={22} style={{ color: 'hsl(var(--brand))' }} />
                      </div>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--text-main))', margin: 0 }}>
                        Nenhuma conta bancária encontrada
                      </h3>
                      <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, lineHeight: '1.3', maxWidth: '260px' }}>
                        Não há contas que correspondam aos filtros atuais.
                      </p>
                      {!searchTerm && (
                        <button 
                          className="primary-btn" 
                          onClick={handleOpenCreate}
                          style={{ fontSize: '10.5px', padding: '6px 12px', height: '30px', marginTop: '4px', minHeight: 'auto' }}
                        >
                          <Plus size={12} />
                          <span>NOVA CONTA</span>
                        </button>
                      )}
                    </div>
                  );
                }

                return filteredAccounts.map(acc => (
                  <motion.div 
                    key={acc.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`user-card-premium active`}
                >
                  <div className="card-left-section">
                    <div className="card-avatar">
                      <Building2 size={32} />
                    </div>
                    <div className="card-bottom-actions">
                      <button className="action-icon-btn info" onClick={() => handleViewStatement(acc)} title="Extrato"><FileText size={14} /></button>
                      <button className="action-icon-btn edit" onClick={() => handleOpenEdit(acc)} title="Editar"><Edit3 size={14} /></button>
                      <button className="action-icon-btn delete" onClick={() => handleDelete(acc.id)} title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div className="card-main-content">
                    <div className="card-header-info">
                      <h3>{acc.banco}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        <span className="card-role-badge">{acc.tipo || 'CONTA CORRENTE'}</span>
                        <span className="card-role-badge" style={{ background: acc.is_global ? 'hsl(var(--brand) / 0.1)' : 'hsl(var(--text-muted) / 0.1)', color: acc.is_global ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))' }}>
                          {acc.is_global ? 'USO GLOBAL' : (companies.find((c: any) => c.id === acc.unidade_id)?.name || 'NÃO VINCULADO')}
                        </span>
                      </div>
                    </div>

                    <div className="card-meta-grid">
                      <div className="meta-item">
                        <Wallet size={14} className="meta-icon" />
                        <span style={{ fontWeight: 800, color: acc.saldo_atual >= 0 ? 'hsl(var(--brand))' : '#ef4444', fontSize: '14px' }}>
                          {Number(acc.saldo_atual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                      
                      {acc.limite_credito > 0 && (
                        <div className="limit-utilization-area">
                          <div className="limit-header">
                            <span>Uso do Limite</span>
                            <span>{acc.saldo_atual < 0 ? ((Math.abs(acc.saldo_atual) / acc.limite_credito) * 100).toFixed(0) : 0}%</span>
                          </div>
                          <div className="limit-bar-bg">
                            <div className="limit-bar-fill" style={{ width: `${acc.saldo_atual < 0 ? Math.min(100, (Math.abs(acc.saldo_atual) / acc.limite_credito) * 100) : 0}%`, background: '#ef4444' }} />
                          </div>
                        </div>
                      )}

                      <div className="meta-item">
                        <CreditCard size={14} className="meta-icon" />
                        <span>Ag: {acc.agencia} | Cc: {acc.conta}</span>
                      </div>
                    </div>
                    <div className="card-footer-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderTop: '1px dashed rgba(148, 163, 184, 0.15)', paddingTop: '6px', marginTop: '12px' }}>
                      <div className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
                        <Clock size={12} style={{ color: '#10b981' }} />
                        <span>Sincronizado via API â€¢ Hoje 08:30</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ));
            })()}
            <button className="add-account-card-premium" onClick={handleOpenCreate}>
              <Plus size={32} />
              <span>NOVA CONTA</span>
            </button>
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
          color: hsl(var(--brand));
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2);
        }

        .add-account-card-premium {
          border: 2px dashed #e2e8f0;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: transparent;
          cursor: pointer;
          color: #94a3b8;
          transition: 0.2s;
          min-height: 180px;
          height: 100%;
        }

        .add-account-card-premium:hover {
          border-color: #10b981;
          color: #10b981;
          background: rgba(16, 185, 129, 0.02);
        }

        .add-account-card-premium span { font-size: 11px; font-weight: 900; letter-spacing: 0.05em; }

        [data-theme='dark'] .add-account-card-premium {
          background: hsl(var(--bg-main)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--text-main)) !important;
        }

        .user-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 8px;
        }

        @media (max-width: 1400px) {
          .user-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 900px) {
          .user-cards-grid { grid-template-columns: 1fr; }
        }

        .user-card-premium {
          background: hsl(var(--bg-card));
          border-radius: 24px;
          border: 1px solid hsl(var(--border));
          display: flex;
          overflow: hidden;
          padding: 0;
          min-height: 180px;
          height: auto;
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

        .user-card-premium:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-lg);
          border-color: hsl(var(--brand) / 0.3);
        }

        .card-left-section {
          width: 130px;
          flex-shrink: 0;
          background: hsl(var(--bg-main) / 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid hsl(var(--border));
        }

        .card-avatar {
          width: 56px;
          height: 56px;
          background: hsl(var(--bg-main));
          color: hsl(var(--text-main));
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 8px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          border: 1px solid hsl(var(--border));
        }

        .card-main-content {
          flex: 1;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
        }

        .card-header-info h3 {
          font-size: 16px;
          font-weight: 900;
          color: hsl(var(--text-main));
          margin-bottom: 2px;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-role-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 800;
          color: hsl(var(--brand));
          background: hsl(var(--brand) / 0.1);
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-meta-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4px;
          margin-top: 6px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: hsl(var(--text-muted));
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meta-icon {
          color: hsl(var(--brand));
          flex-shrink: 0;
        }

        .limit-utilization-area {
          margin: 2px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .limit-header {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
        }

        .limit-bar-bg {
          height: 4px;
          background: hsl(var(--bg-main));
          border-radius: 100px;
          overflow: hidden;
        }

        .limit-bar-fill {
          height: 100%;
          border-radius: 100px;
          transition: 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-bottom-actions {
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          gap: 6px;
          width: 100%;
          margin-top: 8px;
        }

        .action-icon-btn {
          width: 32px;
          height: 32px;
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
          background: hsl(var(--brand));
          color: white;
          transform: scale(1.1);
          border-color: hsl(var(--brand));
        }

        .action-icon-btn.delete:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
        }
      `}</style>

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
