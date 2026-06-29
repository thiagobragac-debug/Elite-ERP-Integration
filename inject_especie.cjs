const fs = require('fs');
const path = require('path');

const dir = 'C:\\Saas\\src\\pages\\Bovinocultura';
const files = [
  'LotManagement.tsx',
  'HealthManagement.tsx',
  'ReproductionManagement.tsx',
  'ConfinementManagement.tsx',
  'AnimalManagement.tsx'
];

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find "tenant_id: activeTenantId," and insert especie_id and aptidao_id right after it.
  // OR find "fazenda_id: " and insert after it.
  
  // Let's use a simpler approach: replace "tenant_id: activeTenantId," with "tenant_id: activeTenantId,\n      especie_id: 'bovino',\n      aptidao_id: 'corte',"
  content = content.replace(/tenant_id:\s*activeTenantId,/g, "tenant_id: activeTenantId,\n      especie_id: 'bovino',\n      aptidao_id: 'corte',");
  
  // For LotManagement, it might not have tenant_id in the payload explicitly if it's appended later.
  // In LotManagement.tsx: "fazenda_id: data.fazenda_id || null,"
  if (file === 'LotManagement.tsx') {
    content = content.replace(/fazenda_id: data\.fazenda_id \|\| null,/g, "fazenda_id: data.fazenda_id || null,\n      especie_id: 'bovino',\n      aptidao_id: 'corte',");
  }

  // In HealthManagement: "status: data.status,"
  if (file === 'HealthManagement.tsx') {
    content = content.replace(/status: data\.status,/g, "status: data.status,\n          especie_id: 'bovino',\n          aptidao_id: 'corte',");
  }

  // AnimalManagement:
  if (file === 'AnimalManagement.tsx') {
    content = content.replace(/tenant_id:\s*activeTenantId/g, "tenant_id: activeTenantId,\n      especie_id: 'bovino',\n      aptidao_id: 'corte'");
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated', file);
});
