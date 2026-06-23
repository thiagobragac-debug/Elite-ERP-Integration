import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  FileText,
  CheckCircle,
  AlertCircle,
  History,
  DollarSign,
  Activity,
  Shield,
  Filter,
  Zap,
  RefreshCw,
  Globe,
  Calendar,
  Edit2,
  BadgeCheck,
  Ban,
  Plus
} from 'lucide-react';
import { ModernTable } from '../../../../components/DataTable/ModernTable';
import { TauzeStatCard } from '../../../../components/Cards/TauzeStatCard';
import { EmptyState } from '../../../../components/Feedback/EmptyState';
import { filterBilling } from '../utils/saasFilters';
import { ExportDropdown } from '../../../../components/UI/ExportDropdown';
import { useConfirm } from '../../../../contexts/ConfirmContext';
import toast from 'react-hot-toast';

interface BillingTabProps {
  invoicesList: any[];
  invoicesLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  billingSubTab: string;
  setBillingSubTab: (subTab: string) => void;
  totalFaturamento: number;
  totalInadimplencia: number;
  totalPendente: number;
  churnRate: number;
  setIsChargeModalOpen: (open: boolean) => void;
  openAuditLogs: (tenant: any) => void;
  filterValues: any;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  handleExport: (format: 'csv' | 'excel' | 'pdf') => void;
  handleReprocessFailures: () => void;
  handleFiscalReport: () => void;
  setIsRetentionModalOpen: (open: boolean) => void;
  openEditTenant: (tenant: any) => void;
  handleMarkPaid: (invoice: any) => Promise<void>;
  handleBlockInvoice: (invoice: any) => Promise<void>;
  handleResendCharge: (invoice: any) => Promise<void>;
}

