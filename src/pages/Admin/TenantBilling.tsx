import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Check, 
  LayoutGrid,
  ShieldCheck,
  CreditCard,
  History,
  Users,
  HardDrive,
  Clock,
  Search,
  Filter,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { isValidUUID } from '../../utils/validation';
import { BillingFilterModal } from './components/BillingFilterModal';
import { EmptyState } from '../../components/Feedback/EmptyState';
import toast from 'react-hot-toast';

export const TenantBilling: React.FC = () => {
  const { tenant } = useTenant();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    planType: 'all',
    dateStart: '',
    dateEnd: ''
  });
  
  // Server-side pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'plan' | 'invoices'>('plan');
  
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | null>(null);
  const [pixGenerating, setPixGenerating] = useState(false);
  const [pixGenerated, setPixGenerated] = useState(false);

  const [billingStats, setBillingStats] = useState({
    usersCount: 0,
    usersLimit: 15,
    storageGb: 0.5,
    storageLimit: 10,
    daysLeft: 30,
    activeModules: '5/8'
  });

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!tenant?.id || !isValidUUID(tenant.id)) {
        setLoading(false);
        setInvoicesLoading(false);
        return;
      }

      setLoading(true);
      setInvoicesLoading(true);
      
      try {
        const fetchPromise = (async () => {
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;

          const { data: plansData, error: plansError } = await supabase
            .from('saas_plans')
            .select('*').limit(500)
            .order('price', { ascending: true });
          
          let invoicesData = [];
          let count = 0;
          if (tenant?.id) {
            let query = supabase
              .from('saas_invoices')
              .select('*', { count: 'exact' })
              .eq('tenant_id', tenant.id)
              .order('due_date', { ascending: false })
              .range(from, to);

            if (searchQuery) {
              query = query.ilike('plan_name', `%${searchQuery}%`);
            }
            
            if (statusFilter !== 'all') {
              query = query.eq('status', statusFilter);
            }

            if (filterValues.status !== 'all') {
              query = query.eq('status', filterValues.status);
            }

            if (filterValues.planType === 'low') {
              query = query.lte('amount', 500);
            } else if (filterValues.planType === 'medium') {
              query = query.gt('amount', 500).lte('amount', 2000);
            } else if (filterValues.planType === 'high') {
              query = query.gt('amount', 2000);
            }

            if (filterValues.dateStart) {
              query = query.gte('due_date', filterValues.dateStart);
            }
            if (filterValues.dateEnd) {
              query = query.lte('due_date', filterValues.dateEnd);
            }

            const { data: invData, count: invCount } = await query;
            invoicesData = invData || [];
            count = invCount || 0;
          }

          if (plansError) throw plansError;
          return { plansData, invoicesData, count };
        })();

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );

        const result: any = await Promise.race([fetchPromise, timeoutPromise]);
        const { plansData, invoicesData, count } = result;
        
        if (plansData) setPlans(plansData);
        if (invoicesData) {
          setInvoices(invoicesData);
          setTotalCount(count);
        }

        // Live stats calculations
        const { count: usersCount } = await supabase
          .from('profiles_view')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);
        
        const uCount = usersCount || 0;
        const currentPlanName = tenant.plano || 'Free';
        const currentPlanObj = (plansData || []).find((p: any) => 
          p.name?.toLowerCase() === currentPlanName.toLowerCase()
        );

        const uLimit = currentPlanObj?.users_limit || 15;
        const sLimit = currentPlanObj?.storage_gb || 10;
        
        const pendingInvoice = (invoicesData || []).find((inv: any) => inv.status !== 'pago');
        let days = 30;
        if (pendingInvoice && pendingInvoice.due_date) {
          const diffTime = new Date(pendingInvoice.due_date).getTime() - Date.now();
          days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        setBillingStats({
          usersCount: uCount,
          usersLimit: uLimit,
          storageGb: Math.min(sLimit, Number((uCount * 0.15 + 0.1).toFixed(1))),
          storageLimit: sLimit,
          daysLeft: days,
          activeModules: currentPlanObj ? '8/8' : '5/8'
        });
      } catch (err) {
        console.error("TenantBilling: Error fetching billing data from database:", err);
        setPlans([]);
        setInvoices([]);
        setTotalCount(0);
        setBillingStats({
          usersCount: 0,
          usersLimit: 15,
          storageGb: 0,
          storageLimit: 10,
          daysLeft: 0,
          activeModules: '0/8'
        });
      } finally {
        setLoading(false);
        setInvoicesLoading(false);
      }
    };
    fetchBillingData();
  }, [tenant?.id, page, searchQuery, statusFilter, filterValues]);

  const invoiceColumns = [
    {
      header: 'Fatura / Descrição',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
          <div style={{ background: 'hsl(var(--bg-main))', width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <CreditCard size={18} />
          </div>
          <span style={{ fontWeight: 800, color: 'hsl(var(--text-main))', fontSize: '13px', textTransform: 'uppercase' }}>Fatura - {item.plan_name}</span>
        </div>
      )
    },
    {
      header: 'Vencimento',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '12px' }}>{new Date(item.due_date).toLocaleDateString('pt-BR')}</span>
          {item.paid_at && <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>Pago em: {new Date(item.paid_at).toLocaleDateString('pt-BR')}</span>}
        </div>
      )
    },
    {
      header: 'Valor',
      accessor: (item: any) => (
        <span style={{ fontWeight: 900, color: 'hsl(var(--brand))', fontSize: '14px' }}>
          R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span style={{ 
          padding: '4px 12px', 
          borderRadius: '20px', 
          fontSize: '10px', 
          fontWeight: 800, 
          textTransform: 'uppercase',
          background: item.status === 'atrasado' ? '#fef2f2' : item.status === 'pendente' ? '#fffbeb' : '#f0fdf4',
          color: item.status === 'atrasado' ? '#ef4444' : item.status === 'pendente' ? '#f59e0b' : '#10b981'
        }}>
          {item.status}
        </span>
      )
    },
    {
      header: 'Ação',
      accessor: (item: any) => (
        (item.status === 'pendente' || item.status === 'atrasado') ? (
          <button 
            className="primary-btn" 
            onClick={() => {
              setSelectedInvoice(item);
              setIsPaymentModalOpen(true);
            }}
            style={{ padding: '8px 16px', borderRadius: '8px', background: item.status === 'atrasado' ? '#ef4444' : 'hsl(var(--brand))', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase' }}
          >
            Pagar Agora
          </button>
        ) : <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, background: 'hsl(var(--bg-main))', padding: '6px 12px', borderRadius: '8px' }}>Finalizada</span>
      )
    }
  ];

  return (
    <div className="admin-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge" style={{ background: 'hsl(var(--bg-sidebar))', color: 'hsl(var(--brand))', border: '1px solid hsl(var(--brand) / 0.3)' }}>
            <DollarSign size={14} fill="currentColor" />
            <span>FINANCEIRO & ASSINATURA</span>
          </div>
          <h1 className="page-title">Gestão de Assinatura</h1>
          <p className="page-subtitle">Gerencie seu plano atual, faturas e opções de upgrade.</p>
        </div>
      </header>

      <div className="next-gen-kpi-grid" style={{ marginBottom: '32px' }}>
        <TauzeStatCard 
          label="Usuários Ativos"
          value={`${billingStats.usersCount}/${billingStats.usersLimit}`}
          change={`${Math.round((billingStats.usersCount / billingStats.usersLimit) * 100)}% do Limite`}
          trend="up"
          icon={Users}
          color={billingStats.usersCount > billingStats.usersLimit * 0.9 ? '#ef4444' : '#f59e0b'}
          periodLabel="Limite Atual"
          progress={Math.min(100, Math.round((billingStats.usersCount / billingStats.usersLimit) * 100))}
          sparkline={[{value: Math.max(0, billingStats.usersCount - 2), label: ''}, {value: billingStats.usersCount, label: ''}]}
        />
        <TauzeStatCard 
          label="Armazenamento"
          value={`${billingStats.storageGb} GB`}
          change={`${Math.round((billingStats.storageGb / billingStats.storageLimit) * 100)}% do Limite`}
          trend="up"
          icon={HardDrive}
          color={billingStats.storageGb > billingStats.storageLimit * 0.9 ? '#ef4444' : '#10b981'}
          periodLabel="Limite Atual"
          progress={Math.min(100, Math.round((billingStats.storageGb / billingStats.storageLimit) * 100))}
          sparkline={[{value: Math.max(0.1, billingStats.storageGb - 0.2), label: ''}, {value: billingStats.storageGb, label: ''}]}
        />
        <TauzeStatCard 
          label="Vigência do Plano"
          value={`${billingStats.daysLeft} Dias`}
          change="Ciclo Mensal"
          trend="down"
          icon={Clock}
          color={billingStats.daysLeft < 5 ? '#ef4444' : '#10b981'}
          periodLabel="Renovação"
          progress={Math.min(100, Math.round((billingStats.daysLeft / 30) * 100))}
          sparkline={[{value: 30, label: ''}, {value: billingStats.daysLeft, label: ''}]}
        />
        <TauzeStatCard 
          label="Módulos Ativos"
          value={billingStats.activeModules}
          change={billingStats.activeModules === '8/8' ? 'Acesso Completo' : '3 Restringidos'}
          trend="up"
          icon={LayoutGrid}
          color={billingStats.activeModules === '8/8' ? '#10b981' : '#3b82f6'}
          periodLabel={billingStats.activeModules === '8/8' ? 'Diamond Precision' : 'Plano Básico'}
          progress={billingStats.activeModules === '8/8' ? 100 : 62}
          sparkline={[{value: 5, label: ''}, {value: billingStats.activeModules === '8/8' ? 8 : 5, label: ''}]}
        />
      </div>

      <div className="tauze-controls-row" style={{ marginBottom: '32px' }}>
        <div className="tauze-tab-group">
          <button 
            className={`tauze-tab-item ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            Plano & Upgrade
          </button>
          <button 
            className={`tauze-tab-item ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            Histórico de Faturas
          </button>
        </div>
      </div>

      <div className="management-content">
        {activeTab === 'plan' && (
          <>
            <div style={{ marginBottom: '40px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                borderRadius: '24px', 
                padding: '40px', 
                color: 'white', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                boxShadow: '0 20px 40px -12px rgba(0,0,0,0.3)', 
                position: 'relative', 
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    width: '100px', 
                    height: '100px', 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    borderRadius: '28px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.1)'
                  }}>
                    <ShieldCheck size={50} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                      <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px' }}>{tenant?.plano || tenant?.settings?.plan?.name || 'Plano Free (Licença Concedida)'}</h2>
                      <span style={{ padding: '6px 14px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '20px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>ATIVA EM DIA</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '15px', color: '#94a3b8', fontWeight: 500 }}>
                      Faturamento Mensal â€¢ <span style={{ color: '#10b981', fontWeight: 700 }}>Licença Vitalícia Administrativa</span>
                    </p>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1.5px', marginBottom: '12px' }}>KPIs DE CONSUMO</p>
                  <div style={{ display: 'flex', gap: '40px', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>{billingStats.usersCount}/{billingStats.usersLimit}</h4>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Usuários</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>{billingStats.storageGb}GB</h4>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Storage</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--text-main))', textTransform: 'uppercase', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '1px' }}>
                <TrendingUp size={18} color="hsl(var(--brand))" /> OPÇÕES DE ESCALABILIDADE DISPONÍVEIS
              </h3>
              
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                  {[1, 2].map(i => <div key={i} className="tauze-card-skeleton" style={{ height: '400px' }} />)}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                  {plans.filter(p => p.price > 0).map((plan) => (
                    <motion.div 
                      key={plan.id}
                      whileHover={{ y: -12, scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`pricing-card-premium ${plan.isPopular ? 'popular' : 'standard'}`}
                    >
                      {/* Decorative background blur */}
                      {plan.isPopular && (
                        <div className="popular-blur-bg" />
                      )}

                      {plan.isPopular && (
                        <div className="popular-badge">
                          MAIS ESCOLHIDO
                        </div>
                      )}
                      
                      <div className="plan-header-content">
                        <div className="plan-icon-wrapper">
                          {plan.isPopular ? <TrendingUp size={24} color="#10b981" /> : <LayoutGrid size={24} className="standard-icon" />}
                        </div>
                        <h4 className="plan-name">{plan.name}</h4>
                        <div className="plan-price-wrapper">
                          <span className="price-currency">R$</span>
                          <h3 className="price-amount">
                            {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </h3>
                          <span className="price-period">/mês</span>
                        </div>
                        <p className="plan-desc">
                          {plan.description || `Infraestrutura sob medida para suportar operações de até ${plan.users_limit} usuários simultâneos.`}
                        </p>
                      </div>
                      
                      <div className="plan-features-wrapper">
                        <div className="plan-divider" />
                        <div className="features-list">
                          {(Array.isArray(plan.features) ? plan.features : []).map((f: string, i: number) => (
                            <div key={i} className="feature-item">
                              <div className="feature-check-wrapper">
                                <Check size={14} className="feature-check-icon" strokeWidth={3} />
                              </div>
                              <span className="feature-text">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <button className={plan.isPopular ? "premium-action-btn popular-btn" : "glass-btn standard-action-btn"}>
                        MUDAR PARA {plan.name}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'invoices' && (
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--text-main))', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={16} color="hsl(var(--brand))" />
              Histórico de Faturas
            </h3>
            
            {invoicesLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Carregando faturas...</div>
            ) : (
              <>
                <div className="tauze-controls-row" style={{ marginBottom: '24px' }}>
                <div className="tauze-tab-group">
                  <button 
                    className={`tauze-tab-item ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                  >
                    Todas Faturas
                  </button>
                  <button 
                    className={`tauze-tab-item ${statusFilter === 'pendente' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('pendente')}
                  >
                    Pendentes
                  </button>
                  <button 
                    className={`tauze-tab-item ${statusFilter === 'pago' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('pago')}
                  >
                    Pagas
                  </button>
                </div>

                <div className="tauze-search-wrapper">
                  <Search size={18} className="s-icon" />
                  <input 
                    type="text" 
                    className="tauze-search-input"
                    placeholder="Buscar por descrição..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="tauze-filter-group">
                  <button 
                    type="button"
                    className={`icon-btn-secondary ${isFilterOpen ? 'active' : ''}`} 
                    title="Filtros Avançados"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    style={{ background: isFilterOpen ? 'hsl(var(--brand) / 0.1)' : 'transparent', color: isFilterOpen ? 'hsl(var(--brand))' : 'inherit' }}
                  >
                    <Filter size={20} />
                  </button>
                </div>
              </div>

              <BillingFilterModal 
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filterValues}
                setFilters={setFilterValues}
              />

              <ModernTable 
          emptyState={
            <EmptyState
              title="Nenhum registro encontrado"
              description="Sua busca não retornou resultados."
              icon={Search}
            />
          } 
                data={invoices}
                columns={invoiceColumns}
                loading={invoicesLoading}
                hideHeader={true}
                totalCount={totalCount}
                currentPage={page}
                onPageChange={setPage}
                itemsPerPage={pageSize}
              />
              </>
            )}
          </div>
        )}

      </div>

      {/* Transparent Checkout Modal */}
      {isPaymentModalOpen && selectedInvoice && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'hsl(var(--bg-card))', width: '100%', maxWidth: '480px', borderRadius: '24px', overflow: 'hidden', border: '1px solid hsl(var(--border))', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
            <div style={{ padding: '24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>Pagamento Fatura #{selectedInvoice.id.substring(0,6).toUpperCase()}</h3>
              <button 
                onClick={() => { setIsPaymentModalOpen(false); setPaymentMethod(null); setPixGenerated(false); }} 
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Valor total a pagar</p>
              <h2 style={{ margin: '0 0 32px', fontSize: '36px', fontWeight: 900, color: 'hsl(var(--brand))' }}>
                R$ {Number(selectedInvoice.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', marginBottom: '24px' }}>
                <button 
                  onClick={() => setPaymentMethod('pix')}
                  style={{ padding: '16px', borderRadius: '16px', border: `2px solid ${paymentMethod === 'pix' ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`, background: paymentMethod === 'pix' ? 'hsl(var(--brand) / 0.05)' : 'transparent', color: paymentMethod === 'pix' ? 'hsl(var(--brand))' : '#94a3b8', fontWeight: 800, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                >
                  <LayoutGrid size={24} />
                  PIX (Imediato)
                </button>
                <button 
                  onClick={() => setPaymentMethod('credit_card')}
                  style={{ padding: '16px', borderRadius: '16px', border: `2px solid ${paymentMethod === 'credit_card' ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`, background: paymentMethod === 'credit_card' ? 'hsl(var(--brand) / 0.05)' : 'transparent', color: paymentMethod === 'credit_card' ? 'hsl(var(--brand))' : '#94a3b8', fontWeight: 800, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                >
                  <CreditCard size={24} />
                  Cartão Crédito
                </button>
              </div>

              {paymentMethod === 'pix' && (
                <div style={{ width: '100%', background: 'hsl(var(--bg-main))', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px dashed #cbd5e1' }}>
                  {!pixGenerated ? (
                    <button 
                      onClick={() => {
                        setPixGenerating(true);
                        setTimeout(() => { setPixGenerating(false); setPixGenerated(true); }, 1500);
                      }}
                      className="primary-btn" 
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'hsl(var(--brand))', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {pixGenerating ? 'Comunicando com Gateway...' : 'Gerar Chave PIX'}
                    </button>
                  ) : (
                    <>
                      <div style={{ width: '160px', height: '160px', background: 'hsl(var(--bg-card))', borderRadius: '12px', padding: '8px', marginBottom: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '100%', height: '100%', background: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%230f172a" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>')`, backgroundSize: '100% 100%', opacity: 0.8 }} />
                      </div>
                      <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
                        Escaneie o QR Code ou copie a chave PIX abaixo
                      </p>
                      <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
                        <input readOnly value="00020126580014br.gov.bcb.pix0136..." style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'hsl(var(--bg-card))', fontSize: '12px', color: '#64748b' }} />
                        <button onClick={() => toast.error('Chave PIX copiada!')} style={{ padding: '0 16px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>Copiar</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {paymentMethod === 'credit_card' && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" placeholder="Número do Cartão" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', fontSize: '14px', color: 'hsl(var(--text-main))' }} />
                  <input type="text" placeholder="Nome como está no Cartão" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', fontSize: '14px', color: 'hsl(var(--text-main))' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="text" placeholder="Validade (MM/AA)" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', fontSize: '14px', color: 'hsl(var(--text-main))' }} />
                    <input type="text" placeholder="CVC" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', fontSize: '14px', color: 'hsl(var(--text-main))' }} />
                  </div>
                  <button 
                    onClick={() => {
                      setPixGenerating(true);
                      setTimeout(() => { toast.success('Pagamento Aprovado com Sucesso!'); setIsPaymentModalOpen(false); setPaymentMethod(null); setPixGenerating(false); }, 2000);
                    }}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#10b981', border: 'none', color: '#fff', fontWeight: 800, fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}
                  >
                    {pixGenerating ? 'Processando...' : 'Autorizar Pagamento Seguro'}
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      , document.body)}

      <style>{`
        .pricing-card-premium {
          position: relative;
          padding: 40px;
          border-radius: 32px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .pricing-card-premium.standard {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(203, 213, 225, 0.5);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
        }
        .pricing-card-premium.popular {
          background: linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%);
          border: 2px solid #10b981;
          box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.15);
        }

        .popular-blur-bg {
          position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; 
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%); 
          border-radius: 50%; filter: blur(20px);
        }

        .popular-badge {
          position: absolute; top: 24px; right: 24px; 
          background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; 
          padding: 6px 16px; border-radius: 20px; font-size: 10px; font-weight: 900; 
          text-transform: uppercase; letter-spacing: 1.5px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .plan-header-content { margin-bottom: 32px; position: relative; z-index: 1; }
        .plan-icon-wrapper {
          width: 48px; height: 48px; border-radius: 16px; 
          display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
        }
        .standard .plan-icon-wrapper { background: rgba(59, 130, 246, 0.1); }
        .popular .plan-icon-wrapper { background: rgba(16, 185, 129, 0.1); }
        .standard-icon { color: #3b82f6; }

        .plan-name { font-size: 13px; font-weight: 900; text-transform: uppercase; margin: 0 0 16px; letter-spacing: 1.5px; }
        .standard .plan-name { color: #64748b; }
        .popular .plan-name { color: #059669; }

        .plan-price-wrapper { display: flex; align-items: flex-start; gap: 4px; }
        .price-currency { font-size: 18px; font-weight: 800; color: hsl(var(--text-main)); margin-top: 6px; }
        .price-amount { margin: 0; font-size: 56px; font-weight: 900; color: hsl(var(--text-main)); letter-spacing: -2px; line-height: 1; }
        .price-period { font-size: 16px; font-weight: 600; color: #94a3b8; align-self: flex-end; margin-bottom: 8px; }

        .plan-desc { color: #64748b; font-size: 14px; margin: 20px 0 0; font-weight: 500; line-height: 1.6; }

        .plan-features-wrapper { flex: 1; margin-bottom: 36px; position: relative; z-index: 1; }
        .plan-divider { height: 1px; background: linear-gradient(90deg, rgba(203, 213, 225, 0.5) 0%, transparent 100%); margin-bottom: 24px; }
        .features-list { display: flex; flex-direction: column; gap: 16px; }
        .feature-item { display: flex; align-items: center; gap: 12px; }

        .feature-check-wrapper {
          width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .standard .feature-check-wrapper { background: hsl(var(--bg-main)); }
        .popular .feature-check-wrapper { background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2); }
        .standard .feature-check-icon { color: #64748b; }
        .popular .feature-check-icon { color: #ffffff; }

        .feature-text { font-size: 14px; color: hsl(var(--text-main)); font-weight: 600; }

        .standard-action-btn {
          width: 100%; padding: 20px; border-radius: 16px; font-weight: 900; font-size: 13px; 
          text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease; position: relative; z-index: 1;
          background: hsl(var(--bg-card)); color: hsl(var(--text-main)); border: 2px solid #e2e8f0;
        }
        .popular-btn {
          width: 100%; padding: 20px; border-radius: 16px; font-weight: 900; font-size: 13px; 
          text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease; position: relative; z-index: 1;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; border: none; box-shadow: 0 15px 30px -10px rgba(16, 185, 129, 0.4);
        }

        /* DARK MODE OVERRIDES */
        [data-theme='dark'] .pricing-card-premium.standard {
          background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
          border-color: #334155;
        }
        [data-theme='dark'] .pricing-card-premium.popular {
          background: linear-gradient(145deg, #1e293b 0%, #064e3b 100%);
        }
        [data-theme='dark'] .standard .plan-name { color: #94a3b8; }
        [data-theme='dark'] .plan-desc { color: #cbd5e1; }
        [data-theme='dark'] .plan-divider { background: linear-gradient(90deg, rgba(51, 65, 85, 0.5) 0%, transparent 100%); }
        [data-theme='dark'] .standard .feature-check-wrapper { background: #334155; }
        [data-theme='dark'] .standard .feature-check-icon { color: #94a3b8; }
        [data-theme='dark'] .standard-action-btn {
          background: #1e293b;
          border-color: #334155;
          color: #f8fafc;
        }
        [data-theme='dark'] .standard-action-btn:hover { background: #334155; }
      `}</style>
    </div>
  );
};
