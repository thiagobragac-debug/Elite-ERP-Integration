import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Monitor, 
  Bell, 
  Lock, 
  Edit2, 
  FileText,
  Save,
  Camera,
  History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTenant } from '../../contexts/TenantContext';
import { ModernTable } from '../../components/DataTable/ModernTable';

export const ProfilePage: React.FC = () => {
  const { userProfile } = useTenant();
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'pref' | 'security'>('info');

  const loginHistory = [
    { id: '1', date: new Date().toISOString(), event: 'Login via Chrome/Windows', ip: '189.12.34.56', status: 'Sucesso' },
    { id: '2', date: new Date(Date.now() - 86400000).toISOString(), event: 'Login via Mobile App', ip: '189.12.34.56', status: 'Sucesso' },
    { id: '3', date: new Date(Date.now() - 172800000).toISOString(), event: 'Alteração de Senha', ip: '189.12.34.56', status: 'Seguro' },
  ];

  return (
    <div className="profile-page-container">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <User size={14} fill="currentColor" />
            <span>ELITE PROFILE v5.0</span>
          </div>
          <h1 className="page-title">Minha Identidade Digital</h1>
          <p className="page-subtitle">Gerencie suas informações pessoais, preferências de interface e histórico de segurança.</p>
        </div>
      </header>

      <div className="profile-layout-grid">
        {/* Left Sidebar - Quick Info */}
        <div className="profile-aside">
          <div className="profile-card main-info">
            <div className="avatar-section">
              <div className="avatar-circle">
                {userProfile?.full_name?.charAt(0) || 'U'}
                <button className="avatar-edit-btn"><Camera size={16} /></button>
              </div>
              <h3>{userProfile?.full_name}</h3>
              <span className="role-badge">{userProfile?.role || 'Administrador'}</span>
            </div>
            
            <nav className="profile-nav">
              <button 
                className={`nav-item ${activeSubTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('info')}
              >
                <User size={18} />
                <span>Dados Pessoais</span>
              </button>
              <button 
                className={`nav-item ${activeSubTab === 'pref' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('pref')}
              >
                <Monitor size={18} />
                <span>Preferências</span>
              </button>
              <button 
                className={`nav-item ${activeSubTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('security')}
              >
                <Lock size={18} />
                <span>Segurança</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="profile-main">
          {activeSubTab === 'info' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="content-panel">
              <div className="panel-header">
                <h3>Informações Básicas</h3>
                <p>Estes dados são usados para identificação em relatórios e auditorias.</p>
              </div>
              
              <div className="fields-grid">
                <div className="elite-field">
                  <label>Nome Completo</label>
                  <input type="text" defaultValue={userProfile?.full_name} />
                </div>
                <div className="elite-field">
                  <label>E-mail (Principal)</label>
                  <input type="email" defaultValue={userProfile?.email} disabled />
                </div>
                <div className="elite-field">
                  <label>Telefone / WhatsApp</label>
                  <input type="text" placeholder="(00) 00000-0000" />
                </div>
                <div className="elite-field">
                  <label>Cargo / Função</label>
                  <input type="text" defaultValue={userProfile?.role} disabled />
                </div>
              </div>

              <div className="panel-footer">
                <button className="primary-btn">
                  <Save size={18} />
                  SALVAR ALTERAÇÕES
                </button>
              </div>
            </motion.div>
          )}

          {activeSubTab === 'pref' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="content-panel">
              <div className="panel-header">
                <h3>Preferências de Interface</h3>
                <p>Personalize como o sistema se comporta para você.</p>
              </div>
              
              <div className="switches-list">
                <div className="pref-switch">
                  <div className="info">
                    <span className="t">Modo Escuro Automático</span>
                    <span className="d">Sincronizar com o horário do seu dispositivo.</span>
                  </div>
                  <div className="toggle active"></div>
                </div>
                <div className="pref-switch">
                  <div className="info">
                    <span className="t">Notificações de BI</span>
                    <span className="d">Alertas críticos de GMD e metas no navegador.</span>
                  </div>
                  <div className="toggle"></div>
                </div>
                <div className="pref-switch">
                  <div className="info">
                    <span className="t">Resumo Diário por E-mail</span>
                    <span className="d">Receber PDF com os KPIs da fazenda às 07:00.</span>
                  </div>
                  <div className="toggle active"></div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSubTab === 'security' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="content-panel">
              <div className="panel-header">
                <h3>Logs de Acesso & Segurança</h3>
                <p>Rastreabilidade completa das suas sessões no sistema.</p>
              </div>
              
              <div className="security-content">
                <ModernTable 
                  data={loginHistory}
                  columns={[
                    { header: 'Evento', accessor: 'event' },
                    { header: 'Data/Hora', accessor: (i: any) => new Date(i.date).toLocaleString() },
                    { header: 'IP', accessor: 'ip' },
                    { header: 'Status', accessor: (i: any) => <span className="status-pill active">{i.status}</span> }
                  ]}
                  hideHeader={true}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style>{`
        .profile-page-container { padding: 0; }
        .profile-layout-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 32px;
          margin-top: 32px;
        }

        .profile-card {
          background: white;
          border-radius: 32px;
          border: 1px solid #f1f5f9;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .avatar-section {
          text-align: center;
          margin-bottom: 40px;
        }

        .avatar-circle {
          width: 120px;
          height: 120px;
          background: #0f172a;
          color: white;
          border-radius: 44px;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 800;
          position: relative;
        }

        .avatar-edit-btn {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 36px;
          height: 36px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .avatar-section h3 { font-size: 20px; font-weight: 900; color: #1e293b; margin-bottom: 8px; }
        .role-badge {
          display: inline-block;
          padding: 6px 16px;
          background: #f0fdf4;
          color: #16a34a;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .profile-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: 16px;
          color: #64748b;
          font-weight: 700;
          transition: 0.2s;
          background: transparent;
        }

        .nav-item:hover { background: #f8fafc; color: #1e293b; }
        .nav-item.active { background: #0f172a; color: white; }

        .content-panel {
          background: white;
          border-radius: 32px;
          border: 1px solid #f1f5f9;
          padding: 40px;
          min-height: 500px;
          display: flex;
          flex-direction: column;
        }

        .panel-header { margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px; }
        .panel-header h3 { font-size: 22px; font-weight: 900; color: #1e293b; margin-bottom: 8px; }
        .panel-header p { color: #64748b; font-size: 14px; font-weight: 500; }

        .fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .elite-field label { display: block; font-size: 11px; font-weight: 800; color: #94a3b8; margin-bottom: 10px; text-transform: uppercase; }
        .elite-field input {
          width: 100%;
          padding: 14px 20px;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          outline: none;
          transition: 0.2s;
        }
        .elite-field input:focus { border-color: #16a34a; background: white; }
        .elite-field input:disabled { opacity: 0.5; cursor: not-allowed; }

        .panel-footer { margin-top: auto; padding-top: 40px; border-top: 1px solid #f1f5f9; }

        .switches-list { display: flex; flex-direction: column; gap: 16px; }
        .pref-switch {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: #f8fafc;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
        }
        .pref-switch .t { display: block; font-size: 15px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
        .pref-switch .d { display: block; font-size: 12px; color: #64748b; font-weight: 600; }

        .toggle { width: 50px; height: 26px; background: #e2e8f0; border-radius: 20px; position: relative; cursor: pointer; transition: 0.3s; }
        .toggle::after { content: ''; position: absolute; left: 4px; top: 4px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: 0.3s; }
        .toggle.active { background: #16a34a; }
        .toggle.active::after { left: 28px; }
      `}</style>
    </div>
  );
};
