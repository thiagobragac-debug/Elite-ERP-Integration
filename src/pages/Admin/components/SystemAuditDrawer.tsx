import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  TerminalSquare,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ServerCrash,
  FileJson,
} from 'lucide-react';
import { SidePanel } from '../../../components/Layout/SidePanel';
import { usePersistentState } from '../../../hooks/usePersistentState';

interface SystemAuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogsList: any[];
}

export const SystemAuditDrawer: React.FC<SystemAuditDrawerProps> = ({
  isOpen,
  onClose,
  auditLogsList,
}) => {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'SystemAuditDrawer_showAdvancedFilters',
    false
  );
  const [filterRisk, setFilterRisk] = useState('Todos');

  // Enriching logs with fake IP and payload data for the "Auditor" feel
  const enrichedLogs = auditLogsList.map((log, idx) => {
    let fakePayload = '{}';
    let riskLevel = 'info';
    let origin = 'Web Dashboard';
    let ip = `192.168.1.${10 + idx}`;

    if (log.action.includes('DELETE') || log.action.includes('FAIL')) {
      riskLevel = 'critical';
      origin = 'API Gateway';
      ip = '200.192.10.45';
      fakePayload = JSON.stringify(
        {
          status: 'failed',
          reason: 'unauthorized_token',
          target_resource: log.tenant || 'global_settings',
        },
        null,
        2
      );
    } else if (log.action.includes('UPDATE')) {
      riskLevel = 'warning';
      fakePayload = JSON.stringify(
        {
          before: { status: 'active', value: 1500 },
          after: { status: 'blocked', value: null },
        },
        null,
        2
      );
    } else {
      fakePayload = JSON.stringify(
        {
          event: log.action,
          assigned_to: 'User#001',
          timestamp: new Date().toISOString(),
        },
        null,
        2
      );
    }

    return { ...log, fakePayload, riskLevel, origin, ip };
  });

  const filteredLogs = enrichedLogs.filter((l) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      l.action.toLowerCase().includes(term) ||
      l.admin.toLowerCase().includes(term) ||
      l.ip.includes(term) ||
      l.origin.toLowerCase().includes(term);

    let matchesRisk = true;
    if (filterRisk === 'Crítico') {
      matchesRisk = l.riskLevel === 'critical';
    }
    if (filterRisk === 'Atenção') {
      matchesRisk = l.riskLevel === 'warning';
    }
    if (filterRisk === 'Info') {
      matchesRisk = l.riskLevel === 'info';
    }

    return matchesSearch && matchesRisk;
  });

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        // action for complete report
      }}
      title="Centro de Operações de Segurança (SOC)"
      subtitle="Auditoria Forense: Logs críticos de infraestrutura, acessos e transações de banco de dados."
      icon={History}
      submitLabel="Certificar & Exportar PDF"
      cancelLabel="Fechar"
      size="xxlarge"
      isReadOnly={false}
      hideSubmit={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* BARRA DE FILTROS SOC */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'hsl(var(--bg-card))',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="tauze-search-wrapper" style={{ flex: 1, margin: 0 }}>
              <Search size={16} className="s-icon" />
              <input
                type="text"
                className="tauze-search-input"
                placeholder="Buscar por Evento, ID de Usuário ou IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '12px' }}
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAdvancedFilters(!showAdvancedFilters);
              }}
              style={{
                background: showAdvancedFilters ? 'hsl(var(--bg-main))' : 'transparent',
                border: '1px solid hsl(var(--border))',
                color: showAdvancedFilters ? 'hsl(var(--brand))' : 'hsl(var(--text-main))',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Filter size={14} /> Filtros Avançados{' '}
              {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'hsl(var(--text-main))',
                color: 'hsl(var(--bg-main))',
                cursor: 'pointer',
              }}
            >
              <Download size={14} /> Download (.CSV)
            </button>
          </div>

          {showAdvancedFilters && (
            <div
              style={{
                display: 'flex',
                gap: '24px',
                paddingTop: '16px',
                borderTop: '1px dashed hsl(var(--border))',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span
                  style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}
                >
                  GRAU DE RISCO
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Todos', 'Crítico', 'Atenção', 'Info'].map((risk) => (
                    <button
                      type="button"
                      key={risk}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFilterRisk(risk);
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: filterRisk === risk ? 'hsl(var(--brand))' : 'transparent',
                        color: filterRisk === risk ? 'white' : 'hsl(var(--text-muted))',
                        border: `1px solid ${filterRisk === risk ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                      }}
                    >
                      {risk}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ESTATÍSTICAS RÁPIDAS DE RISCO */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Total de Eventos (24h)', value: '1.284', color: 'hsl(var(--text-main))' },
            { label: 'Acessos Suspeitos', value: '3', color: 'hsl(var(--warning))' },
            { label: 'Exclusões Críticas', value: '1', color: 'hsl(var(--danger))' },
            { label: 'Status do Banco', value: 'Sincronizado', color: 'hsl(var(--success))' },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: 'hsl(var(--bg-card))',
                padding: '16px',
                borderRadius: '12px',
                border: '1px dashed hsl(var(--border))',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-muted))',
                  textTransform: 'uppercase',
                }}
              >
                {stat.label}
              </div>
              <div
                style={{ fontSize: '20px', fontWeight: 900, color: stat.color, marginTop: '4px' }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* TIMELINE DE AUDITORIA */}
        <div
          style={{
            background: 'hsl(var(--bg-main))',
            borderRadius: '16px',
            border: '1px solid hsl(var(--border))',
            padding: '24px 32px',
          }}
        >
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
              <TerminalSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
              Nenhum log corresponde aos filtros.
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Linha vertical da Timeline */}
              <div
                style={{
                  position: 'absolute',
                  left: '15px',
                  top: '20px',
                  bottom: '20px',
                  width: '2px',
                  background: 'hsl(var(--border))',
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLog === log.id;

                  // Definindo cores do node central
                  let nodeColor = 'hsl(var(--brand))';
                  let bgNodeColor = 'hsl(var(--brand)/0.1)';
                  let Icon = TerminalSquare;

                  if (log.riskLevel === 'critical') {
                    nodeColor = 'hsl(var(--danger))';
                    bgNodeColor = 'hsl(var(--danger)/0.1)';
                    Icon = ServerCrash;
                  } else if (log.riskLevel === 'warning') {
                    nodeColor = 'hsl(var(--warning))';
                    bgNodeColor = 'hsl(var(--warning)/0.1)';
                    Icon = ShieldAlert;
                  }

                  return (
                    <div
                      key={log.id}
                      style={{ display: 'flex', gap: '24px', position: 'relative', zIndex: 2 }}
                    >
                      {/* Timeline Node */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: bgNodeColor,
                          border: `2px solid ${nodeColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '4px',
                        }}
                      >
                        <Icon size={14} color={nodeColor} />
                      </div>

                      {/* Content Card */}
                      <div
                        style={{
                          flex: 1,
                          background: 'hsl(var(--bg-card))',
                          borderRadius: '12px',
                          border: `1px solid ${isExpanded ? nodeColor : 'hsl(var(--border))'}`,
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          boxShadow: isExpanded ? `0 4px 20px ${bgNodeColor}` : 'none',
                        }}
                      >
                        {/* Card Header (Clickable) */}
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setExpandedLog(isExpanded ? null : log.id);
                          }}
                          style={{
                            padding: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '8px',
                              }}
                            >
                              <span style={{ fontSize: '13px', fontWeight: 900, color: nodeColor }}>
                                {log.action}
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  background: 'hsl(var(--bg-main))',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid hsl(var(--border))',
                                  color: 'hsl(var(--text-muted))',
                                }}
                              >
                                {log.time}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '13px',
                                color: 'hsl(var(--text-primary))',
                                lineHeight: '1.5',
                              }}
                            >
                              Ator:{' '}
                              <strong style={{ color: 'hsl(var(--text-main))' }}>
                                {log.admin}
                              </strong>{' '}
                              executou alteração em{' '}
                              <strong style={{ color: 'hsl(var(--brand))' }}>{log.tenant}</strong>
                            </div>
                            {log.details && (
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: 'hsl(var(--text-muted))',
                                  marginTop: '4px',
                                  fontStyle: 'italic',
                                }}
                              >
                                Parâmetros: {log.details}
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  color: 'hsl(var(--text-muted))',
                                  textTransform: 'uppercase',
                                  fontWeight: 800,
                                }}
                              >
                                IP Origem:
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontFamily: 'monospace',
                                  background: 'hsl(var(--bg-main))',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  border: '1px dashed hsl(var(--border))',
                                }}
                              >
                                {log.ip}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  color: 'hsl(var(--text-muted))',
                                  textTransform: 'uppercase',
                                  fontWeight: 800,
                                }}
                              >
                                Serviço:
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: 'hsl(var(--text-primary))',
                                }}
                              >
                                {log.origin}
                              </span>
                            </div>
                            <button
                              type="button"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'hsl(var(--brand))',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 800,
                                marginTop: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              <FileJson size={14} />{' '}
                              {isExpanded ? 'Esconder Payload' : 'Ver Payload Diff'}
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Payload Area */}
                        {isExpanded && (
                          <div
                            style={{
                              background: '#0f172a', // Dark theme for code
                              padding: '16px',
                              borderTop: `1px solid ${nodeColor}`,
                            }}
                          >
                            <div
                              style={{
                                fontSize: '10px',
                                color: '#94a3b8',
                                fontWeight: 800,
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                              }}
                            >
                              JSON Payload Inspection
                            </div>
                            <pre
                              style={{
                                margin: 0,
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                color: '#38bdf8',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                              }}
                            >
                              {log.fakePayload}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
};
