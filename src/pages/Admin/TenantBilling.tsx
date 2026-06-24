import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  X,
  Receipt,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { isValidUUID } from '../../utils/validation';
import { BillingFilterModal } from './components/BillingFilterModal';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { LoadingSkeleton } from '../../components/Feedback/LoadingSkeleton';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { usePersistentState } from '../../hooks/usePersistentState';
import { InvoiceReceiptModal } from './components/InvoiceReceiptModal';

import { EmbeddedCheckoutModal } from './components/EmbeddedCheckoutModal';
import { SAAS_MODULES } from '../../config/saasModules';

export const TenantBilling: React.FC = () => {
  const { tenant } = useTenant();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = usePersistentState('TenantBilling_isFilterOpen', false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  
  // Embedded Checkout State
  const [isEmbeddedCheckoutOpen, setIsEmbeddedCheckoutOpen] = useState(false);
  const [transparentData, setTransparentData] = useState<any>(null);
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    planType: 'all',
    dateStart: '',
    dateEnd: '',
  });

  // Server-side pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'plan' | 'addons' | 'invoices') || 'plan';
  const [addons, setAddons] = useState<any[]>([]);
  const [tenantAddons, setTenantAddons] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const setActiveTab = (tab: string) => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set('tab', tab);
        return n;
      },
      { replace: true }
    );
  };

  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const [billingStats, setBillingStats] = useState({
    usersCount: 0,
    usersLimit: 15,
    storageGb: 0.5,
    storageLimit: 10,
    daysLeft: 30,
    activeModules: '5/8',
  });

  const handlePayInvoice = async (item: any) => {
    // Para simplificar a POC, chamamos o create-checkout de novo para obter o transparent_data
    // Num cenário real, buscaríamos o intent gerado anteriormente.
    try {
      const { data, error } = await supabase.functions.invoke('saas-create-checkout', {
        body: {
          tenant_id: tenant?.id,
          plan_name: item.plan_name,
          amount: item.amount,
          due_date: item.due_date,
          gateway: item.gateway || 'Stripe',
        },
      });
      
      if (data?.transparent_data) {
        setTransparentData(data.transparent_data);
        setCheckoutAmount(item.amount);
        setIsEmbeddedCheckoutOpen(true);
      } else {
        const url = item.payment_link || item.boleto_url;
        if (url) window.open(url, '_blank');
        else toast.error('Link não disponível');
      }
    } catch (err: any) {
      toast.error('Erro ao abrir pagamento.');
    }
  };

  const handleUpgradePlan = async (plan: any) => {
    if (!tenant?.id) return;
    setIsChangingPlan(true);
    try {
      const { data, error } = await supabase.functions.invoke('saas-change-plan', {
        body: {
          tenant_id: tenant.id,
          new_plan_id: plan.id,
        },
      });
      if (error) throw new Error(error.message || 'Erro ao alterar assinatura');
      
      if (data?.transparent_data) {
        setTransparentData(data.transparent_data);
        setCheckoutAmount(plan.price);
        setIsEmbeddedCheckoutOpen(true);
      } else if (data?.checkout_url) {
        // Fallback for non-transparent
        window.open(data.checkout_url, '_blank');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao alterar plano');
    } finally {
      setIsChangingPlan(false);
    }
  };

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
            .select('*')
            .limit(500)
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

          if (plansError) {
            throw plansError;
          }
          return { plansData, invoicesData, count };
        })();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );

        const result: any = await Promise.race([fetchPromise, timeoutPromise]);
        const { plansData, invoicesData, count } = result;

        if (plansData) {
          setPlans(plansData);
        }
        if (invoicesData) {
          setInvoices(invoicesData);
          setTotalCount(count);
        }

        // Addons fetching
        const { data: addonsData } = await supabase.from('saas_addons').select('*').eq('is_active', true).order('price', { ascending: true });
        if (addonsData) setAddons(addonsData);

        const { data: tenantAddonsData } = await supabase.from('saas_tenant_addons').select('*, addon:saas_addons(*)').eq('tenant_id', tenant.id);
        if (tenantAddonsData) setTenantAddons(tenantAddonsData);

        // Live stats calculations
        const { count: usersCount } = await supabase
          .from('profiles_view')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id);

        const uCount = usersCount || 0;
        const currentPlanObj = plansData?.find((p: any) => p.name === tenant.plano);
        
        // Use os limites consolidados que já incluem Add-ons calculados no TenantContext
        const uLimit = tenant?.plan_details?.users_limit || currentPlanObj?.users_limit || 15;
        const sLimit = tenant?.plan_details?.storage_limit || currentPlanObj?.storage_limit || 10;

        // Get actual storage from RPC
        let actualStorageGb = 0;
        try {
          const { data: storageBytes } = await supabase.rpc('get_tenant_storage_usage', { p_tenant_id: tenant.id });
          actualStorageGb = storageBytes ? Number((storageBytes / (1024 * 1024 * 1024)).toFixed(2)) : 0;
        } catch (e) {
          console.error('Error fetching storage:', e);
        }

        // Calculate days left from settings
        let days = 30;
        const periodEnd = tenant.settings?.current_period_end || tenant.settings?.stripe_current_period_end;
        if (periodEnd) {
          const diffTime = new Date(periodEnd as string).getTime() - Date.now();
          days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        } else {
          const pendingInvoice = (invoicesData || []).find((inv: any) => inv.status !== 'pago');
          if (pendingInvoice && pendingInvoice.due_date) {
            const diffTime = new Date(pendingInvoice.due_date).getTime() - Date.now();
            days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          }
        }

        // Calculate active modules
        const tenantModules = Array.isArray(tenant.plan_details?.modules) ? tenant.plan_details.modules : [];
        const mainModulesCount = tenantModules.filter((m: string) => !m.includes(':')).length;
        const totalModules = SAAS_MODULES.length;

        setBillingStats({
          usersCount: uCount,
          usersLimit: uLimit,
          storageGb: actualStorageGb,
          storageLimit: sLimit,
          daysLeft: days,
          activeModules: `${mainModulesCount}/${totalModules}`,
        });
      } catch (err) {
        console.error('TenantBilling: Error fetching billing data from database:', err);
        setPlans([]);
        setInvoices([]);
        setTotalCount(0);
        setBillingStats({
          usersCount: 0,
          usersLimit: 15,
          storageGb: 0,
          storageLimit: 10,
          daysLeft: 0,
          activeModules: '0/8',
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
          <div
            style={{
              background: 'hsl(var(--bg-main))',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
            }}
          >
            <CreditCard size={18} />
          </div>
          <span
            style={{
              fontWeight: 800,
              color: 'hsl(var(--text-main))',
              fontSize: '13px',
              textTransform: 'uppercase',
            }}
          >
            Fatura - {item.plan_name}
          </span>
        </div>
      ),
    },
    {
      header: 'Vencimento',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '12px' }}>
            {new Date(item.due_date).toLocaleDateString('pt-BR')}
          </span>
          {item.paid_at && (
            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
              Pago em: {new Date(item.paid_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Valor',
      accessor: (item: any) => (
        <span style={{ fontWeight: 900, color: 'hsl(var(--brand))', fontSize: '14px' }}>
          R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase',
            background:
              item.status === 'atrasado'
                ? '#fef2f2'
                : item.status === 'pendente'
                  ? '#fffbeb'
                  : '#f0fdf4',
            color:
              item.status === 'atrasado'
                ? '#ef4444'
                : item.status === 'pendente'
                  ? '#f59e0b'
                  : '#10b981',
          }}
        >
          {item.status}
        </span>
      ),
    },
    {
      header: 'Ação',
      accessor: (item: any) =>
        item.status === 'pendente' || item.status === 'atrasado' ? (
          <button
            className="primary-btn"
            onClick={() => handlePayInvoice(item)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: item.status === 'atrasado' ? '#ef4444' : 'hsl(var(--brand))',
              border: 'none',
              color: '#fff',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '11px',
              textTransform: 'uppercase',
            }}
          >
            Pagar Agora
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                color: '#94a3b8',
                fontSize: '11px',
                fontWeight: 700,
                background: 'hsl(var(--bg-main))',
                padding: '6px 12px',
                borderRadius: '8px',
              }}
            >
              Finalizada
            </span>
            <button
              className="icon-btn-secondary"
              title="Visualizar Recibo"
              onClick={() => {
                setSelectedInvoice(item);
                setIsReceiptOpen(true);
              }}
              style={{ background: 'transparent', color: '#10b981', border: '1px solid #10b981', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}
            >
              <Receipt size={14} />
            </button>
            {(item.receipt_url || item.invoice_pdf) && (
              <button
                className="icon-btn-secondary"
                title="Baixar PDF"
                onClick={() => window.open(item.receipt_url || item.invoice_pdf, '_blank')}
                style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}
              >
                <HardDrive size={14} />
              </button>
            )}
          </div>
        ),
    },
  ];

  return (
    <div className="admin-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Administração', href: '/admin/intelligence' },
              { label: 'Assinatura & Planos' },
            ]}
          />
          <h1 className="page-title">Assinatura & Planos</h1>
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
          progress={Math.min(
            100,
            Math.round((billingStats.usersCount / billingStats.usersLimit) * 100)
          )}
          sparkline={[
            { value: Math.max(0, billingStats.usersCount - 2), label: '' },
            { value: billingStats.usersCount, label: '' },
          ]}
        />
        <TauzeStatCard
          label="Armazenamento"
          value={`${billingStats.storageGb} GB`}
          change={`${Math.round((billingStats.storageGb / billingStats.storageLimit) * 100)}% do Limite`}
          trend="up"
          icon={HardDrive}
          color={billingStats.storageGb > billingStats.storageLimit * 0.9 ? '#ef4444' : '#10b981'}
          periodLabel="Limite Atual"
          progress={Math.min(
            100,
            Math.round((billingStats.storageGb / billingStats.storageLimit) * 100)
          )}
          sparkline={[
            { value: Math.max(0.1, billingStats.storageGb - 0.2), label: '' },
            { value: billingStats.storageGb, label: '' },
          ]}
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
          sparkline={[
            { value: 30, label: '' },
            { value: billingStats.daysLeft, label: '' },
          ]}
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
          sparkline={[
            { value: 5, label: '' },
            { value: billingStats.activeModules === '8/8' ? 8 : 5, label: '' },
          ]}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', marginBottom: '32px' }}>
        <div className="tauze-tab-group">
          <button
            className={`tauze-tab-item ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            Plano & Upgrade
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'addons' ? 'active' : ''}`}
            onClick={() => setActiveTab('addons')}
          >
            Módulos Extras
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
              <div
                style={{
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
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: '-50px',
                    top: '-50px',
                    width: '300px',
                    height: '300px',
                    background:
                      'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '32px',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.1)',
                    }}
                  >
                    <ShieldCheck size={50} color="#10b981" />
                  </div>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '8px',
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontSize: '28px',
                          fontWeight: 900,
                          letterSpacing: '-0.5px',
                        }}
                      >
                        {tenant?.plano ||
                          (tenant?.settings?.plan as { name?: string } | undefined)?.name ||
                          'Plano Free (Licença Concedida)'}
                      </h2>
                      <span
                        style={{
                          padding: '6px 14px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        ATIVA EM DIA
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '15px', color: '#94a3b8', fontWeight: 500 }}>
                      Faturamento Mensal •{' '}
                      <span style={{ color: '#10b981', fontWeight: 700 }}>
                        Licença Vitalícia Administrativa
                      </span>
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      fontWeight: 800,
                      letterSpacing: '1.5px',
                      marginBottom: '12px',
                    }}
                  >
                    KPIs DE CONSUMO
                  </p>
                  <div style={{ display: 'flex', gap: '40px', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>
                        {billingStats.usersCount}/{billingStats.usersLimit}
                      </h4>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                        Usuários
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>
                        {billingStats.storageGb}GB
                      </h4>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                        Storage
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '48px' }}>

              {loading ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '24px',
                  }}
                >
                  {[1, 2].map((i) => (
                    <div key={i} className="tauze-card-skeleton" style={{ height: '400px' }} />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '32px',
                  }}
                >
                  {plans
                    .filter((p) => p.price > 0 && p.is_public !== false)
                    .map((plan) => (
                      <motion.div
                        key={plan.id}
                        whileHover={{ y: -12, scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className={`pricing-card-premium ${plan.isPopular ? 'popular' : 'standard'}`}
                      >
                        {/* Decorative background blur */}
                        {plan.isPopular && <div className="popular-blur-bg" />}

                        {plan.isPopular && <div className="popular-badge">MAIS ESCOLHIDO</div>}

                        <div className="plan-header-content">
                          <div className="plan-icon-wrapper">
                            {plan.isPopular ? (
                              <TrendingUp size={24} color="#10b981" />
                            ) : (
                              <LayoutGrid size={24} className="standard-icon" />
                            )}
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
                            {plan.description ||
                              `Infraestrutura sob medida para suportar operações de até ${plan.users_limit} usuários simultâneos.`}
                          </p>
                        </div>

                        <div className="plan-features-wrapper">
                          <div className="plan-divider" />
                          <div className="features-list">
                            {(Array.isArray(plan.features) ? plan.features : []).map(
                              (f: string, i: number) => (
                                <div key={i} className="feature-item">
                                  <div className="feature-check-wrapper">
                                    <Check
                                      size={14}
                                      className="feature-check-icon"
                                      strokeWidth={3}
                                    />
                                  </div>
                                  <span className="feature-text">{f}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        <button
                          className={
                            plan.name?.toLowerCase() === (tenant?.plano || 'free').toLowerCase()
                              ? 'glass-btn standard-action-btn'
                              : plan.isPopular
                                ? 'premium-action-btn popular-btn'
                                : 'glass-btn standard-action-btn'
                          }
                          style={{
                            ...(plan.name?.toLowerCase() === (tenant?.plano || 'free').toLowerCase()
                              ? { opacity: 0.6, cursor: 'not-allowed' }
                              : {})
                          }}
                          onClick={() => {
                            if (plan.name?.toLowerCase() !== (tenant?.plano || 'free').toLowerCase()) {
                              handleUpgradePlan(plan);
                            }
                          }}
                          disabled={isChangingPlan || plan.name?.toLowerCase() === (tenant?.plano || 'free').toLowerCase()}
                        >
                          {plan.name?.toLowerCase() === (tenant?.plano || 'free').toLowerCase()
                            ? 'PLANO ATUAL'
                            : isChangingPlan
                              ? 'AGUARDE...'
                              : `MUDAR PARA ${plan.name}`}
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

            {invoicesLoading ? (
              <LoadingSkeleton variant="table" rows={5} columns={5} fullScreen={false} />
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', marginBottom: '24px' }}>
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
                      style={{
                        background: isFilterOpen ? 'hsl(var(--brand) / 0.1)' : 'transparent',
                        color: isFilterOpen ? 'hsl(var(--brand))' : 'inherit',
                      }}
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

        {activeTab === 'addons' && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>Módulos e Recursos Extras</h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>
                Escale sua operação adquirindo recursos avulsos sem precisar mudar de plano.
              </p>
              
              {addons.length === 0 ? (
                <EmptyState title="Nenhum módulo extra" description="Ainda não existem add-ons disponíveis para contratação." icon={LayoutGrid} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  {addons.filter(addon => {
                    // 1. Ocultar addons inelegíveis (se eligible_plans existir e não for vazio)
                    if (addon.metadata?.eligible_plans && Array.isArray(addon.metadata.eligible_plans) && addon.metadata.eligible_plans.length > 0) {
                      const currentPlan = tenant?.plano || 'Free';
                      if (!addon.metadata.eligible_plans.includes(currentPlan)) {
                        return false;
                      }
                    }

                    // 2. Ocultar Módulos que já estão inclusos no plano do cliente
                    const typeLower = (addon.type || '').toLowerCase();
                    if (typeLower === 'module' || typeLower === 'módulo') {
                      const planModules = tenant?.plan_details?.modules;
                      if (planModules === null) {
                        // Plano irrestrito/legado -> Tem acesso a tudo. Não vende módulo extra.
                        return false;
                      } else if (Array.isArray(planModules)) {
                        // Se tiver module_id
                        if (addon.metadata?.module_id) {
                          const moduleId = addon.metadata.module_id;
                          const parentModule = moduleId.includes(':') ? moduleId.split(':')[0] : null;
                          const isAlreadyInPlan = planModules.includes(moduleId) || (parentModule ? planModules.includes(parentModule) : false);
                          if (isAlreadyInPlan) {
                            return false; // Esconde se já possui
                          }
                        } else {
                          // Fallback heurístico pelo nome do addon
                          const nameLower = addon.name.toLowerCase();
                          if (nameLower.includes('b.i') || nameLower.includes('analytics') || nameLower.includes('bi ')) {
                            // Assumimos que 'Dashboard' ou 'Intelligence Hub' cobre BI
                            if (planModules.includes('Dashboard') || planModules.includes('Intelligence Hub')) {
                              return false;
                            }
                          }
                        }
                      }
                    }

                    if (typeLower === 'combo') {
                      const planModules = tenant?.plan_details?.modules;
                      if (planModules === null) {
                        return false;
                      } else if (Array.isArray(planModules) && addon.metadata?.combo_modules) {
                        const comboModules = addon.metadata.combo_modules;
                        if (comboModules.length > 0) {
                          const alreadyHasAll = comboModules.every((m: string) => {
                            const parentModule = m.includes(':') ? m.split(':')[0] : null;
                            return planModules.includes(m) || (parentModule ? planModules.includes(parentModule) : false);
                          });
                          if (alreadyHasAll) {
                            return false;
                          }
                        }
                      }
                    }

                    return true;
                  }).map(addon => {
                    const isSubscribed = tenantAddons.some(ta => ta.addon_id === addon.id && ta.status === 'active');
                    const isButtonDisabled = isSubscribed;
                    const originalPrice = addon.metadata?.original_price;
                    const discountPercent = originalPrice && originalPrice > Number(addon.price)
                      ? Math.round((1 - Number(addon.price) / originalPrice) * 100)
                      : null;

                    return (
                      <div key={addon.id} style={{
                        background: 'hsl(var(--bg-card))', border: `1px solid ${isButtonDisabled ? '#10b981' : 'var(--border)'}`, 
                        borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden'
                      }}>
                        {isSubscribed && <div style={{ position: 'absolute', top: 16, right: 16, background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 800 }}>ATIVO</div>}
                        <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px', paddingRight: '100px' }}>{addon.name}</h4>
                        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px', minHeight: '40px' }}>{addon.description}</p>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {originalPrice && originalPrice > Number(addon.price) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <del style={{ color: '#94a3b8', fontSize: '12px', textDecoration: 'line-through' }}>
                                  R$ {Number(originalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </del>
                                {discountPercent && (
                                  <span style={{ background: '#22c55e', color: '#fff', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: 800 }}>
                                    {discountPercent}% OFF
                                  </span>
                                )}
                              </div>
                            )}
                            <div>
                              <span style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>R$ {Number(addon.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>/{addon.billing_cycle === 'monthly' ? 'mês' : 'ano'}</span>
                            </div>
                          </div>
                          <button
                            className={isButtonDisabled ? "icon-btn-secondary" : "primary-btn"}
                            disabled={isButtonDisabled}
                            style={{ 
                              padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '12px',
                              ...(isButtonDisabled 
                                ? { background: '#f0fdf4', color: '#10b981', border: 'none' } 
                                : { background: 'hsl(var(--brand))', color: '#fff', border: 'none' })
                            }}
                          >
                            {isSubscribed ? 'Adquirido' : 'Adicionar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>



      <InvoiceReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        invoice={selectedInvoice}
      />

      <EmbeddedCheckoutModal
        isOpen={isEmbeddedCheckoutOpen}
        onClose={() => setIsEmbeddedCheckoutOpen(false)}
        transparentData={transparentData}
        amount={checkoutAmount}
      />

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
