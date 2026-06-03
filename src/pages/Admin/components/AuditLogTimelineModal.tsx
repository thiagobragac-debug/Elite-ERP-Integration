import React from 'react';
import { Shield, Activity, CheckSquare, X } from 'lucide-react';
import { SidePanel } from '../../../components/Layout/SidePanel';

interface AuditLogTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAuditTenant: any;
  auditLogs: any[];
  logsLoading: boolean;
}

export const AuditLogTimelineModal: React.FC<AuditLogTimelineModalProps> = ({
  isOpen,
  onClose,
  selectedAuditTenant,
  auditLogs,
  logsLoading
}) => {
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        // Here we could implement export logic
      }}
      title="Linha do Tempo de Auditoria"
      subtitle={`${selectedAuditTenant?.name || 'N/A'} • ID: ${selectedAuditTenant?.id?.substring(0, 8) || 'N/A'}`}
      icon={Shield}
      submitLabel="Exportar Log Completo"
      size="large"
      isReadOnly={true}
      hideSubmit={false} // Showing submit button for Export
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: 'hsl(var(--bg-main))', margin: '-24px -24px 0 -24px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="stat-pill" style={{ background: 'hsl(var(--bg-card))', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '10px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Total de Eventos</span>
              <span style={{ fontWeight: 800, fontSize: '16px' }}>{auditLogs.length}</span>
            </div>
            <div className="stat-pill" style={{ background: 'hsl(var(--bg-card))', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '10px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Última Atividade</span>
              <span style={{ fontWeight: 800, fontSize: '16px' }}>{auditLogs[0] ? new Date(auditLogs[0].created_at).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
          {logsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Activity className="animate-spin" size={32} color="hsl(var(--brand))" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <Shield size={48} style={{ opacity: 0.2, marginBottom: '16px', display: 'inline-block' }} />
              <p>Nenhum registro de auditoria encontrado para este inquilino.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {auditLogs.map((log, index) => (
                <div key={log.id} style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  padding: '16px', 
                  background: 'hsl(var(--bg-card))', 
                  borderRadius: '12px', 
                  border: '1px solid #f1f5f9',
                  position: 'relative'
                }}>
                  <div style={{ 
                    width: '2px', 
                    height: '100%', 
                    background: '#e2e8f0', 
                    position: 'absolute', 
                    left: '27px', 
                    top: '40px',
                    display: index === auditLogs.length - 1 ? 'none' : 'block'
                  }} />
                  
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: log.action === 'INSERT' ? '#ecfdf5' : (log.action === 'DELETE' ? '#fef2f2' : '#eff6ff'),
                    color: log.action === 'INSERT' ? '#059669' : (log.action === 'DELETE' ? '#dc2626' : '#2563eb'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    flexShrink: 0
                  }}>
                    {log.action === 'INSERT' ? <CheckSquare size={12} /> : (log.action === 'DELETE' ? <X size={12} /> : <Activity size={12} />)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
                        {log.action} • {log.entity}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px 0' }}>
                      {log.description || `Alteração no registro ${log.entity_id}`}
                    </p>
                    {log.new_data && (
                      <div style={{ 
                        background: 'hsl(var(--bg-main))', 
                        padding: '10px', 
                        borderRadius: '8px', 
                        fontSize: '11px', 
                        fontFamily: 'monospace',
                        color: '#475569',
                        border: '1px solid #f1f5f9'
                      }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(log.new_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
};
