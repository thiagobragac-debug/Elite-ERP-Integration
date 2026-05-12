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
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { KPISkeleton } from '../../components/Feedback/Skeleton';

export const AdminIntelligenceHub: React.FC = () => {
  const { activeFarm } = useTenant();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminIntelligence();
  }, [activeFarm]);

  const fetchAdminIntelligence = async () => {
    setLoading(true);
    try {
      // Simulation of administrative intelligence metrics
      const tenantId = activeFarm?.tenantId;
      
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const criticalEvents = (auditLogs || []).filter(l => l.action === 'DELETE' || l.action === 'SECURITY_ALERT').length;
      const securityScore = 88;
      const operationalHealth = 94;

      setStats([
        {
          label: 'Score de Governança',
          value: securityScore + '%',
          icon: Shield,
          color: 'hsl(var(--brand))',
          progress: securityScore,
          change: 'Nível Institucional',
          periodLabel: 'Compliance Global',
          sparkline: [{ value: 80 }, { value: 85 }, { value: 82 }, { value: 88 }]
        },
        {
          label: 'Licenças Ativas',
          value: `${userCount || 0}/25`,
          icon: Users,
          color: '#3b82f6',
          progress: ((userCount || 0) / 25) * 100,
          change: 'Plano Enterprise',
          periodLabel: 'Consumo de Seats',
          sparkline: [{ value: 5 }, { value: 8 }, { value: 12 }, { value: userCount || 0 }]
        },
        {
          label: 'Alertas de Segurança',
          value: criticalEvents,
          icon: Lock,
          color: criticalEvents > 0 ? '#ef4444' : '#10b981',
          progress: criticalEvents > 5 ? 30 : 100,
          change: criticalEvents > 0 ? 'Ação Requerida' : 'Ambiente Seguro',
          periodLabel: 'High Severity Logs',
          sparkline: [{ value: 0 }, { value: 2 }, { value: 1 }, { value: criticalEvents }]
        },
        {
          label: 'Saúde Operacional',
          value: operationalHealth + '%',
          icon: Cpu,
          color: '#f59e0b',
          progress: operationalHealth,
          change: 'SLA de Instância',
          periodLabel: 'Uso de Recursos',
          sparkline: [{ value: 92 }, { value: 95 }, { value: 94 }, { value: 94 }]
        }
      ]);

      setActivityData([
        { label: '00:00', value: 5 }, { label: '04:00', value: 2 }, 
        { label: '08:00', value: 45 }, { label: '12:00', value: 85 }, 
        { label: '16:00', value: 65 }, { label: '20:00', value: 30 }
      ]);

    } catch (error) {
      console.error('Error fetching admin intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-intelligence-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge" style={{ background: 'hsl(var(--bg-sidebar))', color: 'hsl(var(--brand))', border: '1px solid hsl(var(--brand) / 0.3)' }}>
            <Activity size={14} fill="currentColor" />
            <span>ADMIN INTELLIGENCE v5.0</span>
          </div>
          <h1 className="page-title">Intelligence Hub Administrativo</h1>
          <p className="page-subtitle">Visão estratégica de governança, conformidade de segurança e saúde operacional do tenant.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={fetchAdminIntelligence}>
            <Clock size={18} />
            ATUALIZAR DASHBOARD
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <KPISkeleton key={i} />)
        ) : (
          stats.map((s, i) => (
            <EliteStatCard key={i} {...s} />
          ))
        )}
      </div>

      <div className="admin-intelligence-grid">
        <section className="intelligence-panel premium-card main-chart">
          <div className="panel-header-elite">
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
          <div className="chart-container-elite">
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
          <div className="panel-header-elite">
            <div className="title-info">
              <Lock size={20} className="text-brand" />
              <div>
                <h3>Checklist de Segurança</h3>
                <p>Status de conformidade institucional</p>
              </div>
            </div>
          </div>
          <div className="security-checklist">
            {[
              { label: 'Autenticação de Dois Fatores (MFA)', status: 'active', desc: 'Habilitado para admins' },
              { label: 'Política de Senhas Fortes', status: 'active', desc: '8+ chars, Especial, Números' },
              { label: 'Bloqueio de Brute Force', status: 'active', desc: 'Ativo após 5 tentativas' },
              { label: 'Logs de Auditoria Full', status: 'active', desc: 'Retenção de 365 dias' },
              { label: 'Sessões Simultâneas', status: 'warning', desc: 'Múltiplos logins permitidos' }
            ].map((item, i) => (
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
          <div className="panel-header-elite">
            <div className="title-info">
              <History size={20} className="text-brand" />
              <div>
                <h3>Deteções Críticas</h3>
                <p>Últimos eventos de alta severidade</p>
              </div>
            </div>
          </div>
          <div className="critical-events-list">
            {[
              { event: 'Tentativa de Login Inválido', user: 'root@unknown', time: '14:22', level: 'high' },
              { event: 'Exclusão de Lote em Massa', user: 'Admin Master', time: '12:05', level: 'medium' },
              { event: 'Alteração de Permissões', user: 'Thiago Costa', time: '10:45', level: 'low' },
              { event: 'Exportação de Dados Financeiros', user: 'Diretoria', time: '09:12', level: 'medium' }
            ].map((e, i) => (
              <div key={i} className="event-item">
                <div className={`level-indicator ${e.level}`} />
                <div className="event-info">
                  <span className="event-name">{e.event}</span>
                  <span className="event-meta">{e.user} • {e.time}</span>
                </div>
                <ArrowRight size={14} className="event-arrow" />
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .admin-intelligence-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .admin-intelligence-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 24px;
        }

        .intelligence-panel {
          background: white;
          border-radius: 28px;
          border: 1px solid #f1f5f9;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .panel-header-elite {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .panel-header-elite .title-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .panel-header-elite h3 {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .panel-header-elite p {
          font-size: 11px;
          color: #64748b;
          margin: 2px 0 0;
          font-weight: 500;
        }

        .chart-container-elite {
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
          background: #f8fafc;
          border-radius: 100px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
        }

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
          background: #f8fafc;
          border: 1px solid transparent;
          transition: 0.2s;
        }

        .checklist-item:hover {
          border-color: #e2e8f0;
          background: white;
          transform: translateX(4px);
        }

        .check-icon.active { color: #10b981; }
        .check-icon.warning { color: #f59e0b; }

        .check-label { font-size: 12px; font-weight: 700; color: #1e293b; display: block; }
        .check-desc { font-size: 10px; color: #64748b; font-weight: 500; }

        .event-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 16px;
          background: #f8fafc;
          cursor: pointer;
          transition: 0.2s;
        }

        .event-item:hover {
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transform: translateX(4px);
        }

        .level-indicator { width: 4px; height: 24px; border-radius: 4px; }
        .level-indicator.high { background: #ef4444; }
        .level-indicator.medium { background: #f59e0b; }
        .level-indicator.low { background: #3b82f6; }

        .event-info { flex: 1; min-width: 0; }
        .event-name { font-size: 12px; font-weight: 700; color: #1e293b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .event-meta { font-size: 10px; color: #64748b; font-weight: 500; }
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
