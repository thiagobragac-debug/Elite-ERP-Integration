const fs = require('fs');
const path = 'c:/Saas/src/pages/Admin/SaaSAdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `  const tenantColumns = [
    {
      header: 'Tenant',
      accessor: (item: any) => (
        <div className="table-cell-title flex items-center gap-2">
          <span className="main-text">{item.name}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            {item.id}
          </div>
        </div>
      )
    },
    {
      header: 'Plano',
      accessor: (item: any) => (
        <span className={\`plan-badge \${item.plan.toLowerCase()}\`}>{item.plan}</span>
      )
    },
    {
      header: 'Uso',
      accessor: (item: any) => (
        <div className="flex flex-col gap-1 text-[12px] font-bold text-slate-500">
          <span>{item.users} usuários ativos</span>
          <span>{item.storage} de storage</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div className="flex justify-center">
          <span className={\`status-pill \${item.status === 'Ativo' ? 'active' : 'stopped'}\`}>
            {item.status}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];`;

const newCode = `  const tenantColumns = [
    {
      header: 'Tenant',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0', minWidth: '220px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '10px', 
            background: '#f8fafc', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#6366f1',
            border: '1px solid #e2e8f0',
            flexShrink: 0
          }}>
            <Globe size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: '900', 
              color: '#0f172a', 
              textTransform: 'uppercase', 
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap'
            }}>
              {item.name}
            </span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
              ID: {item.id}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Plano',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={14} style={{ color: '#10b981', flexShrink: 0 }} />
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '900', 
            color: '#0f172a', 
            textTransform: 'uppercase',
            padding: '4px 8px',
            background: '#f0fdf4',
            borderRadius: '6px',
            border: '1px solid #dcfce7'
          }}>
            {item.plan}
          </span>
        </div>
      )
    },
    {
      header: 'Uso de Recursos',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={12} style={{ color: '#6366f1' }} />
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>{item.users} usuários</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={12} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>{item.storage} storage</span>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className={\`status-pill \${item.status === 'Ativo' ? 'active' : 'stopped'}\`}>
            {item.status}
          </span>
        </div>
      ),
      align: 'center' as const
    }
  ];`;

// We use regex to find the block ignoring minor whitespace variations
// Actually, let's just find the start and end line
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('const tenantColumns = ['));
const end = lines.findIndex((l, i) => i > start && l.trim() === '];');

if (start !== -1 && end !== -1) {
    const head = lines.slice(0, start);
    const tail = lines.slice(end + 1);
    fs.writeFileSync(path, head.join('\n') + '\n' + newCode + '\n' + tail.join('\n'));
    console.log('Successfully updated tenantColumns');
} else {
    console.log('Could not find tenantColumns block', { start, end });
}