export const BillingTab: React.FC<BillingTabProps> = ({
  invoicesList,
  invoicesLoading,
  searchQuery,
  setSearchQuery,
  billingSubTab,
  setBillingSubTab,
  totalFaturamento,
  totalInadimplencia,
  totalPendente,
  churnRate,
  setIsChargeModalOpen,
  openAuditLogs,
  filterValues,
  showAdvancedFilters,
  setShowAdvancedFilters,
  handleExport,
  handleReprocessFailures,
  handleFiscalReport,
  setIsRetentionModalOpen,
  openEditTenant,
  handleMarkPaid,
  handleBlockInvoice,
  handleResendCharge,
}) => {
  const { confirm } = useConfirm();

  const billingColumns = [
    {
      header: 'Fazenda / ID',
      accessor: (item: any) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 0',
            minWidth: '240px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'hsl(var(--bg-main))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              border: '1px solid #f1f5f9',
              flexShrink: 0,
            }}
          >
            <Globe size={18} />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: '900',
                color: '#0f172a',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                lineHeight: '1',
              }}
            >
              {item.tenants?.name || 'Parceiro Desconhecido'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: '900',
                  color: 'white',
                  background: '#94a3b8',
                  padding: '0 4px',
                  borderRadius: '2px',
                  lineHeight: '12px',
                }}
              >
                FATURA
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#94a3b8',
                  fontFamily: 'monospace',
                }}
              >
                {item.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Plano / Valor',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Activity size={14} style={{ color: '#10b981', marginRight: '12px', flexShrink: 0 }} />
            <span
              style={{
                fontSize: '11px',
                fontWeight: '900',
                color: '#0f172a',
                textTransform: 'uppercase',
              }}
            >
              {item.plan}
            </span>
          </div>
          <div style={{ paddingLeft: '26px' }}>
            <span
              style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', fontStyle: 'italic' }}
            >
              {item.price} / mês
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Gateway',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: '900',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {item.gateway}
          </span>
        </div>
      ),
    },
    {
      header: 'Vencimento',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Calendar size={14} style={{ color: '#64748b', marginRight: '12px', flexShrink: 0 }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: '900',
              color: '#64748b',
              textTransform: 'uppercase',
            }}
          >
            {item.due}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={`status-badge-tauze ${item.status}`}>{item.status}</span>
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Ações',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
          {/* Marcar como Pago — só exibe se não estiver pago */}
          {item.status !== 'pago' && (
            <>
              <button
                className="action-dot primary"
                onClick={async () => {
                  const confirmed = await confirm({
                    title: 'Re-enviar Cobrança',
                    description: `Deseja gerar um novo link de cobrança para a fatura de "${item.tenants?.name}" no gateway ${item.gateway}?`,
                    confirmText: 'Gerar Novo Link',
                    variant: 'primary',
                  });
                  if (confirmed) await handleResendCharge(item);
                }}
                title="Re-enviar Cobrança (Gerar Novo Link)"
                style={{ color: '#3b82f6' }}
              >
                <RefreshCw size={18} />
              </button>
              <button
                className="action-dot success"
                onClick={async () => {
                  const confirmed = await confirm({
                    title: 'Confirmar Pagamento',
                    description: `Marcar a fatura de "${item.tenants?.name}" como paga?`,
                    confirmText: 'Confirmar',
                    variant: 'primary',
                  });
                  if (confirmed) await handleMarkPaid(item);
                }}
                title="Marcar como Pago"
                style={{ color: '#10b981' }}
              >
                <BadgeCheck size={18} />
              </button>
            </>
          )}
          <button
            className="action-dot info"
            onClick={() => openAuditLogs({ id: item.tenant_id, name: item.tenants?.name || 'Tenant' })}
            title="Histórico"
          >
            <History size={18} />
          </button>
          <button
            className="action-dot primary"
            onClick={() => openEditTenant(item.tenants || item)}
            title="Editar Parceiro"
          >
            <Edit2 size={18} />
          </button>
          {/* Bloquear — só se não estiver bloqueado/pago */}
          {item.status !== 'pago' && item.status !== 'bloqueado' && (
            <button
              className="action-dot danger"
              onClick={async () => {
                const confirmed = await confirm({
                  title: 'Suspender Serviço',
                  description: `Isso suspenderá o acesso de "${item.tenants?.name}" ao sistema por inadimplência. Continuar?`,
                  confirmText: 'Suspender',
                  variant: 'danger',
                });
                if (confirmed) await handleBlockInvoice(item);
              }}
              title="Suspender por Inadimplência"
            >
              <Ban size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];
  // ✅ Melhoria 13: conta filtros ativos para badge visual
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filterValues.status !== 'all') count++;
    if (filterValues.minPrice > 0 || filterValues.maxPrice < 10000) count++;
    if (filterValues.dateStart || filterValues.dateEnd) count++;
    return count;
  }, [filterValues]);

  const filteredBilling = filterBilling(invoicesList, searchQuery, filterValues);

  return (
    <motion.div
      key="billing"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="saas-view-wrapper"
      style={{ width: '100%' }}
    >
      {/* Advanced Metrics & Strategic Actions - Diamond Parity 5.0 */}
      <div
        className="health-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '48px',
          marginTop: '10px',
        }}
      >
        <TauzeStatCard
          label="Métricas de Faturamento"
          value={`R$ ${totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change="+4.2%"
          trend="up"
          icon={DollarSign}
          color="#10b981"
          periodLabel="Mensal"
          sparkline={[
            { value: 30, label: '1' },
            { value: 50, label: '2' },
            { value: 45, label: '3' },
            { value: 80, label: '4' },
          ]}
        />

        <TauzeStatCard
          label="Inadimplência (30d)"
          value={`R$ ${totalInadimplencia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change="-12%"
          trend="down"
          icon={AlertCircle}
          color="#ef4444"
          periodLabel="Mensal"
          sparkline={[
            { value: 60, label: '1' },
            { value: 40, label: '2' },
            { value: 55, label: '3' },
            { value: 30, label: '4' },
          ]}
        />

        <TauzeStatCard
          label="Previsão de Receita"
          value={`R$ ${totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change="+11.5%"
          trend="up"
          icon={Activity}
          color="#f59e0b"
          periodLabel="Próx. 30d"
          sparkline={[
            { value: 40, label: '1' },
            { value: 60, label: '2' },
            { value: 75, label: '3' },
            { value: 90, label: '4' },
          ]}
        />

        <TauzeStatCard
          label="Taxa de Churn"
          value={`${churnRate.toFixed(1)}%`}
          change="-0.4%"
          trend="down"
          icon={Shield}
          color="#6366f1"
          periodLabel="Mensal"
          progress={15}
          sparkline={[
            { value: 70, label: '1' },
            { value: 50, label: '2' },
            { value: 45, label: '3' },
            { value: 30, label: '4' },
          ]}
        />
      </div>

      <div className="tauze-controls-row" style={{ marginTop: '20px' }}>
        <div className="tauze-tab-group">
          <button
            className={`tauze-tab-item ${billingSubTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setBillingSubTab('monitor')}
          >
            Monitor Global
          </button>
        </div>

        <div className="tauze-search-wrapper" style={{ flex: 1, maxWidth: '460px' }}>
          <Search size={18} className="s-icon" />
          <input
            className="tauze-search-input"
            type="text"
            placeholder="Filtrar cobranças por ID de fatura ou parceiro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="tauze-filter-group">
          {/* ✅ Melhoria 13: botão de filtro com badge de contagem */}
          <button
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{ position: 'relative' }}
          >
            <Filter size={20} />
            {activeFilterCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
                background: 'hsl(var(--brand))',
                color: 'white',
                fontSize: '10px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                lineHeight: '1',
                pointerEvents: 'none',
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          <ExportDropdown onExport={handleExport} />
        </div>
      </div>

      <div className="management-content">
        {billingSubTab === 'monitor' && (
          <ModernTable
            emptyState={
              <EmptyState
                title="Nenhum registro encontrado"
                description="Sua busca não retornou resultados."
                icon={Search}
              />
            }
            data={filteredBilling.map((t) => ({
              ...t,
              price: `R$ ${Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              gateway: t.gateway || (t.payment_link?.includes('stripe') ? 'Stripe' : t.payment_link?.includes('asaas') ? 'Asaas' : 'Manual'),
              due: t.due_date ? new Date(t.due_date).toLocaleDateString('pt-BR') : 'Sem data',
              plan: t.plan_name,
            }))}
            columns={billingColumns}
            loading={invoicesLoading}
            hideHeader={true}
          />
        )}
      </div>

      {/* Strategic Actions Bar - Diamond Parity 5.0 (Relocated to Footer) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          marginTop: '40px',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid hsl(var(--border) / 0.6)',
          background:
            'linear-gradient(to right, hsl(var(--muted) / 0.3), hsl(var(--background)))',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            paddingRight: '24px',
            borderRight: '1px solid hsl(var(--border))',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'hsl(var(--bg-card))',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6366f1',
            }}
          >
            <div style={{ margin: 'auto' }}>
              <Zap size={22} fill="#6366f1" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: '800',
                color: 'hsl(var(--text-main))',
              }}
            >
              Ações de Governança
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                fontWeight: '600',
                color: '#6366f1',
                opacity: 0.8,
              }}
            >
              Hub Estratégico
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, gap: '12px', alignItems: 'center' }}>
          {[
            {
              label: 'Reprocessar Falhas',
              icon: RefreshCw,
              color: '#10b981',
              action: handleReprocessFailures,
            },
            {
              label: 'Relatório Fiscal Consolidado',
              icon: FileText,
              color: '#6366f1',
              action: handleFiscalReport,
            },
            {
              label: 'Políticas de Retenção',
              icon: Shield,
              color: '#64748b',
              action: () => setIsRetentionModalOpen(true),
            },
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.action}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'hsl(var(--bg-card))',
                border: '1px solid hsl(var(--border))',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = btn.color;
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--border))';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
              }}
            >
              <btn.icon size={16} style={{ color: btn.color }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: 'hsl(var(--text-main))',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {btn.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
