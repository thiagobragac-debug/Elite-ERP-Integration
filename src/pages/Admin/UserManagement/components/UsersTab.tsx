import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Shield,
  Mail,
  Monitor,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  History,
  Plus,
  XCircle,
} from 'lucide-react';
import { ModernTable } from '../../../../components/DataTable/ModernTable';
import { EmptyState } from '../../../../components/Feedback/EmptyState';
import { useTenant } from '../../../../contexts/TenantContext';

interface UsersTabProps {
  filteredUsers: any[];
  userColumns: any[];
  loading: boolean;
  usersList: any[];
  viewMode: 'list' | 'grid';
  setIsUserModalOpen: (open: boolean) => void;
  handleViewUserLogs: (user: any) => void;
  handleOpenEditUser: (user: any) => void;
  handleDeleteUser: (user: any) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  filteredUsers,
  userColumns,
  loading,
  usersList,
  viewMode,
  setIsUserModalOpen,
  handleViewUserLogs,
  handleOpenEditUser,
  handleDeleteUser,
}) => {
  const { userProfile } = useTenant();
  const isSaasAdmin = userProfile?.role === 'SAAS_ADMIN';

  return (
    <>
      {viewMode === 'list' ? (
        <ModernTable
          data={filteredUsers}
          columns={userColumns}
          loading={loading}
          hideHeader={true}
          searchPlaceholder="Buscar por nome, email..."
          emptyState={
            usersList.length === 0 ? (
              <EmptyState
                title="Nenhum usuário cadastrado"
                description="Não há usuários cadastrados nesta unidade. Comece cadastrando o primeiro."
                actionLabel="Novo Usuário"
                onAction={() => setIsUserModalOpen(true)}
                icon={Users}
              />
            ) : (
              <EmptyState
                title="Nenhum registro encontrado"
                description="Sua busca não retornou resultados."
                icon={Search}
              />
            )
          }
          actions={(item) => (
            <div className="modern-actions">
              <button
                className="action-dot info"
                onClick={() => handleViewUserLogs(item)}
                title="Logs"
              >
                <History size={18} />
              </button>
              <button
                className="action-dot edit"
                onClick={() => handleOpenEditUser(item)}
                title="Editar"
              >
                <Edit2 size={18} />
              </button>
              <button
                className={`action-dot delete ${
                  !isSaasAdmin &&
                  (item.base_role?.toUpperCase() === 'ADMIN' ||
                    item.profile?.toLowerCase().includes('admin'))
                    ? 'disabled'
                    : ''
                }`}
                style={
                  !isSaasAdmin &&
                  (item.base_role?.toUpperCase() === 'ADMIN' ||
                    item.profile?.toLowerCase().includes('admin'))
                    ? { opacity: 0.3, cursor: 'not-allowed' }
                    : {}
                }
                onClick={() => {
                  if (
                    !isSaasAdmin &&
                    (item.base_role?.toUpperCase() === 'ADMIN' ||
                      item.profile?.toLowerCase().includes('admin'))
                  ) {
                    return;
                  }
                  handleDeleteUser(item);
                }}
                title={
                  !isSaasAdmin &&
                  (item.base_role?.toUpperCase() === 'ADMIN' ||
                    item.profile?.toLowerCase().includes('admin'))
                    ? 'Apenas Admin SaaS pode excluir administradores'
                    : 'Excluir'
                }
              >
                <XCircle size={18} />
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
          {filteredUsers.length === 0 ? (
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
                boxShadow: 'none',
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
                  justifyContent: 'center',
                }}
              >
                {usersList.length === 0 ? (
                  <Users size={22} style={{ color: 'hsl(var(--brand))' }} />
                ) : (
                  <Search size={22} />
                )}
              </div>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-main))',
                  margin: 0,
                }}
              >
                {usersList.length === 0
                  ? 'Nenhum usuário cadastrado'
                  : 'Nenhum registro encontrado'}
              </h3>
              <p
                style={{
                  fontSize: '10.5px',
                  color: '#64748b',
                  margin: 0,
                  lineHeight: '1.3',
                  maxWidth: '260px',
                }}
              >
                {usersList.length === 0
                  ? 'Não há usuários cadastrados nesta unidade.'
                  : 'Sua busca não retornou resultados.'}
              </p>
              {usersList.length === 0 && (
                <button
                  className="primary-btn"
                  onClick={() => setIsUserModalOpen(true)}
                  style={{
                    fontSize: '10.5px',
                    padding: '6px 12px',
                    height: '30px',
                    marginTop: '4px',
                    minHeight: 'auto',
                  }}
                >
                  <Plus size={12} />
                  <span>NOVO USUÁRIO</span>
                </button>
              )}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`user-card-premium ${user.status === 'active' ? 'active' : ''}`}
              >
                <div
                  className="card-left-section"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {(() => {
                    const isUserAdmin =
                      user.profile?.toLowerCase().includes('admin') ||
                      user.base_role?.toUpperCase() === 'ADMIN';
                    return (
                      <div className={`card-avatar ${isUserAdmin ? 'admin-avatar' : ''}`}>
                        {isUserAdmin ? (
                          <Shield size={32} className="admin-shield-icon" />
                        ) : (
                          user.name?.charAt(0) || 'U'
                        )}
                      </div>
                    );
                  })()}
                  <span
                    className={`status-pill ${user.status === 'active' ? 'active' : 'stopped'}`}
                    style={{ marginTop: '8px', fontSize: '9px' }}
                  >
                    {user.status === 'active' ? '● Online' : '○ Offline'}
                  </span>
                </div>
                <div className="card-main-content">
                  <div className="card-header-info">
                    <h3>{user.name}</h3>
                    <span className="card-role-badge">{user.profile || 'Usuário'}</span>
                  </div>

                  <div className="card-meta-grid">
                    <div className="meta-item">
                      <Mail size={12} className="meta-icon" />
                      <span>{user.email}</span>
                    </div>
                    <div className="meta-item">
                      <Monitor size={12} className="meta-icon" />
                      <span>{user.farm || 'Unidade Geral'}</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '4px',
                      }}
                    >
                      {user.mfa_enabled ? (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            background: '#f5f3ff',
                            color: '#7c3aed',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <ShieldCheck size={10} /> 2FA ATIVO
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            background: '#fef2f2',
                            color: '#ef4444',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <ShieldAlert size={10} /> 2FA DESATIVADO
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="card-bottom-actions"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '6px',
                    }}
                  >
                    <span
                      className="sub-meta"
                      style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8' }}
                    >
                      Cadastrado: {user.memberSince}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <button
                        className="action-icon-btn"
                        onClick={() => handleOpenEditUser(user)}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="action-icon-btn"
                        onClick={() => handleViewUserLogs(user)}
                        title="Auditoria"
                      >
                        <History size={14} />
                      </button>
                      <button
                        className={`action-icon-btn delete ${
                          !isSaasAdmin &&
                          (user.base_role?.toUpperCase() === 'ADMIN' ||
                            user.profile?.toLowerCase().includes('admin'))
                            ? 'disabled'
                            : ''
                        }`}
                        style={
                          !isSaasAdmin &&
                          (user.base_role?.toUpperCase() === 'ADMIN' ||
                            user.profile?.toLowerCase().includes('admin'))
                            ? { opacity: 0.3, cursor: 'not-allowed' }
                            : {}
                        }
                        onClick={() => {
                          if (
                            !isSaasAdmin &&
                            (user.base_role?.toUpperCase() === 'ADMIN' ||
                              user.profile?.toLowerCase().includes('admin'))
                          ) {
                            return;
                          }
                          handleDeleteUser(user);
                        }}
                        title={
                          !isSaasAdmin &&
                          (user.base_role?.toUpperCase() === 'ADMIN' ||
                            user.profile?.toLowerCase().includes('admin'))
                            ? 'Apenas Admin SaaS pode excluir administradores'
                            : 'Excluir'
                        }
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
          <button className="add-user-card-premium" onClick={() => setIsUserModalOpen(true)}>
            <Plus size={32} />
            <span>NOVO USUÁRIO</span>
          </button>
        </motion.div>
      )}
    </>
  );
};
