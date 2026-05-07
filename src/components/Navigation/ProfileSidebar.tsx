import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Mail, 
  Shield, 
  LogOut, 
  Settings, 
  Monitor, 
  Bell,
  Lock,
  Edit2,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { userProfile } = useTenant();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="sidebar-overlay"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="profile-slideover"
          >
            <div className="slideover-header">
              <div className="title-group">
                <User size={20} className="text-brand" />
                <h2>Meu Perfil</h2>
              </div>
              <button onClick={onClose} className="close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="slideover-content">
              {/* Profile Hero */}
              <div className="quick-hero">
                <div className="avatar-large">
                  {userProfile?.full_name?.charAt(0) || 'U'}
                  <button className="edit-badge"><Edit2 size={12} /></button>
                </div>
                <div className="hero-meta">
                  <h3>{userProfile?.full_name || 'Usuário Elite'}</h3>
                  <span className="role-pill">{userProfile?.role || 'Administrador'}</span>
                  <p>{userProfile?.email}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="slide-section">
                <h4 className="section-title">Preferências Rápidas</h4>
                <div className="quick-switches">
                  <div className="q-switch">
                    <div className="q-info">
                      <span className="q-t">Modo Escuro</span>
                      <span className="q-d">Alterar tema da interface</span>
                    </div>
                    <button className={`q-toggle ${theme === 'dark' ? 'active' : ''}`} onClick={toggleTheme}>
                      <div className="q-dot" />
                    </button>
                  </div>
                  
                  <div className="q-switch">
                    <div className="q-info">
                      <span className="q-t">Notificações</span>
                      <span className="q-d">Alertas em tempo real</span>
                    </div>
                    <button className="q-toggle active">
                      <div className="q-dot" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="slide-section">
                <h4 className="section-title">Navegação</h4>
                <div className="slide-links">
                  <div onClick={() => handleNavigate('/admin/perfil')} className="slide-link" style={{ cursor: 'pointer' }}>
                    <Settings size={18} />
                    <span>Configurações Avançadas</span>
                  </div>
                  <div onClick={() => handleNavigate('/admin/usuarios?tab=seguranca')} className="slide-link" style={{ cursor: 'pointer' }}>
                    <Lock size={18} />
                    <span>Segurança & Acessos</span>
                  </div>
                  <div onClick={() => handleNavigate('/admin/auditoria')} className="slide-link" style={{ cursor: 'pointer' }}>
                    <FileText size={18} />
                    <span>Meu Histórico de Ações</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="slide-footer">
                <button className="logout-full-btn" onClick={logout}>
                  <LogOut size={18} />
                  <span>Encerrar Sessão</span>
                </button>
              </div>
            </div>
          </motion.div>

          <style>{`
            .sidebar-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(15, 23, 42, 0.4);
              backdrop-filter: blur(4px);
              z-index: 10001;
            }

            .profile-slideover {
              position: fixed;
              top: 0;
              right: 0;
              bottom: 0;
              width: 400px;
              background: white;
              box-shadow: -20px 0 50px rgba(0,0,0,0.1);
              z-index: 10002;
              display: flex;
              flex-direction: column;
            }

            .slideover-header {
              padding: 24px;
              border-bottom: 1px solid #f1f5f9;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .slideover-header h2 { font-size: 18px; font-weight: 800; color: #1e293b; }
            .title-group { display: flex; align-items: center; gap: 12px; }

            .close-btn {
              width: 36px;
              height: 36px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #64748b;
              transition: 0.2s;
              border: 1px solid #f1f5f9;
            }
            .close-btn:hover { background: #f8fafc; color: #1e293b; }

            .slideover-content { flex: 1; overflow-y: auto; padding: 24px; }

            .quick-hero {
              text-align: center;
              padding: 32px 0;
              border-bottom: 1px solid #f1f5f9;
              margin-bottom: 32px;
            }

            .avatar-large {
              width: 100px;
              height: 100px;
              background: #0f172a;
              color: white;
              border-radius: 36px;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 36px;
              font-weight: 800;
              position: relative;
            }

            .edit-badge {
              position: absolute;
              bottom: -4px;
              right: -4px;
              width: 28px;
              height: 28px;
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            }

            .hero-meta h3 { font-size: 20px; font-weight: 900; color: #1e293b; margin-bottom: 6px; }
            .role-pill { 
              padding: 4px 10px; 
              background: #f0fdf4; 
              color: #16a34a; 
              border-radius: 6px; 
              font-size: 10px; 
              font-weight: 900; 
              text-transform: uppercase;
              margin-bottom: 8px;
              display: inline-block;
            }
            .hero-meta p { font-size: 13px; color: #64748b; font-weight: 600; }

            .section-title { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
            .slide-section { margin-bottom: 32px; }

            .q-switch { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              padding: 16px; 
              background: #f8fafc; 
              border-radius: 16px; 
              margin-bottom: 12px;
            }
            .q-t { display: block; font-size: 13px; font-weight: 800; color: #334155; }
            .q-d { display: block; font-size: 11px; color: #64748b; font-weight: 500; }

            .q-toggle { width: 40px; height: 22px; background: #e2e8f0; border-radius: 20px; position: relative; transition: 0.3s; }
            .q-dot { position: absolute; left: 3px; top: 3px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: 0.3s; }
            .q-toggle.active { background: #16a34a; }
            .q-toggle.active .q-dot { left: 21px; }

            .slide-links { display: flex; flex-direction: column; gap: 8px; }
            .slide-link { 
              display: flex; 
              align-items: center; 
              gap: 12px; 
              padding: 14px; 
              border-radius: 12px; 
              color: #475569; 
              font-weight: 700; 
              font-size: 14px; 
              transition: 0.2s;
              text-decoration: none;
            }
            .slide-link:hover { background: #f8fafc; color: #16a34a; transform: translateX(5px); }

            .slide-footer { margin-top: auto; padding-top: 24px; border-top: 1px solid #f1f5f9; }
            .logout-full-btn {
              width: 100%;
              padding: 16px;
              background: #fef2f2;
              color: #ef4444;
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              font-weight: 800;
              font-size: 14px;
              transition: 0.2s;
            }
            .logout-full-btn:hover { background: #fee2e2; transform: translateY(-2px); }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
};
