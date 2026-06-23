import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Plus,
  CheckCircle,
  Tag,
  CreditCard,
  Filter,
  FileText,
  Users,
  HardDrive,
  Edit2,
  Zap,
  Trash2,
  DollarSign,
  Star
} from 'lucide-react';
import { EmptyState } from '../../../../components/Feedback/EmptyState';
import { ModernTable } from '../../../../components/DataTable/ModernTable';
import { filterPlans } from '../utils/saasFilters';
import { ExportDropdown } from '../../../../components/UI/ExportDropdown';
import { TauzeStatCard } from '../../../../components/Cards/TauzeStatCard';

interface PlansTabProps {
  plansList: any[];
  tenantsList?: any[];
  plansLoading: boolean;
  plansViewMode: 'grid' | 'list';
  setPlansViewMode: (mode: 'grid' | 'list') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSelectedPlan: (plan: any) => void;
  setIsPlanModalOpen: (open: boolean) => void;
  filterValues: any;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  handleExport: (format: 'csv' | 'excel' | 'pdf') => void;
  openEditPlan: (plan: any) => void;
  setPlanToDelete: (plan: any) => void;
  setIsDeletePlanModalOpen: (open: boolean) => void;
}

export const PlansTab: React.FC<PlansTabProps> = ({
  plansList,
  tenantsList = [],
  plansLoading,
  plansViewMode,
  setPlansViewMode,
  searchQuery,
  setSearchQuery,
  setSelectedPlan,
  setIsPlanModalOpen,
  filterValues,
  showAdvancedFilters,
  setShowAdvancedFilters,
  handleExport,
  openEditPlan,
  setPlanToDelete,
  setIsDeletePlanModalOpen,
}) => {
  // ✅ Melhoria: conta filtros ativos para badge visual
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filterValues.minPrice > 0 || filterValues.maxPrice < 10000) count++;
    if (filterValues.minUsers > 0 || (filterValues.maxUsers !== undefined && filterValues.maxUsers < 1000)) count++;
    if (filterValues.minStorage > 0 || (filterValues.maxStorage !== undefined && filterValues.maxStorage < 1000)) count++;
    return count;
  }, [filterValues]);

  const [localStatusFilter, setLocalStatusFilter] = React.useState<'all' | 'paid' | 'trial'>('all');

  const filteredPlansBase = filterPlans(plansList, searchQuery, filterValues);
  const filteredPlans = React.useMemo(() => {
    let list = filteredPlansBase;
    if (localStatusFilter !== 'all') {
      list = list.filter((p: any) => {
        const isTrial = p.name.toLowerCase().includes('trial') || p.price === 0 || p.price === '0' || p.price === '0.00';
        if (localStatusFilter === 'trial') return isTrial;
        if (localStatusFilter === 'paid') return !isTrial;
        return true;
      });
    }
    return list;
  }, [filteredPlansBase, localStatusFilter]);

  // --- STATS CALCULATION ---
  const validPlans = plansList.filter(p => !p.name.toLowerCase().includes('trial'));
  const validPlanNames = new Set(validPlans.map(p => p.name.toLowerCase()));

  const averagePrice = validPlans.length > 0 
    ? validPlans.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / validPlans.length
    : 0;

  const validTenants = tenantsList.filter(t => {
    if (!t.plan || t.plan.toLowerCase().includes('trial') || t.status?.toLowerCase() !== 'ativo') return false;
    // Só conta como ativo se o plano assinado realmente existir na base de planos atual
    return validPlanNames.has(t.plan.toLowerCase());
  });
  
  const planCounts: Record<string, number> = {};
  validTenants.forEach(t => {
    // Busca o nome original do plano para exibição bonita
    const originalName = validPlans.find(p => p.name.toLowerCase() === t.plan.toLowerCase())?.name || t.plan;
    planCounts[originalName] = (planCounts[originalName] || 0) + 1;
  });
  
  const popularPlan = Object.keys(planCounts).sort((a, b) => planCounts[b] - planCounts[a])[0] || 'Nenhum';
  // -------------------------

  return (
    <motion.div
      key="plans"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="saas-view-wrapper"
      style={{ width: '100%' }}
    >
      <div
        className="dashboard-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}
      >
        <TauzeStatCard
          label="Total de Planos"
          value={plansList.length.toString()}
          icon={CreditCard}
          color="hsl(var(--brand))"
        />
        <TauzeStatCard
          label="Assinaturas Ativas"
          value={validTenants.length.toString()}
          icon={CheckCircle}
          color="#10b981"
        />
        <TauzeStatCard
          label="Plano Mais Popular"
          value={popularPlan}
          icon={Star}
          color="#f59e0b"
        />
        <TauzeStatCard
          label="Ticket Médio (Planos)"
          value={`R$ ${averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="#3b82f6"
        />
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          {(['all', 'paid', 'trial'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setLocalStatusFilter(status)}
              className={`tauze-tab-item ${localStatusFilter === status ? 'active' : ''}`}
            >
              {status === 'all' ? 'Todos' : status === 'paid' ? 'Pagos' : 'Trial/Gratuitos'}
            </button>
          ))}
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            className="tauze-search-input"
            type="text"
            placeholder="Filtrar catálogo de planos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="view-mode-toggle">
          <button
            className={`view-btn ${plansViewMode === 'list' ? 'active' : ''}`}
            onClick={() => setPlansViewMode('list')}
            title="Visualização em Lista"
          >
            <ListIcon size={18} />
          </button>
          <button
            className={`view-btn ${plansViewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setPlansViewMode('grid')}
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
        {plansViewMode === 'list' ? (
          <ModernTable
          emptyState={
            <EmptyState
              title="Nenhum registro encontrado"
              description="Sua busca não retornou resultados."
              icon={Search}
            />
          }
          data={filteredPlans}
          columns={[
            {
              header: 'Plano',
              accessor: (p: any) => (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: '220px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'hsl(var(--brand) / 0.1)',
                      color: 'hsl(var(--brand))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Zap size={20} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{
                        fontWeight: '600',
                        color: 'hsl(var(--foreground))',
                        fontSize: '15px',
                      }}
                    >
                      {p.name}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {p.features?.length || 0} recursos ativos
                    </span>
                  </div>
                </div>
              ),
            },
            {
              header: 'Preço',
              accessor: (p: any) => (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    minWidth: '120px',
                  }}
                >
                  <CreditCard size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <span style={{ fontWeight: '700', color: 'hsl(var(--foreground))' }}>
                    {p.price_formatted || `R$ ${p.price}`}
                  </span>
                </div>
              ),
            },
            {
              header: 'Limite Usuários',
              accessor: (p: any) => (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Users size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <span style={{ color: 'hsl(var(--foreground))', fontWeight: '500' }}>
                    {p.users_limit || 'Ilimitados'}
                  </span>
                </div>
              ),
            },
            {
              header: 'Limite Storage',
              accessor: (p: any) => (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <HardDrive size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <span style={{ color: 'hsl(var(--foreground))', fontWeight: '500' }}>
                    {p.storage_gb || '0'} GB
                  </span>
                </div>
              ),
            },
            {
              header: 'Ações',
              accessor: (item: any) => (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                  }}
                >
                  <button
                    className="action-dot primary"
                    onClick={() => openEditPlan(item)}
                    title="Editar Plano"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    className="action-dot danger"
                    onClick={() => {
                      setPlanToDelete(item);
                      setIsDeletePlanModalOpen(true);
                    }}
                    title="Excluir Plano"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ),
            },
          ]}
          loading={plansLoading}
          hideHeader={true}
        />
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          title="Nenhum plano encontrado"
          description="Não há planos que correspondam aos filtros atuais."
          actionLabel="Novo Plano"
          onAction={() => {
            setSelectedPlan(null);
            setIsPlanModalOpen(true);
          }}
          icon={CreditCard}
        />
      ) : (
        <div className="user-cards-grid">
          {filteredPlans.map((plan) => {
            const getPlanBadgeClass = (name: string) => {
              if (name === 'Enterprise') {
                return 'info';
              }
              if (name === 'Pro') {
                return 'active';
              }
              return '';
            };

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`tenant-card-premium ${getPlanBadgeClass(plan.name)}`}
              >
                <div className="tenant-card-left-section">
                  <div
                    className="tenant-card-avatar"
                    style={{ background: '#f59e0b', color: 'white' }}
                  >
                    <CreditCard size={32} />
                  </div>
                  <div className="tenant-card-bottom-actions">
                    <button
                      className="tenant-action-icon-btn"
                      onClick={() => openEditPlan(plan)}
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="tenant-action-icon-btn danger"
                      onClick={() => {
                        setPlanToDelete(plan);
                        setIsDeletePlanModalOpen(true);
                      }}
                      title="Excluir"
                      style={{ marginLeft: '8px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="tenant-card-main-content">
                  <div className="tenant-card-header-info">
                    <h3>{plan.name}</h3>
                    <span
                      className="tenant-plan-badge"
                      style={{
                        color: '#f59e0b',
                        background: '#fffbeb',
                        borderColor: '#fde68a',
                      }}
                    >
                      {plan.price_formatted || plan.price}
                    </span>
                  </div>

                  <div className="tenant-card-meta-grid">
                    <div className="tenant-meta-item">
                      <Users
                        size={14}
                        className="tenant-meta-icon"
                        style={{ color: '#f59e0b', marginRight: '8px' }}
                      />
                      <span>Limite: {plan.users_limit || '∞'} Usuários</span>
                    </div>
                    <div className="tenant-meta-item">
                      <HardDrive
                        size={14}
                        className="tenant-meta-icon"
                        style={{ color: '#f59e0b', marginRight: '8px' }}
                      />
                      <span>Armazenamento: {plan.storage_gb || '0'} GB</span>
                    </div>
                    <div className="tenant-meta-item">
                      <CheckCircle
                        size={14}
                        className="tenant-meta-icon"
                        style={{ color: '#f59e0b', marginRight: '8px' }}
                      />
                      <span>{plan.features?.length || 0} Recursos inclusos</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      </div>
    </motion.div>
  );
};
