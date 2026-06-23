import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { TenantForm } from '../../components/Forms/TenantForm';
import { PlanForm } from '../../components/Forms/PlanForm';
import { CampaignForm } from '../../components/Forms/CampaignForm';
import { ChargeModal } from './SaaSAdminPanel/components/ChargeModal';
import { SystemAuditDrawer } from './components/SystemAuditDrawer';
import { AuditLogTimelineModal } from './components/AuditLogTimelineModal';
import { CreateDemoModal } from './components/CreateDemoModal';
import { DeleteDemoModal } from './components/DeleteDemoModal';
import { DeletePlanModal } from './components/DeletePlanModal';
import { RetentionPolicyModal } from './components/RetentionPolicyModal';
import { SaaSFilterModal } from './components/SaaSFilterModal';
import { SaaSCommandPalette } from './components/SaaSCommandPalette';
import { FileText, Plus, DollarSign, Globe, Users, Activity } from 'lucide-react';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { logAudit } from '../../utils/audit';

// Hook & Subcomponents
import { useSaaSAdminState } from './SaaSAdminPanel/hooks/useSaaSAdminState';
import { OverviewTab } from './SaaSAdminPanel/components/OverviewTab';
import { TenantsTab } from './SaaSAdminPanel/components/TenantsTab';
import { PlansTab } from './SaaSAdminPanel/components/PlansTab';
import { AddonsTab } from './SaaSAdminPanel/components/AddonsTab';
import { CampaignsTab } from './SaaSAdminPanel/components/CampaignsTab';
import { BillingTab } from './SaaSAdminPanel/components/BillingTab';
import { GatewaySettingsPage } from './SaaSAdminPanel/components/GatewaySettingsPage';
import { HealthTab } from './SaaSAdminPanel/components/HealthTab';

import { AnalyticsTab } from './SaaSAdminPanel/components/AnalyticsTab';
import { LandingPageSettings } from './SaaSAdminPanel/components/LandingPageSettings';
import { LeadsTab } from './SaaSAdminPanel/components/LeadsTab';
import { BrandingPage } from './SaaSAdminPanel/components/BrandingPage';
import { LoginSettingsPage } from './SaaSAdminPanel/components/LoginSettingsPage';
import { BroadcastPage } from './SaaSAdminPanel/components/BroadcastPage';

import './SaaSAdminPanel/SaaSAdminPanel.css';

