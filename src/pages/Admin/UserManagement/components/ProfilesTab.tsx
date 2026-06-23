import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, FileText, Edit2, XCircle, Plus } from 'lucide-react';
import { ModernTable } from '../../../../components/DataTable/ModernTable';
import { EmptyState } from '../../../../components/Feedback/EmptyState';

interface ProfilesTabProps {
  filteredProfiles: any[];
  profileColumns: any[];
  loading: boolean;
  profilesList: any[];
  viewMode: 'list' | 'grid';
  setIsProfileModalOpen: (open: boolean) => void;
  handleOpenEditProfile: (profile: any) => void;
  handleDeleteProfile: (id: string) => void;
}

export const ProfilesTab: React.FC<ProfilesTabProps> = ({
  filteredProfiles,
  profileColumns,
  loading,
  profilesList,
  viewMode,
  setIsProfileModalOpen,
  handleOpenEditProfile,
  handleDeleteProfile,
}) => {
  return (
    <>
      {viewMode === 'list' ? (
        <ModernTable
          data={filteredProfiles}
          columns={profileColumns}
          loading={loading}
          hideHeader={true}
          searchPlaceholder="Buscar perfil..."
          emptyState={
            profilesList.length === 0 ? (
              <EmptyState
                title="Nenhum perfil cadastrado"
                description="Você ainda não possui perfis de permissão cadastrados. Crie o primeiro para gerenciar permissões."
                actionLabel="Novo Perfil"
                onAction={() => setIsProfileModalOpen(true)}
                icon={Shield}
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
                className="action-dot edit"
                onClick={() => handleOpenEditProfile(item)}
                title="Editar"
              >
                <Edit2 size={18} />
              </button>
              <button
                className="action-dot delete"
                onClick={() => handleDeleteProfile(item.id)}
                title="Excluir"
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
          {(() => {
            if (filteredProfiles.length === 0) {
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
                    {profilesList.length === 0 ? (
                      <Shield size={22} style={{ color: 'hsl(var(--brand))' }} />
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
                    {profilesList.length === 0
                      ? 'Nenhum perfil cadastrado'
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
                    {profilesList.length === 0
                      ? 'Você ainda não possui perfis de permissão cadastrados.'
                      : 'Sua busca não retornou resultados.'}
                  </p>
                  {profilesList.length === 0 && (
                    <button
                      className="primary-btn"
                      onClick={() => setIsProfileModalOpen(true)}
                      style={{
                        fontSize: '10.5px',
                        padding: '6px 12px',
                        height: '30px',
                        marginTop: '4px',
                        minHeight: 'auto',
                      }}
                    >
                      <Plus size={12} />
                      <span>NOVO PERFIL</span>
                    </button>
                  )}
                </div>
              );
            }

            return filteredProfiles.map((profile) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="user-card-premium active"
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
                  <div
                    className="card-avatar profile-icon"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    }}
                  >
                    <Shield size={32} />
                  </div>
                  <span
                    className="status-pill active"
                    style={{ marginTop: '8px', fontSize: '9px' }}
                  >
                    {profile.userCount || 0} Ativos
                  </span>
                </div>
                <div className="card-main-content">
                  <div className="card-header-info">
                    <h3>{profile.nome}</h3>
                    <span className="card-role-badge">Perfil de Acesso</span>
                  </div>

                  <div className="card-meta-grid">
                    <div className="meta-item">
                      <FileText size={12} className="meta-icon" />
                      <span>{profile.descricao || 'Controle administrativo geral.'}</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        marginTop: '6px',
                      }}
                    >
                      {(profile.permissions || []).includes('all') ? (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            background: '#fef2f2',
                            color: '#ef4444',
                            padding: '4px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          🔴 ACESSO CRÍTICO (TOTAL)
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 900,
                            background: '#f0fdf4',
                            color: '#16a34a',
                            padding: '4px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          🟢 CONTROLE PARCIAL
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="card-bottom-actions"
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      marginTop: '6px',
                    }}
                  >
                    <button
                      className="action-icon-btn"
                      onClick={() => handleOpenEditProfile(profile)}
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="action-icon-btn delete"
                      onClick={() => handleDeleteProfile(profile.id)}
                      title="Excluir"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ));
          })()}
          <button
            className="add-user-card-premium"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <Plus size={32} />
            <span>NOVO PERFIL</span>
          </button>
        </motion.div>
      )}
    </>
  );
};
