const fs = require('fs');
const path = 'c:/Saas/src/pages/Admin/SaaSAdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = 'id="export-menu-billing"';
const endMarker = '{/* Strategic Actions Bar';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const headerEnd = content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</div>', startIdx) + 1) + 1) + 6;
    const prefix = content.slice(0, headerEnd);
    const suffix = content.slice(endIdx);

    const historyBlock = `

                {billingSubTab === 'history' && (
                  <div style={{ padding: '40px', background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <History size={32} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Histórico de Auditoria SaaS</h3>
                      <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#64748b' }}>Carregando trilha de transações e eventos do gateway...</p>
                    </div>
                    <div className="animate-pulse" style={{ width: '100%', maxWidth: '400px', height: '200px', background: '#f8fafc', borderRadius: '16px' }} />
                  </div>
                )}

                {billingSubTab === 'monitor' && (
                  <>
                    <ModernTable 
                      data={[
                        { id: 1, name: 'Fazenda Santa Maria', id_str: 'TN-001', plan: 'Enterprise Elite', price: 'R$ 1.200', gateway: 'Stripe', status: 'pago', due: '15/10/2023' },
                        { id: 2, name: 'Agropecuária Vale Verde', id_str: 'TN-002', plan: 'Professional Plus', price: 'R$ 450', gateway: 'Asaas', status: 'pendente', due: '12/10/2023' },
                        { id: 3, name: 'Haras Serra Azul', id_str: 'TN-003', plan: 'Starter Core', price: 'R$ 190', gateway: 'Stripe', status: 'atrasado', due: '05/10/2023' },
                        { id: 4, name: 'Granja Novo Horizonte', id_str: 'TN-004', plan: 'Enterprise Elite', price: 'R$ 1.200', gateway: 'Pagar.me', status: 'pago', due: '18/10/2023' },
                        { id: 5, name: 'Fazenda Bela Vista', id_str: 'TN-005', plan: 'Professional Plus', price: 'R$ 450', gateway: 'Asaas', status: 'processando', due: '14/10/2023' },
                      ].filter(item => 
                        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.id_str.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map(i => ({ ...i, id: i.id_str }))}
                      columns={billingColumns}
                      loading={false}
                      hideHeader={true}
                    />

                    <div style={{ marginTop: '24px', background: '#f8fafc', borderRadius: '24px', padding: '24px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Consumo de Recursos & Cotas</h4>
                          <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Monitoramento de Infraestrutura por Tenant</p>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                           <p style={{ fontSize: '12px', fontWeight: '800', color: '#334155' }}>Infraestrutura Ativa</p>
                           <p style={{ fontSize: '10px', color: '#64748b' }}>Monitoramento Real-Time Ativado (Diamond 5.0)</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
`;
    fs.writeFileSync(path, prefix + historyBlock + suffix);
    console.log('File updated successfully');
} else {
    console.error('Markers not found');
}
