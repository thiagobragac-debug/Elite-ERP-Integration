import React, { useState } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import {
  Search,
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
  History,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTenant } from '../../contexts/TenantContext';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

export const ProfilePage: React.FC = () => {
  const { userProfile } = useTenant();
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'pref' | 'security'>('info');

  // Local state for personal info
  const [formData, setFormData] = usePersistentState('ProfilePage_formData', {
    name: userProfile?.full_name || '',
    phone: '',
  });

  // Local state for preferences
  const [preferences, setPreferences] = useState({
    darkMode: true,
    biAlerts: false,
    dailySummary: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  const loginHistory = [
    {
      id: '1',
      date: new Date().toISOString(),
      event: 'Login via Chrome/Windows',
      ip: '189.12.34.56',
      status: 'Sucesso',
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000).toISOString(),
      event: 'Login via Mobile App',
      ip: '189.12.34.56',
      status: 'Sucesso',
    },
    {
      id: '3',
      date: new Date(Date.now() - 172800000).toISOString(),
      event: 'Alteração de Senha',
      ip: '189.12.34.56',
      status: 'Seguro',
    },
  ];

  return (
    <div className="profile-page-container">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Administração', href: '/admin/intelligence' },
              { label: 'Minha Identidade Digital' },
            ]}
          />
          <h1 className="page-title">Minha Identidade Digital</h1>
          <p className="page-subtitle">
            Gerencie suas informações pessoais, preferências de interface e histórico de segurança.
          </p>
        </div>
      </header>

      <div className="profile-layout-grid">
        {/* Left Sidebar - Quick Info */}
        <div className="profile-aside">
          <div className="profile-card main-info">
            <div className="avatar-section">
              <div className="avatar-circle">
                {userProfile?.full_name?.charAt(0) || 'U'}
                <button className="avatar-edit-btn">
                  <Camera size={16} />
                </button>
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
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="content-panel"
            >
              <div className="panel-header">
                <h3>Informações Básicas</h3>
                <p>Estes dados são usados para identificação em relatórios e auditorias.</p>
              </div>

              <div className="fields-grid">
                <div className="tauze-field">
                  <label>Nome Completo</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="tauze-field">
                  <label>E-mail (Principal)</label>
                  <input type="email" defaultValue={userProfile?.email ?? undefined} disabled />
                </div>
                <div className="tauze-field">
                  <label>Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="tauze-field">
                  <label>Cargo / Função</label>
                  <input type="text" defaultValue={userProfile?.role} disabled />
                </div>
              </div>

              <div className="panel-footer">
                <button
                  className={`primary-btn ${saved ? 'success' : ''}`}
                  onClick={handleSave}
                  disabled={isSaving}
                  style={saved ? { background: '#16a34a', borderColor: '#16a34a' } : {}}
                >
                  <Save size={18} />
                  {isSaving ? 'SALVANDO...' : saved ? 'ALTERAÇÕES SALVAS!' : 'SALVAR ALTERAÇÕES'}
                </button>
              </div>
            </motion.div>
          )}

          {activeSubTab === 'pref' && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="content-panel"
            >
              <div className="panel-header">
                <h3>Preferências de Interface</h3>
                <p>Personalize como o sistema se comporta para você.</p>
              </div>

              <div className="switches-list">
                <div
                  className="pref-switch"
                  onClick={() => setPreferences((p) => ({ ...p, darkMode: !p.darkMode }))}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="info">
                    <span className="t">Modo Escuro Automático</span>
                    <span className="d">Sincronizar com o horário do seu dispositivo.</span>
                  </div>
                  <div className={`toggle ${preferences.darkMode ? 'active' : ''}`} />
                </div>
                <div
                  className="pref-switch"
                  onClick={() => setPreferences((p) => ({ ...p, biAlerts: !p.biAlerts }))}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="info">
                    <span className="t">Notificações de BI</span>
                    <span className="d">Alertas críticos de GMD e metas no navegador.</span>
                  </div>
                  <div className={`toggle ${preferences.biAlerts ? 'active' : ''}`} />
                </div>
                <div
                  className="pref-switch"
                  onClick={() => setPreferences((p) => ({ ...p, dailySummary: !p.dailySummary }))}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="info">
                    <span className="t">Resumo Diário por E-mail</span>
                    <span className="d">Receber PDF com os KPIs da fazenda às 07:00.</span>
                  </div>
                  <div className={`toggle ${preferences.dailySummary ? 'active' : ''}`} />
                </div>
              </div>
            </motion.div>
          )}

          {activeSubTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="content-panel"
            >
              <div className="panel-header">
                <h3>Logs de Acesso & Segurança</h3>
                <p>Rastreabilidade completa das suas sessões no sistema.</p>
              </div>

              <div className="security-content">
                <ModernTable
                  emptyState={
                    <EmptyState
                      title="Nenhum registro encontrado"
                      description="Sua busca não retornou resultados."
                      icon={Search}
                    />
                  }
                  data={loginHistory}
                  columns={[
                    { header: 'Evento', accessor: 'event' },
                    {
                      header: 'Data/Hora',
                      accessor: (i: any) => new Date(i.date).toLocaleString(),
                    },
                    { header: 'IP', accessor: 'ip' },
                    {
                      header: 'Status',
                      accessor: (i: any) => <span className="status-pill active">{i.status}</span>,
                    },
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
          background: hsl(var(--bg-card));
          border-radius: 32px;
          border: 1px solid #f1f5f9;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }
        [data-theme='dark'] .profile-card {
          background: #1e293b;
          border-color: #334155;
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
        [data-theme='dark'] .avatar-circle {
          background: #020617;
        }

        .avatar-edit-btn {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 36px;
          height: 36px;
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        [data-theme='dark'] .avatar-edit-btn {
          background: #334155;
          border-color: #475569;
          color: white;
        }

        .avatar-section h3 { font-size: 20px; font-weight: 900; color: #1e293b; margin-bottom: 8px; }
        [data-theme='dark'] .avatar-section h3 { color: #f8fafc; }

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
        [data-theme='dark'] .role-badge {
          background: rgba(22, 163, 74, 0.2);
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

        .nav-item:hover { background: hsl(var(--bg-main)); color: #1e293b; }
        [data-theme='dark'] .nav-item:hover { background: #334155; color: #f8fafc; }
        .nav-item.active { background: #0f172a; color: white; }
        [data-theme='dark'] .nav-item.active { background: #16a34a; color: white; }

        .content-panel {
          background: hsl(var(--bg-card));
          border-radius: 32px;
          border: 1px solid #f1f5f9;
          padding: 40px;
          min-height: 500px;
          display: flex;
          flex-direction: column;
        }
        [data-theme='dark'] .content-panel {
          background: #1e293b;
          border-color: #334155;
        }

        .panel-header { margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px; }
        [data-theme='dark'] .panel-header { border-color: #334155; }
        .panel-header h3 { font-size: 22px; font-weight: 900; color: #1e293b; margin-bottom: 8px; }
        [data-theme='dark'] .panel-header h3 { color: #f8fafc; }
        .panel-header p { color: #64748b; font-size: 14px; font-weight: 500; }
        [data-theme='dark'] .panel-header p { color: #94a3b8; }

        .fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .tauze-field label { display: block; font-size: 11px; font-weight: 800; color: #94a3b8; margin-bottom: 10px; text-transform: uppercase; }
        .tauze-field input {
          width: 100%;
          padding: 14px 20px;
          background: hsl(var(--bg-main));
          border: 2px solid #f1f5f9;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          outline: none;
          transition: 0.2s;
        }
        [data-theme='dark'] .tauze-field input {
          background: #0f172a;
          border-color: #1e293b;
          color: #f8fafc;
        }
        .tauze-field input:focus { border-color: #16a34a; background: hsl(var(--bg-card)); }
        [data-theme='dark'] .tauze-field input:focus { background: #1e293b; border-color: #16a34a; }
        .tauze-field input:disabled { opacity: 0.5; cursor: not-allowed; }

        .panel-footer { margin-top: auto; padding-top: 40px; border-top: 1px solid #f1f5f9; }
        [data-theme='dark'] .panel-footer { border-color: #334155; }

        .switches-list { display: flex; flex-direction: column; gap: 16px; }
        .pref-switch {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: hsl(var(--bg-main));
          border-radius: 24px;
          border: 1px solid #f1f5f9;
        }
        [data-theme='dark'] .pref-switch {
          background: #0f172a;
          border-color: #1e293b;
        }
        .pref-switch .t { display: block; font-size: 15px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
        [data-theme='dark'] .pref-switch .t { color: #f8fafc; }
        .pref-switch .d { display: block; font-size: 12px; color: #64748b; font-weight: 600; }
        [data-theme='dark'] .pref-switch .d { color: #94a3b8; }

        .toggle { width: 50px; height: 26px; background: #e2e8f0; border-radius: 20px; position: relative; cursor: pointer; transition: 0.3s; }
        [data-theme='dark'] .toggle { background: #334155; }
        .toggle::after { content: ''; position: absolute; left: 4px; top: 4px; width: 18px; height: 18px; background: hsl(var(--bg-card)); border-radius: 50%; transition: 0.3s; }
        .toggle.active { background: #16a34a; }
        .toggle.active::after { left: 28px; }
      `}</style>
    </div>
  );
};
