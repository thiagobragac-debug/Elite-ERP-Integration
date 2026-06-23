import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Shield,
  CheckCircle2,
  Search,
  Filter,
  FileText,
  List as ListIcon,
  LayoutGrid,
} from 'lucide-react';

import { useUserManagementState } from './UserManagement/hooks/useUserManagementState';
import { UsersTab } from './UserManagement/components/UsersTab';
import { ProfilesTab } from './UserManagement/components/ProfilesTab';
import { SecurityTab } from './UserManagement/components/SecurityTab';
import './UserManagement/UserManagement.css';

import { UserForm } from '../../components/Forms/UserForm';
import { ProfileForm } from '../../components/Forms/ProfileForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { UserFilterModal } from './components/UserFilterModal';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { useTenantCore } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';

export const UserManagement: React.FC = () => {
  const {
    searchTerm,
    setSearchTerm,
    usersList,
    profilesList,
    loading,
    isUserModalOpen,
    setIsUserModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    saveSuccess,
    activeTab,
    setActiveTab,
    selectedProfile,
    setSelectedProfile,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    historyItems,
    historyLoading,
    selectedUser,
    setSelectedUser,
    viewMode,
    setViewMode,
    securitySettings,
    showAdvancedFilters,
    setShowAdvancedFilters,
    filterValues,
    setFilterValues,
    stats,
    isAdmin,
    liveLogs,
    setLiveLogs,
    terminalSeverity,
    setTerminalSeverity,
    isTerminalRunning,
    setIsTerminalRunning,
    anomalies,
    handleMitigateAnomaly,
    toggleSecuritySetting,
    handleToggleMaintenanceMode,
    handleAddUser,
    handleAddProfile,
    handleDeleteProfile,
    handleOpenEditProfile,
    handleOpenEditUser,
    handleViewUserLogs,
    handleDeleteUser,
    filteredUsers,
    filteredProfiles,
    userColumns,
    profileColumns,
  } = useUserManagementState();

  const { tenant } = useTenantCore();
  const usersLimit = tenant?.plan_details?.users_limit || 99999;
  const activeUsersCount = usersList.filter(u => u.status === 'active' || u.status === 'Ativo').length;
  const isUserLimitReached = activeTab === 'users' && activeUsersCount >= usersLimit;

  const handleAddClick = () => {
    if (activeTab === 'users') {
      if (isUserLimitReached) {
        import('react-hot-toast').then(({ toast }) => {
          toast.error(`Limite de ${usersLimit} usuários atingido no seu Plano. Faça um Upgrade para adicionar mais membros.`, { duration: 5000 });
        });
        return;
      }
      setIsUserModalOpen(true);
    } else {
      setIsProfileModalOpen(true);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const filteredData =
      activeTab === 'users'
        ? usersList.filter((u) => {
            const matchesSearch =
              (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
              (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterValues.status === 'all' || u.status === filterValues.status;
            const matchesProfile =
              filterValues.profileId === 'all' || u.perfil_id === filterValues.profileId;
            const matchesMFA = !filterValues.mfaOnly || u.mfa_enabled;
            const matchesDate =
              (!filterValues.dateStart ||
                new Date(u.created_at) >= new Date(filterValues.dateStart)) &&
              (!filterValues.dateEnd || new Date(u.created_at) <= new Date(filterValues.dateEnd));
            return matchesSearch && matchesStatus && matchesProfile && matchesMFA && matchesDate;
          })
        : profilesList.filter((p) =>
            (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
          );

    const exportData =
      activeTab === 'users'
        ? filteredData.map((item) => ({
            Nome: item.name,
            Email: item.email,
            Perfil: item.profile,
            Unidade: item.farm || '-',
            Membro_Desde: item.memberSince,
            MFA: item.mfa_enabled ? 'SIM' : 'NÃO',
            Status: item.status,
          }))
        : filteredData.map((item) => ({
            Perfil: item.nome,
            Descricao: item.descricao || '-',
            Usuarios: item.userCount || 0,
            Permissoes: (item.permissoes || []).join(', '),
          }));

    const filename = activeTab === 'users' ? 'usuarios' : 'perfis_acesso';
    const title =
      activeTab === 'users' ? 'Relatório de Usuários do Sistema' : 'Relatório de Perfis de Acesso';

    if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else if (format === 'excel') {
      exportToExcel(exportData, filename);
    } else if (format === 'pdf') {
      exportToPDF(exportData, filename, title);
    }
  };

  return (
    <div className="admin-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Administração', href: '/admin/intelligence' },
              { label: 'Governança & Segurança de Acesso' },
            ]}
          />
          <h1 className="page-title">Governança & Segurança de Acesso</h1>
          <p className="page-subtitle">
            Gestão estratégica de identidades, perfis de permissão e políticas críticas de
            segurança.
          </p>
        </div>
        <div className="page-actions">
          {activeTab !== 'seguranca' && (
            <button
              className={`primary-btn ${isUserLimitReached ? 'disabled' : ''}`}
              onClick={handleAddClick}
              style={isUserLimitReached ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              {activeTab === 'users' ? <UserPlus size={18} /> : <Shield size={18} />}
              <span>{activeTab === 'users' ? 'ADICIONAR USUÁRIO' : 'CRIAR PERFIL'}</span>
            </button>
          )}

          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="save-toast-tauze"
                style={{ background: 'hsl(161 64% 39%)', color: 'white', border: 'none' }}
              >
                <CheckCircle2 size={16} />
                <span>Políticas Sincronizadas</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <KPISkeleton key={i} />)
          : stats.map((stat, idx) => (
              <TauzeStatCard
                key={idx}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                progress={stat.progress}
                change={stat.change}
                periodLabel={stat.periodLabel}
                sparkline={stat.sparkline}
              />
            ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button
            className={`tauze-tab-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Usuários
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'profiles' ? 'active' : ''}`}
            onClick={() => setActiveTab('profiles')}
          >
            Perfis de Acesso
          </button>
          {isAdmin && (
            <button
              className={`tauze-tab-item ${activeTab === 'seguranca' ? 'active' : ''}`}
              onClick={() => setActiveTab('seguranca')}
            >
              Segurança de Acesso
            </button>
          )}
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder={
              activeTab === 'users'
                ? 'Buscar por nome, email...'
                : activeTab === 'profiles'
                  ? 'Buscar perfil ou cargo...'
                  : 'Filtrar políticas de segurança...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {(activeTab === 'users' || activeTab === 'profiles') && (
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
        )}

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
                const menu = document.getElementById('export-menu-users');
                if (menu) {
                  menu.classList.toggle('active');
                }
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-users" className="export-menu">
              <button
                onClick={() => {
                  handleExport('csv');
                  document.getElementById('export-menu-users')?.classList.remove('active');
                }}
              >
                Excel (.CSV)
              </button>
              <button
                onClick={() => {
                  handleExport('excel');
                  document.getElementById('export-menu-users')?.classList.remove('active');
                }}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  handleExport('pdf');
                  document.getElementById('export-menu-users')?.classList.remove('active');
                }}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <UserFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
        profiles={profilesList}
      />

      <div className="management-content">
        {activeTab === 'users' && (
          <UsersTab
            filteredUsers={filteredUsers}
            userColumns={userColumns}
            loading={loading}
            usersList={usersList}
            viewMode={viewMode}
            setIsUserModalOpen={setIsUserModalOpen}
            handleViewUserLogs={handleViewUserLogs}
            handleOpenEditUser={handleOpenEditUser}
            handleDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === 'profiles' && (
          <ProfilesTab
            filteredProfiles={filteredProfiles}
            profileColumns={profileColumns}
            loading={loading}
            profilesList={profilesList}
            viewMode={viewMode}
            setIsProfileModalOpen={setIsProfileModalOpen}
            handleOpenEditProfile={handleOpenEditProfile}
            handleDeleteProfile={handleDeleteProfile}
          />
        )}

        {activeTab === 'seguranca' && isAdmin && (
          <SecurityTab
            securitySettings={securitySettings}
            toggleSecuritySetting={toggleSecuritySetting}
            handleToggleMaintenanceMode={handleToggleMaintenanceMode}
            anomalies={anomalies}
            liveLogs={liveLogs}
            setLiveLogs={setLiveLogs}
            terminalSeverity={terminalSeverity}
            setTerminalSeverity={setTerminalSeverity}
            isTerminalRunning={isTerminalRunning}
            setIsTerminalRunning={setIsTerminalRunning}
            handleMitigateAnomaly={handleMitigateAnomaly}
          />
        )}
      </div>

      <UserForm
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleAddUser}
        initialData={selectedUser}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Logs de Atividade"
        subtitle="Rastreamento de ações do usuário"
        items={historyItems}
        loading={historyLoading}
      />

      <ProfileForm
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedProfile(null);
        }}
        onSubmit={handleAddProfile}
        initialData={selectedProfile}
      />
    </div>
  );
};
