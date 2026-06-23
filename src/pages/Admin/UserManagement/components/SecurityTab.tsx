import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Monitor,
  ShieldAlert,
  Terminal,
  Pause,
  Play,
  ShieldCheck,
} from 'lucide-react';

interface SecurityTabProps {
  securitySettings: {
    min_8_chars: boolean;
    special_chars: boolean;
    num_letters: boolean;
    inactivity_30m: boolean;
    force_logout: boolean;
    multi_device: boolean;
    block_3_attempts: boolean;
    geo_ip_check: boolean;
    mfa_required: boolean;
    maintenance_mode: boolean;
  };
  toggleSecuritySetting: (key: any) => Promise<void>;
  handleToggleMaintenanceMode: () => Promise<void>;
  anomalies: any[];
  liveLogs: any[];
  setLiveLogs: React.Dispatch<React.SetStateAction<any[]>>;
  terminalSeverity: 'ALL' | 'INFO' | 'WARN' | 'CRITICAL';
  setTerminalSeverity: (severity: 'ALL' | 'INFO' | 'WARN' | 'CRITICAL') => void;
  isTerminalRunning: boolean;
  setIsTerminalRunning: (running: boolean) => void;
  handleMitigateAnomaly: (id: string, action: 'dismiss' | 'block' | 'suspend') => Promise<void>;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  securitySettings,
  toggleSecuritySetting,
  handleToggleMaintenanceMode,
  anomalies,
  liveLogs,
  setLiveLogs,
  terminalSeverity,
  setTerminalSeverity,
  isTerminalRunning,
  setIsTerminalRunning,
  handleMitigateAnomaly,
}) => {
  return (
    <div className="security-intelligence-layout">
      <div className="security-settings-grid">
        <section className="security-panel">
          <div className="panel-header">
            <div className="icon-badge">
              <Lock size={20} />
            </div>
            <div>
              <h3>Políticas de Senha</h3>
              <p>Configurações críticas de complexidade e validade.</p>
            </div>
          </div>
          <div className="security-options">
            {[
              { label: 'Mínimo de 8 caracteres', key: 'min_8_chars' },
              { label: 'Exigir Caracteres Especiais', key: 'special_chars' },
              { label: 'Exigir Números e Letras', key: 'num_letters' },
            ].map((opt) => (
              <div
                key={opt.key}
                className="option-row"
                onClick={() => toggleSecuritySetting(opt.key as any)}
              >
                <span>{opt.label}</span>
                <div
                  className={`tauze-toggle ${securitySettings[opt.key as keyof typeof securitySettings] ? 'active' : ''}`}
                >
                  <div className="toggle-dot" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="security-panel">
          <div className="panel-header">
            <div className="icon-badge">
              <Monitor size={20} />
            </div>
            <div>
              <h3>Gestão de Sessões</h3>
              <p>Controle de tempo e acessos simultâneos.</p>
            </div>
          </div>
          <div className="security-options">
            {[
              { label: 'Inatividade (30 min)', key: 'inactivity_30m' },
              { label: 'Acesso Multi-dispositivo', key: 'multi_device' },
              { label: 'Verificação Geográfica', key: 'geo_ip_check' },
            ].map((opt) => (
              <div
                key={opt.key}
                className="option-row"
                onClick={() => toggleSecuritySetting(opt.key as any)}
              >
                <span>{opt.label}</span>
                <div
                  className={`tauze-toggle ${securitySettings[opt.key as keyof typeof securitySettings] ? 'active' : ''}`}
                >
                  <div className="toggle-dot" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="security-panel">
          <div className="panel-header">
            <div
              className="icon-badge"
              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3>System Guard</h3>
              <p>Proteção ativa e modo de contingência.</p>
            </div>
          </div>
          <div className="security-options">
            <div
              className="option-row"
              onClick={() => toggleSecuritySetting('block_3_attempts')}
            >
              <span>Bloqueio (3 falhas)</span>
              <div
                className={`tauze-toggle ${securitySettings.block_3_attempts ? 'active' : ''}`}
              >
                <div className="toggle-dot" />
              </div>
            </div>
            <button
              className={`maintenance-btn ${securitySettings.maintenance_mode ? 'maintenance-active' : ''}`}
              onClick={handleToggleMaintenanceMode}
            >
              <ShieldAlert
                size={16}
                className={securitySettings.maintenance_mode ? 'animate-pulse text-white' : ''}
              />
              <span>
                {securitySettings.maintenance_mode
                  ? 'DESATIVAR MANUTENÇÃO (ATIVO)'
                  : 'MODO DE MANUTENÇÃO'}
              </span>
            </button>
            {anomalies.length > 0 ? (
              <div
                className="guard-status-alert alert-active"
                style={{ background: '#fef2f2', color: '#ef4444' }}
              >
                <div className="pulsing-dot red" />
                <span>{anomalies.length} Ameaça(s) detectada(s) nas últimas 24h</span>
              </div>
            ) : (
              <div
                className="guard-status-alert"
                style={{ background: '#f0fdf4', color: '#16a34a' }}
              >
                <div className="pulsing-dot" />
                <span>Nenhum ataque detectado nas últimas 24h</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Novas Seções Premium de Segurança (Terminal e Anomalias) */}
      <div
        className="security-advanced-grid"
        style={{
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: '24px',
        }}
      >
        {/* Terminal de Auditoria Interativo */}
        <section
          className={`security-panel terminal-panel ${isTerminalRunning ? 'terminal-dark' : 'terminal-light'}`}
          style={{
            padding: '20px',
            height: '480px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            className="panel-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '14px',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                className="icon-badge"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
              >
                <Terminal size={18} />
              </div>
              <div>
                <h3 className="terminal-title" style={{ fontSize: '0.8125rem', margin: 0 }}>
                  Terminal de Auditoria Interativo
                </h3>
                <p
                  className="terminal-subtitle"
                  style={{ fontSize: '0.6875rem', margin: '2px 0 0 0' }}
                >
                  Stream ao vivo de eventos de segurança do System Guard
                </p>
              </div>
            </div>

            {/* Controles do Terminal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsTerminalRunning(!isTerminalRunning)}
                className={`terminal-ctrl-btn ${isTerminalRunning ? 'active' : ''}`}
                title={isTerminalRunning ? 'Pausar Monitoramento' : 'Iniciar Monitoramento'}
              >
                {isTerminalRunning ? <Pause size={12} /> : <Play size={12} />}
                {isTerminalRunning ? 'LIVE' : 'PAUSADO'}
              </button>
              <button
                type="button"
                onClick={() => setLiveLogs([])}
                className="terminal-ctrl-btn clear-btn"
                title="Limpar Console"
              >
                LIMPAR
              </button>
            </div>
          </div>

          {/* Filtros de Severidade */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {(['ALL', 'INFO', 'WARN', 'CRITICAL'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setTerminalSeverity(sev)}
                className={`terminal-filter-btn ${terminalSeverity === sev ? 'active' : ''}`}
              >
                {sev === 'ALL' ? 'TODOS' : sev}
              </button>
            ))}
          </div>

          {/* Área de Logs */}
          <div
            className="terminal-logs-screen"
            style={{
              flex: 1,
              borderRadius: '12px',
              padding: '16px',
              fontFamily: 'JetBrains Mono, Courier New, monospace',
              fontSize: '11px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <AnimatePresence>
              {liveLogs
                .filter((l) => terminalSeverity === 'ALL' || l.type === terminalSeverity)
                .map((log) => {
                  const sevColor =
                    log.type === 'CRITICAL'
                      ? '#f43f5e'
                      : log.type === 'WARN'
                        ? '#f59e0b'
                        : '#10b981';
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="terminal-log-row"
                      style={{
                        lineHeight: '1.5',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span className="log-time">
                        [{new Date(log.date).toLocaleTimeString('pt-BR')}]
                      </span>
                      <span
                        style={{
                          color: sevColor,
                          fontWeight: 900,
                          minWidth: '70px',
                          display: 'inline-block',
                        }}
                      >
                        [{log.type}]
                      </span>
                      <span className="log-msg" style={{ flex: 1 }}>
                        {log.msg}
                      </span>
                      <span className="log-meta">
                        ({log.user} • {log.ip})
                      </span>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
            {liveLogs.filter((l) => terminalSeverity === 'ALL' || l.type === terminalSeverity)
              .length === 0 && (
              <div
                className="terminal-empty-state"
                style={{ textAlign: 'center', padding: '40px 0', fontStyle: 'italic' }}
              >
                Nenhum evento registrado no console.
              </div>
            )}
          </div>
        </section>

        {/* Painel de Anomalias de Segurança */}
        <section
          className="security-panel anomalies-panel"
          style={{
            padding: '20px',
            height: '480px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            className="panel-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '14px',
              marginBottom: '14px',
            }}
          >
            <div
              className="icon-badge"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
            >
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.8125rem', margin: 0 }}>System Guard & Anomalias</h3>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.6875rem',
                  margin: '2px 0 0 0',
                }}
              >
                Detecção ativa de ameaças e comportamento atípico
              </p>
            </div>
          </div>

          {/* Lista de Anomalias */}
          <div
            className="anomalies-scroll-list"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              overflowY: 'auto',
              paddingRight: '6px',
            }}
          >
            <AnimatePresence>
              {anomalies.map((anom) => {
                const sevColor =
                  anom.severity === 'CRITICAL'
                    ? '#f43f5e'
                    : anom.severity === 'WARN'
                      ? '#f59e0b'
                      : '#38bdf8';
                const sevBg =
                  anom.severity === 'CRITICAL'
                    ? '#fee2e2'
                    : anom.severity === 'WARN'
                      ? '#fef3c7'
                      : '#e0f2fe';
                return (
                  <motion.div
                    key={anom.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: 50 }}
                    className={`anomaly-card-premium severity-${anom.severity.toLowerCase()}`}
                    style={{
                      background: 'hsl(var(--bg-card))',
                      borderRadius: '12px',
                      border: `1px solid ${anom.severity === 'CRITICAL' ? '#fecaca' : 'var(--border)'}`,
                      padding: '12px 14px',
                      boxShadow: '0 2px 4px -1px rgba(0,0,0,0.03)',
                      position: 'relative',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: '4px',
                        background: sevColor,
                      }}
                    />

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          background: sevBg,
                          color: sevColor,
                          padding: '2px 6px',
                          borderRadius: '100px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {anom.severity}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        {new Date(anom.date).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        margin: '0 0 2px 0',
                        lineHeight: '1.2',
                      }}
                    >
                      {anom.title}
                    </h4>

                    <p
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        margin: '0 0 10px 0',
                        lineHeight: '1.3',
                        fontWeight: 400,
                      }}
                    >
                      {anom.desc}
                    </p>

                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleMitigateAnomaly(anom.id, 'dismiss')}
                        style={{
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: '0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--border)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--bg-main)';
                        }}
                      >
                        Ignorar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleMitigateAnomaly(
                            anom.id,
                            anom.severity === 'CRITICAL' ? 'block' : 'suspend'
                          )
                        }
                        style={{
                          background: anom.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                          border: 'none',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        {anom.severity === 'CRITICAL' ? 'Bloquear IP' : 'Suspender Conta'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {anomalies.length === 0 && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  textAlign: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#f0fdf4',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(22,163,74,0.1)',
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      margin: 0,
                    }}
                  >
                    Ecosistema Seguro
                  </h4>
                  <p
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                      margin: '4px 0 0 0',
                      fontWeight: 500,
                    }}
                  >
                    Nenhuma anomalia ativa ou ameaça não mitigada nas últimas 24h.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
