import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Plus,
  History,
  LogIn,
  CheckCircle,
  XCircle,
  Filter,
  FileText,
  Globe,
  Eye,
  Trash2,
  Lock,
  Users,
  HardDrive,
  Edit2,
  Shield
} from 'lucide-react';
import { ToggleSwitch } from '../../../../components/UI/ToggleSwitch';
import { EmptyState } from '../../../../components/Feedback/EmptyState';
import { ModernTable } from '../../../../components/DataTable/ModernTable';
import { TauzeStatCard } from '../../../../components/Cards/TauzeStatCard';
import { Activity, ShieldCheck, UserX } from 'lucide-react';
import { filterTenants } from '../utils/saasFilters';
import { ExportDropdown } from '../../../../components/UI/ExportDropdown';
import { useConfirm } from '../../../../contexts/ConfirmContext';

interface TenantsTabProps {
  tenantsList: any[];
  tenantsLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tenantsViewMode: 'grid' | 'list';
  setTenantsViewMode: (mode: 'grid' | 'list') => void;
  handleToggleTenant: (tenant: any, active: boolean) => void;
  setSelectedTenant: (tenant: any) => void;
  setIsTenantModalOpen: (open: boolean) => void;
  setIsCreateDemoModalOpen: (open: boolean) => void;
  setTenantToDelete: (tenant: any) => void;
  setIsDeleteDemoModalOpen: (open: boolean) => void;
  handleImpersonate: (tenantId: string) => void;
  openAuditLogs: (tenant: any) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  filterValues: any;
  handleExport: (format: 'csv' | 'excel' | 'pdf') => void;
  openEditTenant: (tenant: any) => void;
  setDeleteConfirmationInput: (val: string) => void;
}

