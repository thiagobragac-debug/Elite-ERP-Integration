import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Activity,
  Lock,
  Database,
  Server,
  AlertCircle,
  Clock,
  History,
  TrendingUp,
  Cpu,
  Monitor,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { useReportData } from '../../hooks/useReportData';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';

export const AdminIntelligenceHub: React.FC = () => {
  const { tenant } = useTenant();
  const {
    stats: reportStats,
    data: auditLogs,
    loading,
    error,
    refresh,
  } = useReportData('admin-overview');

  if (error) {
    console.error('[AdminHub] Load Error:', error);
  }

  const getStatIcon = (id: string) => {
    switch (id) {
      case 'governanca':
        return Shield;
      case 'licencas':
        return Users;
      case 'alertas':
        return Lock;
      case 'saude':
        return Cpu;
      default:
        return Activity;
    }
  };

  const activityData = [
    { label: '00:00', value: 0 },
    { label: '04:00', value: 0 },
    { label: '08:00', value: 0 },
    { label: '12:00', value: 0 },
    { label: '16:00', value: 0 },
    { label: '20:00', value: 0 },
  ];

  if (auditLogs && auditLogs.length > 0) {
    auditLogs.forEach((log: any) => {
      const h = new Date(log.created_at).getHours();
      let bucket = 0;
      if (h >= 0 && h < 4) {
        bucket = 0;
      } else if (h >= 4 && h < 8) {
        bucket = 1;
      } else if (h >= 8 && h < 12) {
        bucket = 2;
      } else if (h >= 12 && h < 16) {
        bucket = 3;
      } else if (h >= 16 && h < 20) {
        bucket = 4;
      } else {
        bucket = 5;
      }
      activityData[bucket].value += 1;
    });

    const maxActivity = Math.max(...activityData.map((d) => d.value));
    if (maxActivity > 0) {
      activityData.forEach((d) => {
        d.value = Math.round((d.value / maxActivity) * 100);
      });
    }
  }

  const secSettings = (tenant?.settings?.security || {}) as {
    mfaEnabled?: boolean;
    strongPasswords?: boolean;
    bruteForceProtection?: boolean;
    auditLogsEnabled?: boolean;
    blockMultipleSessions?: boolean;
  };
  const checklist = [
    {
      label: 'Autenticação de Dois Fatores (MFA)',
      status: secSettings.mfaEnabled ? 'active' : 'warning',
      desc: secSettings.mfaEnabled ? 'Habilitado' : 'Recomendado',
    },
    {
      label: 'Política de Senhas Fortes',
      status: secSettings.strongPasswords ? 'active' : 'warning',
      desc: secSettings.strongPasswords ? '8+ chars, Especial' : 'Padrão básico',
    },
    {
      label: 'Bloqueio de Brute Force',
      status: secSettings.bruteForceProtection ? 'active' : 'warning',
      desc: secSettings.bruteForceProtection ? 'Ativo após 5 tentativas' : 'Não configurado',
    },
    {
      label: 'Logs de Auditoria Full',
      status: secSettings.auditLogsEnabled !== false ? 'active' : 'warning',
      desc: secSettings.auditLogsEnabled !== false ? 'Retenção ativada' : 'Desabilitada',
    },
    {
      label: 'Sessões Simultâneas',
      status: secSettings.blockMultipleSessions ? 'active' : 'warning',
      desc: secSettings.blockMultipleSessions ? 'Bloqueio ativo' : 'Múltiplos logins permitidos',
    },
  ];

  const criticalEventsList =
    auditLogs && auditLogs.length > 0
      ? auditLogs.slice(0, 4).map((l: any) => {
          const isDelete = l.action === 'DELETE';
          const isSecurity = l.action === 'SECURITY_ALERT';
          const level = isSecurity ? 'high' : isDelete ? 'medium' : 'low';
          const time = new Date(l.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return {
            event: l.description || `${l.action} em ${l.entity}`,
            user: 'Sistema',
            time,
            level,
          };
        })
      : [];

  return (
    <div className="admin-intelligence-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Administração', href: '/admin/intelligence' },
              { label: 'Intelligence Hub' },
            ]}
          />
          <h1 className="page-title">Intelligence Hub</h1>
          <p className="page-subtitle">
            Visão estratégica de governança, conformidade de segurança e saúde operacional do
            tenant.
          </p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => refresh()}>
            <Clock size={18} />
            ATUALIZAR DASHBOARD
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <KPISkeleton key={i} />)
          : reportStats?.map((s: any, i: number) => (
              <TauzeStatCard key={i} {...s} icon={getStatIcon(s.id)} />
            ))}
      </div>

      <div className="admin-intelligence-grid">
        <section className="intelligence-panel premium-card main-chart">
          <div className="panel-header-tauze">
            <div className="title-info">
              <Monitor size={20} className="text-brand" />
              <div>
                <h3>Engajamento & Acessos</h3>
                <p>Distribuição de sessões ativas nas últimas 24 horas</p>
              </div>
            </div>
            <div className="header-action">
              <span className="live-pulse">LIVE</span>
            </div>
          </div>
          <div className="chart-container-tauze">
            {activityData.map((d, i) => (
              <div key={i} className="chart-column">
                <div className="bar-wrapper">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${d.value}%` }}
                    className="bar-fill"
                  />
                </div>
                <span className="bar-label">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="intelligence-panel premium-card">
          <div className="panel-header-tauze">
            <div className="title-info">
              <Lock size={20} className="text-brand" />
              <div>
                <h3>Checklist de Segurança</h3>
                <p>Status de conformidade institucional</p>
              </div>
            </div>
          </div>
          <div className="security-checklist">
            {checklist.map((item, i) => (
              <div key={i} className="checklist-item">
                <div className={`check-icon ${item.status}`}>
                  <CheckCircle2 size={16} />
                </div>
                <div className="check-info">
                  <span className="check-label">{item.label}</span>
                  <span className="check-desc">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="intelligence-panel premium-card">
          <div className="panel-header-tauze">
            <div className="title-info">
              <History size={20} className="text-brand" />
              <div>
                <h3>Deteções Críticas</h3>
                <p>Últimos eventos de alta severidade</p>
              </div>
            </div>
          </div>
          <div className="critical-events-list">
            {criticalEventsList.length > 0 ? (
              criticalEventsList.map((e: any, i: number) => (
                <div key={i} className="event-item">
                  <div className={`level-indicator ${e.level}`} />
                  <div className="event-info">
                    <span className="event-name">{e.event}</span>
                    <span className="event-meta">
                      {e.user} • {e.time}
                    </span>
                  </div>
                  <ArrowRight size={14} className="event-arrow" />
                </div>
              ))
            ) : (
              <div
                className="empty-state-small"
                style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}
              >
                <Shield size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <span style={{ fontSize: '12px', display: 'block' }}>Nenhum evento registrado</span>
                <span style={{ fontSize: '10px' }}>---</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .admin-intelligence-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .intelligence-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        [data-theme='dark'] .intelligence-panel {
          background: #1e293b;
          border-color: #334155;
        }

        .panel-header-tauze {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .panel-header-tauze .title-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .panel-header-tauze h3 {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        [data-theme='dark'] .panel-header-tauze h3 { color: #f8fafc; }

        .panel-header-tauze p {
          font-size: 11px;
          color: #64748b;
          margin: 2px 0 0;
          font-weight: 500;
        }
        [data-theme='dark'] .panel-header-tauze p { color: #94a3b8; }

        .chart-container-tauze {
          height: 200px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 0 10px;
          gap: 20px;
        }

        .chart-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .bar-wrapper {
          width: 100%;
          height: 160px;
          background: hsl(var(--bg-main));
          border-radius: 100px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
        }
        [data-theme='dark'] .bar-wrapper { background: #0f172a; }

        .bar-fill {
          width: 100%;
          background: linear-gradient(180deg, hsl(var(--brand)), hsl(var(--brand) / 0.8));
          border-radius: 100px;
          transition: height 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bar-label {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
        }

        .live-pulse {
          font-size: 9px;
          font-weight: 900;
          color: #ef4444;
          background: #fef2f2;
          padding: 2px 8px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        [data-theme='dark'] .live-pulse { background: rgba(239, 68, 68, 0.2); }
        
        .live-pulse::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }

        @keyframes pulse-ring {
          0% { transform: scale(.33); opacity: 1; }
          80%, 100% { transform: scale(1.5); opacity: 0; }
        }

        .security-checklist, .critical-events-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checklist-item {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 10px;
          border-radius: 16px;
          background: hsl(var(--bg-main));
          border: 1px solid transparent;
          transition: 0.2s;
        }
        [data-theme='dark'] .checklist-item { background: #0f172a; border-color: transparent; }

        .checklist-item:hover {
          border-color: hsl(var(--border));
          background: hsl(var(--bg-card));
          transform: translateX(4px);
        }
        [data-theme='dark'] .checklist-item:hover { background: #334155; border-color: #475569; }

        .check-icon.active { color: #10b981; }
        .check-icon.warning { color: #f59e0b; }

        .check-label { font-size: 12px; font-weight: 700; color: #1e293b; display: block; }
        [data-theme='dark'] .check-label { color: #f8fafc; }
        .check-desc { font-size: 10px; color: #64748b; font-weight: 500; }
        [data-theme='dark'] .check-desc { color: #94a3b8; }

        .event-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 16px;
          background: hsl(var(--bg-main));
          cursor: pointer;
          transition: 0.2s;
        }
        [data-theme='dark'] .event-item { background: #0f172a; }

        .event-item:hover {
          background: hsl(var(--bg-card));
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transform: translateX(4px);
        }
        [data-theme='dark'] .event-item:hover { background: #334155; box-shadow: none; }

        .level-indicator { width: 4px; height: 24px; border-radius: 4px; }
        .level-indicator.high { background: #ef4444; }
        .level-indicator.medium { background: #f59e0b; }
        .level-indicator.low { background: #3b82f6; }

        .event-info { flex: 1; min-width: 0; }
        .event-name { font-size: 12px; font-weight: 700; color: #1e293b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        [data-theme='dark'] .event-name { color: #f8fafc; }
        .event-meta { font-size: 10px; color: #64748b; font-weight: 500; }
        [data-theme='dark'] .event-meta { color: #94a3b8; }
        .event-arrow { color: #94a3b8; }

        @media (max-width: 1400px) {
          .admin-intelligence-grid {
            grid-template-columns: 1fr 1fr;
          }
          .main-chart {
            grid-column: span 2;
          }
        }
      `}</style>
    </div>
  );
};
