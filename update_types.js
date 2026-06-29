const fs = require('fs');
const file = 'src/types/database.types.ts';
let content = fs.readFileSync(file, 'utf8');

const tables = [
  'lotes', 'pastos', 'pesagens', 'nutricao_animais',
  'sanidade_animais', 'eventos_reprodutivos', 'confinamento', 'romaneios'
];

tables.forEach(table => {
  const regex = new RegExp(\(\\\\s*\:\\\\s*\\\\{\\\\s*Row:\\\\s*\\\\{[^}]*?)(\\\\n\\\\s*\\\\})\, 'g');
  content = content.replace(regex, (match, p1, p2) => {
    if (!match.includes('especie_id:')) {
      return \\\\n          especie_id: string | null\\n          aptidao_id: string | null\\;
    }
    return match;
  });

  const regexInsert = new RegExp(\(\\\\s*\:\\\\s*\\\\{[^]*?Insert:\\\\s*\\\\{[^}]*?)(\\\\n\\\\s*\\\\})\, 'g');
  content = content.replace(regexInsert, (match, p1, p2) => {
    if (!match.includes('especie_id?:')) {
      return \\\\n          especie_id?: string | null\\n          aptidao_id?: string | null\\;
    }
    return match;
  });

  const regexUpdate = new RegExp(\(\\\\s*\:\\\\s*\\\\{[^]*?Update:\\\\s*\\\\{[^}]*?)(\\\\n\\\\s*\\\\})\, 'g');
  content = content.replace(regexUpdate, (match, p1, p2) => {
    if (!match.includes('especie_id?:')) {
      return \\\\n          especie_id?: string | null\\n          aptidao_id?: string | null\\;
    }
    return match;
  });
});

fs.writeFileSync(file, content, 'utf8');