export const SaaSAdminPanel: React.FC = () => {
  React.useEffect(() => {
    // Força o tema dark no painel admin SaaS para manter a consistência do Glassmorphism
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark');
  }, []);

  const saasState = useSaaSAdminState();
  const {
    activeTab,
    tabConfig,
    handleTabChange,
    handleExport,
    user,
    
    // Modal states & controls
    isTenantModalOpen,
    setIsTenantModalOpen,
    isPlanModalOpen,
    setIsPlanModalOpen,
    isCampaignModalOpen,
    setIsCampaignModalOpen,
    isChargeModalOpen,
    setIsChargeModalOpen,
    isCreateDemoModalOpen,
    setIsCreateDemoModalOpen,
    isDeleteDemoModalOpen,
    setIsDeleteDemoModalOpen,
    isAuditLogModalOpen,
    setIsAuditLogModalOpen,
    isRetentionModalOpen,
    setIsRetentionModalOpen,
    isAuditDrawerOpen,
    setIsAuditDrawerOpen,
    
    // Data & Handlers
    plansList,
    selectedTenant,
    handleSaveTenant,
    handleCreateDemoTenant,
    handleDeleteDemoTenant,
    tenantToDelete,
    deleteConfirmationInput,
    setDeleteConfirmationInput,
    isDeleting,
    selectedPlan,
    handleSavePlan,
    selectedCampaign,
    handleSaveCampaign,
    isSaving,
    tenantsList,
    auditLogs,
    logsLoading,
    fetchInvoices,
    selectedAuditTenant,
    auditLogsList,
    retentionSettings,
    setRetentionSettings,
    gatewaySettings,
    isLoadingSettings,
    handleSaveSettings,
    showAdvancedFilters,
    setShowAdvancedFilters,
    filterValues,
    setFilterValues,
    handleSaveCharge,
    handleMarkPaid,
    handleBlockInvoice,
    isDeletePlanModalOpen,
    setIsDeletePlanModalOpen,
    planToDelete,
    setPlanToDelete,
    deletePlanConfirmationInput,
    setDeletePlanConfirmationInput,
    isDeletingPlan,
    handleDeletePlan,
  } = saasState;

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentTab = tabConfig[activeTab] || tabConfig.overview;
  const TabIcon = currentTab.icon;

  return (
    <div className="admin-page animate-slide-up">
      {/* Flight Control Deck Header */}
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Administração', href: '/saas' },
              { label: currentTab.title },
            ]}
          />
          <h1 className="page-title">{currentTab.title}</h1>
          <p className="page-subtitle">{currentTab.subtitle}</p>
        </div>

        {/* Global SaaS Quick Actions */}
        <div className="page-actions">
          
          {activeTab === 'tenants' && (
            <button
              className="primary-btn"
              onClick={() => {
                saasState.setSelectedTenant(null);
                setIsTenantModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>NOVO PARCEIRO</span>
            </button>
          )}

          {activeTab === 'plans' && (
            <button
              className="primary-btn"
              onClick={() => {
                saasState.setSelectedPlan(null);
                setIsPlanModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>NOVO PLANO</span>
            </button>
          )}

          {activeTab === 'campaigns' && (
            <button
              className="primary-btn"
              onClick={() => {
                saasState.setSelectedCampaign(null);
                setIsCampaignModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>NOVA CAMPANHA</span>
            </button>
          )}

          {activeTab === 'billing' && (
            <button
              className="primary-btn"
              onClick={() => setIsChargeModalOpen(true)}
            >
              <Plus size={16} />
              <span>GERAR COBRANÇA</span>
            </button>
          )}

          {activeTab === 'addons' && (
            <button
              className="primary-btn"
              onClick={() => window.dispatchEvent(new CustomEvent('open-addon-modal'))}
            >
              <Plus size={16} />
              <span>NOVO MÓDULO EXTRA</span>
            </button>
          )}
        </div>
      </header>

      <main 
        className="saas-panel-main-content"
        style={{ paddingBottom: !saasState.isAuditDrawerOpen ? '80px' : '0' }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <OverviewTab key="overview" {...saasState} />}
          {activeTab === 'tenants' && <TenantsTab key="tenants" {...saasState} />}
          {activeTab === 'plans' && <PlansTab key="plans" {...saasState} />}
          {activeTab === 'addons' && <AddonsTab key="addons" {...saasState} />}
          {activeTab === 'campaigns' && <CampaignsTab key="campaigns" {...saasState} />}
          {activeTab === 'billing' && <BillingTab key="billing" {...saasState} />}
          {activeTab === 'settings' && <GatewaySettingsPage key="settings" {...saasState} />}
          {activeTab === 'branding' && <BrandingPage key="branding" />}
          {activeTab === 'landing' && <LandingPageSettings key="landing" />}
          {activeTab === 'login-settings' && <LoginSettingsPage key="login-settings" />}
          {activeTab === 'broadcast' && <BroadcastPage key="broadcast" />}
          {activeTab === 'health' && <HealthTab key="health" {...saasState} />}
          {activeTab === 'leads' && <LeadsTab key="leads" {...saasState} viewMode={saasState.leadsViewMode} setViewMode={saasState.setLeadsViewMode} />}
          {activeTab === 'analytics' && <AnalyticsTab key="analytics" {...saasState} />}
        </AnimatePresence>

        {/* Global Modals */}
        <TenantForm
          availablePlans={plansList}
          isOpen={isTenantModalOpen}
          onClose={() => setIsTenantModalOpen(false)}
          onSubmit={handleSaveTenant}
          initialData={selectedTenant}
        />

        <CreateDemoModal
          isOpen={isCreateDemoModalOpen}
          onClose={() => setIsCreateDemoModalOpen(false)}
          onSubmit={handleCreateDemoTenant}
          isSaving={isSaving}
        />

        <DeleteDemoModal
          isOpen={isDeleteDemoModalOpen}
          onClose={() => setIsDeleteDemoModalOpen(false)}
          onSubmit={handleDeleteDemoTenant}
          tenantToDelete={tenantToDelete}
          deleteConfirmationInput={deleteConfirmationInput}
          setDeleteConfirmationInput={setDeleteConfirmationInput}
          isDeleting={isDeleting}
        />

        <PlanForm
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          onSubmit={handleSavePlan}
          initialData={selectedPlan}
          isSubmitting={isSaving}
        />

        <DeletePlanModal
          isOpen={isDeletePlanModalOpen}
          onClose={() => setIsDeletePlanModalOpen(false)}
          onConfirmDelete={handleDeletePlan}
          planToDelete={planToDelete}
          deleteConfirmationInput={deletePlanConfirmationInput}
          setDeleteConfirmationInput={setDeletePlanConfirmationInput}
          isDeleting={isDeletingPlan}
        />

        <CampaignForm
          isOpen={isCampaignModalOpen}
          onClose={() => setIsCampaignModalOpen(false)}
          onSubmit={handleSaveCampaign}
          initialData={selectedCampaign}
          availablePlans={plansList}
          isSubmitting={isSaving}
        />

        <AuditLogTimelineModal
          isOpen={isAuditLogModalOpen}
          onClose={() => setIsAuditLogModalOpen(false)}
          selectedAuditTenant={selectedAuditTenant}
          auditLogs={auditLogs}
          logsLoading={logsLoading}
        />

        <ChargeModal
          isOpen={isChargeModalOpen}
          onClose={() => setIsChargeModalOpen(false)}
          onSave={handleSaveCharge}
          tenantsList={tenantsList}
        />

        <SystemAuditDrawer
          isOpen={isAuditDrawerOpen}
          onClose={() => setIsAuditDrawerOpen(false)}
          auditLogsList={auditLogsList}
        />

        <RetentionPolicyModal
          isOpen={isRetentionModalOpen}
          onClose={() => setIsRetentionModalOpen(false)}
          initialSettings={retentionSettings}
          onSave={handleSaveSettings}
        />

        <SaaSFilterModal
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filters={filterValues}
          setFilters={setFilterValues}
          activeTab={activeTab}
        />

        {/* Floating Action Button (FAB) para Auditoria Global */}
        <motion.button
          className="saas-audit-fab animate-pulse-glow"
          onClick={() => setIsAuditDrawerOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          title="Abrir Auditoria Global do Sistema"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, hsl(var(--brand)) 0%, hsl(var(--brand) / 0.85) 100%)',
            border: '1px solid hsl(var(--border) / 0.3)',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.45)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 9999,
            outline: 'none',
          }}
        >
          <FileText size={22} />
        </motion.button>

        <SaaSCommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          tenantsList={tenantsList}
          plansList={plansList}
          handleTabChange={handleTabChange}
          openEditTenant={saasState.openEditTenant}
          openEditPlan={saasState.openEditPlan}
        />
      </main>
    </div>
  );
};
