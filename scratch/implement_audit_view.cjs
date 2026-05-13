const fs = require('fs');
const path = 'c:/Saas/src/pages/Admin/SaaSAdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add states for Audit Log Modal
content = content.replace(
    /const \[selectedHistoryTenant, setSelectedHistoryTenant\] = useState<any>\(null\);/,
    `const [selectedHistoryTenant, setSelectedHistoryTenant] = useState<any>(null);
  
  const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
  const [selectedAuditTenant, setSelectedAuditTenant] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchAuditLogs = async (tenantId: string) => {
    try {
      setLogsLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const openAuditLogs = (tenant: any) => {
    setSelectedAuditTenant(tenant);
    setIsAuditLogModalOpen(true);
    fetchAuditLogs(tenant.id);
  };`
);

// 2. Update the eye icon in the tenants grid view to call openAuditLogs
content = content.replace(
    /<button className="action-icon-btn" title="Logs"><Eye size=\{16\} \/><\/button>/,
    `<button className="action-icon-btn" onClick={() => openAuditLogs(t)} title="Ver Auditoria"><Eye size={16} /></button>`
);

// 3. Update the eye icon in the tenants list view (ModernTable actions)
// Need to find where actions are defined for tenantColumns or the ModernTable itself
// Actually, let's look at the tenant columns definition
// Wait, in SaaSAdminPanel.tsx around line 790 there is onRowClick, but actions might be inline

// I'll search for the ModernTable in activeTab === 'tenants'
content = content.replace(
    /<button className="action-dot info" title="Ver Detalhes">\s*<Eye size=\{18\} \/>\s*<\/button>/,
    `<button className="action-dot info" onClick={(e) => { e.stopPropagation(); openAuditLogs(item); }} title="Ver Auditoria">
                        <Eye size={18} />
                      </button>`
);

// 4. Add the AuditLogModal component to the end of the file (before the closing div of SaaSAdminPanel)
// I'll put it near other modals
const modalCode = `
      {/* Audit Log Modal - Diamond Precision 5.0 */}
      <AnimatePresence>
        {isAuditLogModalOpen && (
          <div className="elite-modal-overlay" onClick={() => setIsAuditLogModalOpen(false)} style={{ zIndex: 99999 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              className="elite-modal-container"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '800px', height: '90vh', display: 'flex', flexDirection: 'column' }}
            >
              <div className="elite-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Linha do Tempo de Auditoria</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>{selectedAuditTenant?.name} • ID: {selectedAuditTenant?.id.substring(0, 8)}</p>
                  </div>
                </div>
                <button className="icon-btn-secondary" onClick={() => setIsAuditLogModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="elite-modal-content" style={{ padding: '0', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main) / 0.5)' }}>
                   <div style={{ display: 'flex', gap: '12px' }}>
                      <div className="stat-pill" style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Total de Eventos</span>
                        <span style={{ fontWeight: '800', fontSize: '16px' }}>{auditLogs.length}</span>
                      </div>
                      <div className="stat-pill" style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Última Atividade</span>
                        <span style={{ fontWeight: '800', fontSize: '16px' }}>{auditLogs[0] ? new Date(auditLogs[0].created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                   </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                  {logsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                      <Activity className="animate-spin" size={32} color="hsl(var(--brand))" />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--muted-foreground))' }}>
                      <Shield size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                      <p>Nenhum registro de auditoria encontrado para este inquilino.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {auditLogs.map((log, index) => (
                        <div key={log.id} style={{ 
                          display: 'flex', 
                          gap: '16px', 
                          padding: '16px', 
                          background: 'white', 
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
                              <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                                {log.action} • {log.entity}
                              </span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {new Date(log.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px 0' }}>
                              {log.description || \`Alteração no registro \${log.entity_id}\`}
                            </p>
                            {log.new_data && (
                              <div style={{ 
                                background: '#f8fafc', 
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

              <div className="elite-modal-footer">
                <button className="glass-btn secondary" onClick={() => setIsAuditLogModalOpen(false)}>Fechar Registro</button>
                <button className="primary-btn" style={{ background: '#0f172a' }}>Exportar Log Completo</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

// Insert the modal code before the closing tag of the main container or before another modal
// I'll search for the last modal and append it
if (content.includes('</AnimatePresence>')) {
    const lastAnimatePresence = content.lastIndexOf('</AnimatePresence>');
    content = content.slice(0, lastAnimatePresence + 18) + modalCode + content.slice(lastAnimatePresence + 18);
}

fs.writeFileSync(path, content);
console.log('Successfully implemented audit log viewer functionality');
