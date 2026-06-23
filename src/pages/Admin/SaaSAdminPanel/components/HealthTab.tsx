import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Server, RefreshCw, AlertCircle, HardDrive, Database, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../../../components/Feedback/EmptyState';

interface HealthTabProps {
  nodesList: any[];
  auditLogsList: any[];
  remediationStates: Record<string, 'idle' | 'loading' | 'success'>;
  setRemediationStates: React.Dispatch<React.SetStateAction<Record<string, 'idle' | 'loading' | 'success'>>>;
  handleReprocessFailures: () => void;
  handleRestartNode: (nodeId: string, nodeName: string) => void;
  handleFlushNodeCache: (nodeId: string, nodeName: string) => void;
  handleGlobalRedisFlush: () => void;
  handleRunPendingMigrations: () => void;
  setIsAuditDrawerOpen: (open: boolean) => void;
  dbQuotaData: any;
  s3QuotaData: any;
  apiQuotaData: any;
  dbLoadData: any;
}

export const HealthTab: React.FC<HealthTabProps> = ({
  nodesList,
  auditLogsList,
  remediationStates,
  setRemediationStates,
  handleReprocessFailures,
  handleRestartNode,
  handleFlushNodeCache,
  handleGlobalRedisFlush,
  handleRunPendingMigrations,
  setIsAuditDrawerOpen,
  dbQuotaData,
  s3QuotaData,
  apiQuotaData,
  dbLoadData,
}) => {
  const navigate = useNavigate();

  return (
            <motion.div
              key="health"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="saas-view-premium"
            >
              {/* Infrastructure Top Banner Header with premium styling */}
              <div className="infra-header-premium glassmorphism-card">
                <div>
                  <h3 className="section-title-premium">Monitoramento de Infraestrutura & Cotas</h3>
                  <p className="section-subtitle-premium">
                    Métricas de carga do banco de dados, storage de anexos, conexões e nodes da
                    aplicação. <span style={{ opacity: 0.85, fontSize: '10px', display: 'block', marginTop: '4px', fontStyle: 'italic', color: 'hsl(var(--text-muted))' }}>⚠️ Nota: Os valores de cota e throughput exibidos são estimativas baseadas na volumetria dos parceiros.</span>
                  </p>
                </div>
                <div className="status-badge-glow">
                  <span className="pulse-dot green" />
                  <span className="status-text-glow">SISTEMA NOMINAL</span>
                </div>
              </div>

              {/* Resource Quota Grid */}
              <div className="resource-quotas-grid">
                {[
                  {
                    label: 'Armazenamento do Banco',
                    used: dbQuotaData.used,
                    total: '10GB',
                    percentage: dbQuotaData.percentage,
                    color: 'hsl(var(--brand))',
                    icon: Database,
                    details: `${dbQuotaData.used} usados de 10GB contratados`,
                  },
                  {
                    label: 'Anexos na Nuvem',
                    used: s3QuotaData.used,
                    total: '50GB',
                    percentage: s3QuotaData.percentage,
                    color: '#10b981',
                    icon: HardDrive,
                    details: `${s3QuotaData.used} usados no S3 bucket BR-01`,
                  },
                  {
                    label: 'API Throughput (Minuto)',
                    used: apiQuotaData.used,
                    total: '100k',
                    percentage: apiQuotaData.percentage,
                    color: '#f59e0b',
                    icon: Activity,
                    details: `API operando a ${apiQuotaData.used} nas últimas 24h`,
                  },
                ].map((resource, idx) => (
                  <div key={idx} className="quota-card-premium glassmorphism-card">
                    <div className="quota-header">
                      <div className="quota-title-group">
                        <div className="quota-icon" style={{ color: resource.color }}>
                          <resource.icon size={18} />
                        </div>
                        <div>
                          <span className="quota-label">{resource.label}</span>
                          <span className="quota-details-sub">{resource.details}</span>
                        </div>
                      </div>
                      <span className="quota-percentage" style={{ color: resource.color }}>
                        {resource.percentage}%
                      </span>
                    </div>

                    <div className="quota-progress-container">
                      <div className="quota-progress-bg">
                        <div
                          className="quota-progress-fill"
                          style={{
                            width: `${resource.percentage}%`,
                            background: `linear-gradient(90deg, ${resource.color} 0%, rgba(255,255,255,0.4) 100%)`,
                            boxShadow: `0 0 10px ${resource.color}`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="quota-footer">
                      <span>{resource.used}</span>
                      <span>limite: {resource.total}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Infrastructure Panels */}
              <div className="health-grid-premium">
                {/* Database & Storage Health */}
                <section className="health-panel-premium glassmorphism-card">
                  <div className="panel-header-premium">
                    <Database size={20} className="text-brand" />
                    <h3>Banco de Dados & Storage</h3>
                  </div>
                  <div className="h-metrics-premium">
                    <div className="h-metric-premium-item">
                      <div className="metric-header-row">
                        <span>Carga do Banco (Supabase)</span>
                        <span className={`h-val-badge ${dbLoadData.status}`}>
                          {dbLoadData.load}% ({dbLoadData.statusLabel})
                        </span>
                      </div>
                      <div className="progress-bar-premium">
                        <div
                          className={`fill ${dbLoadData.status}`}
                          style={{ width: `${dbLoadData.load}%` }}
                        />
                      </div>
                      <span className="metric-desc-sub">
                        IOPS e taxa de processamento de consultas dinamicamente calculados a partir
                        da latência real do Supabase cluster.
                      </span>
                      {dbLoadData.status === 'critical' && (
                        <button 
                          onClick={() => navigate('/saas?tab=overview')}
                          style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                        >
                          Ir para Remediação <ArrowRight size={12} />
                        </button>
                      )}
                    </div>

                    <div className="h-metric-premium-item">
                      <div className="metric-header-row">
                        <span>Uso de Storage S3</span>
                        <span className={`h-val-badge ${s3QuotaData.status}`}>
                          {s3QuotaData.percentage}% ({s3QuotaData.statusLabel})
                        </span>
                      </div>
                      <div className="progress-bar-premium">
                        <div
                          className={`fill ${s3QuotaData.status}`}
                          style={{ width: `${s3QuotaData.percentage}%` }}
                        />
                      </div>
                      <span className="metric-desc-sub">
                        Provisão de anexos de fazendas calculada dinamicamente com base nos volumes
                        de dados dos Tenants ativos.
                      </span>
                      {s3QuotaData.status === 'critical' && (
                        <button 
                          onClick={() => navigate('/saas?tab=overview')}
                          style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                        >
                          Ir para Remediação <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                {/* Application Nodes */}
                <section className="health-panel-premium glassmorphism-card">
                  <div className="panel-header-premium">
                    <Server size={20} className="text-brand" />
                    <h3>Instâncias de Aplicação (App Nodes)</h3>
                  </div>

                  <div className="node-list-premium">
                    {nodesList.length === 0 ? (
                      <EmptyState
                        title="Nenhuma instância encontrada"
                        description="Não há application nodes ativos no momento."
                        icon={Server}
                      />
                    ) : (
                      nodesList.map((node) => {
                      const isRestarting = node.status === 'restarting';
                      const isClearingCache = node.cacheStatus === 'Limpando...';
                      const isOffline = node.status === 'offline';

                      return (
                        <div key={node.id} className={`node-item-premium ${node.status}`}>
                          <div className="node-status-group">
                            <div className={`node-pulse-indicator ${node.status}`} />
                            <div className="n-info">
                              <span className="n-name">{node.name}</span>
                              <div className="n-metrics-row">
                                <span className="n-res">CPU: {node.cpu}</span>
                                <span className="n-divider">•</span>
                                <span className="n-res">RAM: {node.mem}</span>
                                {node.activeConnections !== undefined && (
                                  <>
                                    <span className="n-divider">•</span>
                                    <span className="n-res">
                                      Conexões: {node.activeConnections}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="node-badge-and-actions">
                            <span
                              className={`cache-badge ${node.cacheStatus === 'Limpando...' ? 'clearing' : node.cacheStatus === 'Inativo' ? 'inactive' : 'nominal'}`}
                            >
                              Cache: {node.cacheStatus}
                            </span>

                            <div className="node-actions-group">
                              <button
                                className={`node-action-btn-premium ${isRestarting ? 'loading' : ''}`}
                                onClick={() => handleRestartNode(node.id, node.name)}
                                disabled={isRestarting || isOffline}
                                title="Reiniciar Node"
                              >
                                <RefreshCw
                                  size={14}
                                  className={isRestarting ? 'animate-spin' : ''}
                                />
                              </button>

                              <button
                                className={`node-action-btn-premium zap ${isClearingCache ? 'loading' : ''}`}
                                onClick={() => handleFlushNodeCache(node.id, node.name)}
                                disabled={isRestarting || isOffline || isClearingCache}
                                title="Limpar Cache Redis"
                              >
                                <Zap size={14} className={isClearingCache ? 'pulse-fast' : ''} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
  );
};
