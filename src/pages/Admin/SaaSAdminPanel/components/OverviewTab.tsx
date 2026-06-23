import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Server, Activity, Users, Globe, RefreshCw, ShieldCheck, Database, Shield, DollarSign } from 'lucide-react';
import { TauzeStatCard } from '../../../../components/Cards/TauzeStatCard';

interface OverviewTabProps {
  kpis: {
    mrr: number;
    totalTenants: number;
    totalUsers: number;
    health: number;
  };
  alertsFeed: any[];
  remediationStates: any;
  handleGlobalRedisFlush: () => void;
  handleTestGateways: () => void;
  handleRunPendingMigrations: () => void;
  dbLoadData: any;
  securityData: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  kpis,
  alertsFeed,
  remediationStates,
  handleGlobalRedisFlush,
  handleTestGateways,
  handleRunPendingMigrations,
  dbLoadData,
  securityData,
}) => {
  // ✅ Melhoria 14: estado de confirmação para ações críticas de infra
  const [pendingAction, setPendingAction] = React.useState<null | 'redis' | 'gateways' | 'migrations'>(null);

  const executeWithConfirm = (action: 'redis' | 'gateways' | 'migrations', handler: () => void) => {
    if (pendingAction === action) {
      // Segunda clicada → confirma e executa
      handler();
      setPendingAction(null);
    } else {
      // Primeira clicada → entra em modo de confirmação
      setPendingAction(action);
      // Auto-cancela após 5s
      setTimeout(() => setPendingAction((prev) => (prev === action ? null : prev)), 5000);
    }
  };

  return (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="saas-view"
            >
              {/* KPI Grid */}
              <div className="next-gen-kpi-grid" style={{ marginBottom: '32px' }}>
                <TauzeStatCard 
                  label="Receita Mensal (MRR)" 
                  value={`R$ ${kpis.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                  icon={DollarSign} 
                  color="#10b981" 
                  trend="up" 
                  change="Histórico Real" 
                  sparkline={[{value: 30, label: ''}, {value: 45, label: ''}, {value: 60, label: ''}, {value: 85, label: ''}]}
                  periodLabel="Mês Atual" />
                <TauzeStatCard 
                  label="Inadimplência" 
                  value={`R$ ${(kpis as any).inadimplencia?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`} 
                  icon={Activity} 
                  color="#ef4444" 
                  trend="down" 
                  change="Faturas Vencidas" 
                  sparkline={[{value: 20, label: ''}, {value: 15, label: ''}, {value: 30, label: ''}, {value: 10, label: ''}]}
                  periodLabel="Ativo" />
                <TauzeStatCard 
                  label="Novos Clientes (Mês)" 
                  value={((kpis as any).newTenantsThisMonth || 0).toString()} 
                  icon={Users} 
                  color="#6366f1" 
                  trend="up" 
                  change="Conversão" 
                  sparkline={[{value: 40, label: ''}, {value: 55, label: ''}, {value: 65, label: ''}, {value: 80, label: ''}]}
                  periodLabel="Mês Atual" />
                <TauzeStatCard 
                  label="Saúde da Rede" 
                  value={`${kpis.health}%`} 
                  icon={ShieldCheck} 
                  color="#f59e0b" 
                  trend="up" 
                  change="Uptime" 
                  sparkline={[{value: 99, label: ''}, {value: 98, label: ''}, {value: 99, label: ''}, {value: 99, label: ''}]}
                  periodLabel="Mês Atual" />
              </div>

              {/* Executive Flight Deck Banner */}
              <div className="executive-flight-banner-premium">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div className="flight-icon-glow">
                    <Zap size={24} className="text-brand animate-pulse" />
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '800',
                        color: 'hsl(var(--text-main))',
                      }}
                    >
                      Painel de Controle Executivo
                    </h3>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: '11px',
                        color: 'hsl(var(--text-muted))',
                        fontWeight: '600',
                      }}
                    >
                      Consola operacional avançada de infraestrutura, gateways de pagamento e saúde
                      do cluster multi-tenant.
                    </p>
                  </div>
                </div>
                <div className="system-status-indicator">
                  <div className="pulse-dot active" />
                  <span>SISTEMA NOMINAL</span>
                </div>
              </div>

              {/* Ecosystem Alerts Feed */}
              <div style={{ marginBottom: '32px' }}>
                <h4
                  style={{
                    margin: '0 0 16px 8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'hsl(var(--text-muted))',
                  }}
                >
                  Alertas Críticos do Ecossistema
                </h4>
                <div className="executive-alerts-grid-premium">
                  {alertsFeed.map((alertItem) => (
                    <div key={alertItem.id} className={`alert-card-premium ${alertItem.type}`}>
                      <div className="alert-card-header">
                        <span className="alert-title">{alertItem.title}</span>
                        <span className="alert-time">{alertItem.time}</span>
                      </div>
                      <p className="alert-desc">{alertItem.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flight Deck Remediations & Diagnostics */}
              <div style={{ marginBottom: '32px' }}>
                <h4
                  style={{
                    margin: '0 0 16px 8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'hsl(var(--text-muted))',
                  }}
                >
                  Console de Remediação & Diagnósticos Globais
                </h4>
                <div className="remediation-console-grid-premium">
                  {/* Redis Global Cache Flush */}
                  <div className="remediation-item-card-premium">
                    <div className="remediation-details">
                      <div className="remediation-icon-wrapper redis">
                        <RefreshCw
                          size={18}
                          className={remediationStates.redis === 'loading' ? 'animate-spin' : ''}
                        />
                      </div>
                      <div>
                        <h5 style={{ display: 'flex', alignItems: 'center' }}>
                          Cluster Redis Global
                          <span style={{ marginLeft: '8px', background: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>IMPACTO ALTO</span>
                        </h5>
                        <p>
                          Invalida e purga todo o cache Redis distribuído em todos os clusters
                          geográficos.
                        </p>
                      </div>
                    </div>
                    <button
                      className={`remediation-action-btn-premium ${remediationStates.redis}`}
                      onClick={() => executeWithConfirm('redis', handleGlobalRedisFlush)}
                      disabled={remediationStates.redis === 'loading'}
                      style={pendingAction === 'redis' ? { background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' } : {}}
                    >
                      {remediationStates.redis === 'loading'
                        ? 'LIMPANDO CACHE...'
                        : remediationStates.redis === 'success'
                          ? 'CACHE ZERADO!'
                          : pendingAction === 'redis'
                            ? '⚠️ CONFIRMAR? CLIQUE NOVAMENTE'
                            : 'LIMPAR CACHE REDIS GLOBAL'}
                    </button>
                  </div>

                  {/* Payment Gateway Ping Testing */}
                  <div className="remediation-item-card-premium">
                    <div className="remediation-details">
                      <div className="remediation-icon-wrapper stripe">
                        <ShieldCheck
                          size={18}
                          className={
                            remediationStates.gateways === 'loading' ? 'animate-pulse' : ''
                          }
                        />
                      </div>
                      <div>
                        <h5>Teste de Integridade Gateway</h5>
                        <p>
                          Realiza pings de verificação de integridade e validade das chaves de API
                          do Stripe, Asaas e Pagar.me.
                        </p>
                      </div>
                    </div>
                    <button
                      className={`remediation-action-btn-premium ${remediationStates.gateways}`}
                      onClick={() => executeWithConfirm('gateways', handleTestGateways)}
                      disabled={remediationStates.gateways === 'loading'}
                    >
                      {remediationStates.gateways === 'loading'
                        ? 'VERIFICANDO...'
                        : remediationStates.gateways === 'success'
                          ? 'PING NOMINAL!'
                          : pendingAction === 'gateways'
                            ? '⚠️ CONFIRMAR? CLIQUE NOVAMENTE'
                            : 'TESTAR INTEGRIDADE GATEWAYS'}
                    </button>
                  </div>

                  {/* Supabase Schema Migrations */}
                  <div className="remediation-item-card-premium">
                    <div className="remediation-details">
                      <div className="remediation-icon-wrapper pagarme">
                        <Database
                          size={18}
                          className={
                            remediationStates.migrations === 'loading' ? 'animate-bounce' : ''
                          }
                        />
                      </div>
                      <div>
                        <h5 style={{ display: 'flex', alignItems: 'center' }}>
                          Sincronizador de Migrações
                          <span style={{ marginLeft: '8px', background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>IMPACTO MÉDIO</span>
                        </h5>
                        <p>
                          Busca, compila e aplica migrações de esquema DDL pendentes no Supabase
                          Cluster.
                        </p>
                      </div>
                    </div>
                    <button
                      className={`remediation-action-btn-premium ${remediationStates.migrations}`}
                      onClick={() => executeWithConfirm('migrations', handleRunPendingMigrations)}
                      disabled={remediationStates.migrations === 'loading'}
                      style={pendingAction === 'migrations' ? { background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' } : {}}
                    >
                      {remediationStates.migrations === 'loading'
                        ? 'RODANDO MIGRATIONS...'
                        : remediationStates.migrations === 'success'
                          ? 'SCHEMAS ATUALIZADOS!'
                          : pendingAction === 'migrations'
                            ? '⚠️ CONFIRMAR? CLIQUE NOVAMENTE'
                            : 'RODAR MIGRAÇÕES PENDENTES'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Standard Health Progress Widgets */}
              <div className="health-grid" style={{ gridTemplateColumns: '1fr 1fr !important' }}>
                <div className="health-panel">
                  <div className="panel-header">
                    <Database size={18} />
                    <h3>Banco de Dados & Clusters</h3>
                  </div>
                  <div className="h-metrics">
                    <div className="h-metric">
                      <span>Carga do Banco (BR-East-01)</span>
                      <div className="progress-bar">
                        <div
                          className={`fill ${dbLoadData.status}`}
                          style={{ width: `${dbLoadData.load}%` }}
                        />
                      </div>
                      <span className="h-val">
                        {dbLoadData.load}% - Carga Monitorada ({dbLoadData.statusLabel})
                      </span>
                    </div>
                  </div>
                </div>
                <div className="health-panel">
                  <div className="panel-header">
                    <Shield size={18} />
                    <h3>Segurança & Acessos</h3>
                  </div>
                  <div className="h-metrics">
                    <div className="h-metric">
                      <span>Tentativas de Acesso Suspeitas (24h)</span>
                      <div className="progress-bar">
                        <div
                          className={`fill ${securityData.status}`}
                          style={{ width: `${securityData.percentage}%` }}
                        />
                      </div>
                      <span className="h-val">
                        Risco sob Controle ({securityData.attempts} IPs mitigados temporariamente)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
  );
};