export const TenantsTab: React.FC<TenantsTabProps> = ({
  tenantsList,
  tenantsLoading,
  searchQuery,
  setSearchQuery,
  tenantsViewMode,
  setTenantsViewMode,
  handleToggleTenant,
  setSelectedTenant,
  setIsTenantModalOpen,
  setIsCreateDemoModalOpen,
  setTenantToDelete,
  setIsDeleteDemoModalOpen,
  handleImpersonate,
  openAuditLogs,
  showAdvancedFilters,
  setShowAdvancedFilters,
  filterValues,
  handleExport,
  openEditTenant,
  setDeleteConfirmationInput,
}) => {
  const { confirm } = useConfirm();

  const tenantColumns = [
    {
      header: 'Tenant',
      accessor: (item: any) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '6px 0',
            minWidth: '220px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'hsl(var(--bg-main))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6366f1',
              border: '1px solid #e2e8f0',
              flexShrink: 0,
            }}
          >
            <Globe size={16} />
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
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              {item.name}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '700',
                color: '#94a3b8',
                fontFamily: 'monospace',
                marginTop: '2px',
              }}
            >
              ID: {item.id}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Plano',
      accessor: (item: any) => {
        const isDemo = item.is_demo === true;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={14} style={{ color: isDemo ? '#3b82f6' : '#10b981', flexShrink: 0 }} />
            <span
              style={{
                fontSize: '11px',
                fontWeight: '900',
                color: isDemo ? '#1e3a8a' : '#0f172a',
                textTransform: 'uppercase',
                padding: '4px 8px',
                background: isDemo ? '#eff6ff' : '#f0fdf4',
                borderRadius: '6px',
                border: isDemo ? '1px solid #bfdbfe' : '1px solid #dcfce7',
              }}
            >
              {isDemo ? 'DEMONSTRAÇÃO' : item.plan}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Uso de Recursos',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={12} style={{ color: '#6366f1' }} />
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>
              {item.users} usuários
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={12} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>
              {item.storage} storage
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div onClick={(e) => e.stopPropagation()}>
          <ToggleSwitch
            checked={(item.status || 'Ativo').toLowerCase() === 'ativo'}
            onChange={async (val: boolean) => {
              if (!val) {
                const isConfirmed = await confirm({
                  title: 'Suspender Parceiro',
                  description: `Tem certeza que deseja suspender a instância "${item.name}"? Os usuários perderão o acesso.`,
                  confirmText: 'Suspender',
                  variant: 'danger',
                });
                if (isConfirmed) handleToggleTenant(item, val);
              } else {
                handleToggleTenant(item, val);
              }
            }}
            size="sm"
            labelOn="Ativo"
            labelOff="Suspenso"
            showStatus
          />
        </div>
      ),
      align: 'center' as const,
    },
    {
      header: 'Ações',
      accessor: (item: any) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            className="action-dot info"
            onClick={(e) => {
              e.stopPropagation();
              openAuditLogs(item);
            }}
            title="Ver Auditoria"
          >
            <Eye size={18} />
          </button>
          <button
            className="action-dot success"
            onClick={(e) => {
              e.stopPropagation();
              handleImpersonate(item.id);
            }}
            title="Acessar Instância"
          >
            <LogIn size={18} />
          </button>
          <button
            className="action-dot primary"
            onClick={(e) => {
              e.stopPropagation();
              openEditTenant(item);
            }}
            title="Configurar"
          >
            <Edit2 size={18} />
          </button>
          {item.is_demo ? (
            <button
              className="action-dot danger"
              onClick={(e) => {
                e.stopPropagation();
                setTenantToDelete(item);
                setDeleteConfirmationInput('');
                setIsDeleteDemoModalOpen(true);
              }}
              title="Excluir Base Demo"
              style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2' }}
            >
              <Trash2 size={18} />
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#fffbeb',
                color: '#d97706',
                border: '1px solid #fef3c7',
              }}
              title="Assinante Protegido (Imune à exclusão)"
            >
              <Lock size={16} />
            </div>
          )}
        </div>
      ),
      align: 'right' as const,
    },
  ];
  // ✅ Melhoria 13: conta filtros ativos para badge visual
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filterValues.status !== 'all') count++;
    if (filterValues.plan !== 'all') count++;
    if (filterValues.minUsers > 0 || filterValues.maxUsers < 1000) count++;
    if (filterValues.dateStart || filterValues.dateEnd) count++;
    return count;
  }, [filterValues]);

  const [localStatusFilter, setLocalStatusFilter] = React.useState<'all' | 'active' | 'inactive' | 'demo'>('all');

  const filteredTenantsBase = filterTenants(tenantsList, searchQuery, filterValues);
  const filteredTenants = React.useMemo(() => {
    let list = filteredTenantsBase;
    if (localStatusFilter !== 'all') {
      list = list.filter((t: any) => {
        if (localStatusFilter === 'demo') return t.is_demo === true;
        if (localStatusFilter === 'active') return t.status?.toLowerCase() === 'ativo' && !t.is_demo;
        if (localStatusFilter === 'inactive') return t.status?.toLowerCase() !== 'ativo' && !t.is_demo;
        return true;
      });
    }
    return list;
  }, [filteredTenantsBase, localStatusFilter]);

  return (
    <motion.div
      key="tenants"
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
          label="Total de Clientes"
          value={tenantsList.length.toString()}
          icon={Globe}
          color="hsl(var(--brand))"
        />
        <TauzeStatCard
          label="Clientes Ativos"
          value={tenantsList.filter((t) => t.status?.toLowerCase() === 'ativo').length.toString()}
          icon={ShieldCheck}
          color="#10b981"
        />
        <TauzeStatCard
          label="Total de Usuários"
          value={tenantsList.reduce((sum, t) => sum + (Number(t.users) || 0), 0).toString()}
          icon={Users}
          color="#3b82f6"
        />
        <TauzeStatCard
          label="Clientes Inativos"
          value={tenantsList.filter((t) => t.status?.toLowerCase() !== 'ativo').length.toString()}
          icon={UserX}
          color="#ef4444"
        />
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          {(['all', 'active', 'inactive', 'demo'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setLocalStatusFilter(status)}
              className={`tauze-tab-item ${localStatusFilter === status ? 'active' : ''}`}
            >
              {status === 'all' ? 'Todos' : status === 'active' ? 'Ativos' : status === 'inactive' ? 'Inativos' : 'Demos'}
            </button>
          ))}
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            className="tauze-search-input"
            type="text"
            placeholder="Filtrar por nome, CNPJ ou ID de instância..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="view-mode-toggle">
          <button
            className={`view-btn ${tenantsViewMode === 'list' ? 'active' : ''}`}
            onClick={() => setTenantsViewMode('list')}
            title="Visualização em Lista"
          >
            <ListIcon size={18} />
          </button>
          <button
            className={`view-btn ${tenantsViewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setTenantsViewMode('grid')}
            title="Visualização em Cards"
          >
            <LayoutGrid size={18} />
          </button>
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
        {tenantsViewMode === 'list' ? (
          <ModernTable
            emptyState={
              <EmptyState
                title="Nenhum registro encontrado"
                description="Sua busca não retornou resultados."
                icon={Search}
              />
            }
            data={filteredTenants}
            columns={tenantColumns}
            loading={tenantsLoading}
            onRowClick={(item: any) => {
              openEditTenant(item);
            }}
          />
        ) : filteredTenants.length === 0 ? (
          // ✅ Melhoria 11: terminologia padronizada para "Parceiro"
          <EmptyState
            title="Nenhum parceiro encontrado"
            description="Não há parceiros que correspondam aos filtros atuais."
            actionLabel="Novo Parceiro"
            onAction={() => {
              setSelectedTenant(null);
              setIsTenantModalOpen(true);
            }}
            icon={Globe}
          />
        ) : (
          <div className="user-cards-grid">
            {filteredTenants.map((t) => {
              const isDemo = t.is_demo === true;
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={t.id}
                  className={`tenant-card-premium ${t.status?.toLowerCase() === 'ativo' ? 'active' : 'stopped'}`}
                  onClick={() => {
                    openEditTenant(t);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="tenant-card-left-section">
                    <div
                      className="tenant-card-avatar"
                      style={{
                        background: isDemo
                          ? 'rgba(59, 130, 246, 0.1)'
                          : 'rgba(16, 185, 129, 0.1)',
                        color: isDemo ? '#3b82f6' : '#10b981',
                      }}
                    >
                      <Globe size={24} />
                    </div>
                    <div className="tenant-card-bottom-actions">
                      <button
                        className="tenant-action-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImpersonate(t.id);
                        }}
                        title="Acessar Instância"
                      >
                        <LogIn size={16} />
                      </button>
                      <button
                        className="tenant-action-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditTenant(t);
                        }}
                        title="Configurar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="tenant-action-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAuditLogs(t);
                        }}
                        title="Ver Auditoria"
                      >
                        <Eye size={16} />
                      </button>
                      {isDemo ? (
                        <button
                          className="tenant-action-icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTenantToDelete(t);
                            setDeleteConfirmationInput('');
                            setIsDeleteDemoModalOpen(true);
                          }}
                          title="Excluir Base Demo"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <span
                          className="tenant-action-icon-btn"
                          title="Assinante Protegido"
                          style={{ color: '#d97706', cursor: 'default' }}
                        >
                          <Lock size={14} />
                        </span>
                      )}
                    </div>
                  </div>

                <div className="tenant-card-main-content">
                  <div className="tenant-card-header-info">
                    <h3 title={t.name}>{t.name}</h3>
                    {isDemo ? (
                      <span
                        className="tenant-plan-badge demo"
                        style={{
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        DEMONSTRAÇÃO
                      </span>
                    ) : (
                      <span
                        className={`tenant-plan-badge ${(t.plan || 'Starter').toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {t.plan}
                      </span>
                    )}
                  </div>

                  <div className="tenant-card-meta-grid">
                    <div className="tenant-meta-item">
                      <Users
                        size={14}
                        className="tenant-meta-icon"
                        style={{ marginRight: '8px' }}
                      />
                      <span>{t.users} Assentos Ativos</span>
                    </div>
                    <div className="tenant-meta-item">
                      <HardDrive
                        size={14}
                        className="tenant-meta-icon"
                        style={{ marginRight: '8px' }}
                      />
                      <span>{t.storage} Alocados</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: '1px solid hsl(var(--border) / 0.5)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'hsl(var(--text-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Status
                      </span>
                      <ToggleSwitch
                        checked={(t.status || 'Ativo').toLowerCase() === 'ativo'}
                        onChange={async (val: boolean) => {
                          if (!val) {
                            const isConfirmed = await confirm({
                              title: 'Suspender Parceiro',
                              description: `Tem certeza que deseja suspender a instância "${t.name}"? Os usuários perderão o acesso.`,
                              confirmText: 'Suspender',
                              variant: 'danger',
                            });
                            if (isConfirmed) handleToggleTenant(t, val);
                          } else {
                            handleToggleTenant(t, val);
                          }
                        }}
                        size="sm"
                        labelOn="Ativo"
                        labelOff="Suspenso"
                        showStatus
                      />
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
