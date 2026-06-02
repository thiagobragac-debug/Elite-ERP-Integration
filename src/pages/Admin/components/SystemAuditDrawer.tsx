import React from 'react';
import { History } from 'lucide-react';
import { SidePanel } from '../../../components/Layout/SidePanel';

interface SystemAuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogsList: any[];
}

export const SystemAuditDrawer: React.FC<SystemAuditDrawerProps> = ({
  isOpen,
  onClose,
  auditLogsList
}) => {
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        // action for complete report
      }}
      title="Auditoria em Tempo Real"
      subtitle="Logs críticos de segurança e infraestrutura"
      icon={History}
      submitLabel="Ver Relatório Completo"
      size="medium"
      isReadOnly={true}
      hideSubmit={false}
    >
      <div className="drawer-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
        {auditLogsList.map(log => (
          <div key={log.id} className="audit-log-item" style={{ 
            display: 'flex', 
            gap: '12px', 
            padding: '16px', 
            background: 'hsl(var(--bg-card))', 
            borderRadius: '12px',
            border: '1px solid hsl(var(--border))'
          }}>
            <div className={`status-dot ${log.status}`} style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: log.status === 'danger' ? '#ef4444' : log.status === 'warning' ? '#f59e0b' : '#10b981',
              marginTop: '6px',
              flexShrink: 0
            }} />
            <div className="log-info" style={{ flex: 1 }}>
              <div className="log-top" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="log-action" style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--brand))' }}>{log.action}</span>
                <span className="log-time" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>{log.time}</span>
              </div>
              <p className="log-desc" style={{ fontSize: '13px', margin: 0, color: 'hsl(var(--text-primary))' }}>
                <strong>{log.admin}</strong> agindo em <span>{log.tenant}</span>
              </p>
              {log.details && (
                <p className="log-details-sub-text" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', margin: '4px 0 0', fontStyle: 'italic' }}>
                  {log.details}
                </p>
              )}
            </div>
          </div>
        ))}
        {auditLogsList.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
            Nenhum registro encontrado.
          </div>
        )}
      </div>
    </SidePanel>
  );
};
