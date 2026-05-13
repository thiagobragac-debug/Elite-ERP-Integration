const fs = require('fs');
const path = 'c:/Saas/src/pages/Admin/SaaSAdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

// Use a simple search
const searchStr = '</>\n                )}';
const monitorEnd = content.indexOf(searchStr);

if (monitorEnd !== -1) {
    const prefix = content.slice(0, monitorEnd + searchStr.length);
    const suffixStart = content.indexOf('{ label: \'Reprocessar Falhas\'');
    const suffix = content.slice(suffixStart);

    const middle = `

                {/* Strategic Actions Bar - Diamond Parity 5.0 (Relocated to Footer) */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '24px', 
                  marginTop: '40px', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  border: '1px solid hsl(var(--border) / 0.6)', 
                  background: 'linear-gradient(to right, hsl(var(--muted) / 0.3), hsl(var(--background)))',
                  width: '100%'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingRight: '24px', borderRight: '1px solid hsl(var(--border))' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                      <div style={{ margin: 'auto' }}><Zap size={22} fill="#6366f1" /></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: 'hsl(var(--text-main))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ações de Governança</h4>
                      <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', opacity: 0.8 }}>Hub Estratégico</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flex: 1, gap: '12px', alignItems: 'center' }}>
                    {[
`;
    fs.writeFileSync(path, prefix + middle + suffix);
    console.log('File restored successfully');
} else {
    console.error('Search string not found');
}
