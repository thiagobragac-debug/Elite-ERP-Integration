const fs = require('fs');
let content = fs.readFileSync('C:/Saas/src/components/Sidebar/Sidebar.tsx', 'utf8');

const replacements = {
  'Administraǜo': 'Administração',
  'Usuǭrio': 'Usuário',
  'Configuraes': 'Configurações',
  'Anǭlise Avanada': 'Análise Avançada',
  'Pecuǭria': 'Pecuária',
  'Reproduǜo': 'Reprodução',
  'Nutriǜo': 'Nutrição',
  'Mǭquina': 'Máquina',
  'Manutenǜo': 'Manutenção',
  'Cotaǜo': 'Cotação',
  'Solicitaǜo': 'Solicitação',
  'Gestǜo': 'Gestão',
  'EstratǸgica': 'Estratégica'
};

for (const [bad, good] of Object.entries(replacements)) {
  content = content.split(bad).join(good);
}

// Just regex replace all weird chars
content = content.replace(/ǜ/g, 'çã');
content = content.replace(/ǭ/g, 'á');
content = content.replace(//g, 'çõ'); // approximate

fs.writeFileSync('C:/Saas/src/components/Sidebar/Sidebar.tsx', content, 'utf8');