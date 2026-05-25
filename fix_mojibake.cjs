const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  { bad: 'âš\u00A0ï¸ ', good: '⚠️' },
  { bad: 'âœ“', good: '✓' },
  { bad: 'Âœ”', good: '✓' },
  { bad: '?', good: '▲' },
  { bad: '"', good: '▼' },
  { bad: 's?', good: '⚠️' },
  { bad: '?O', good: '❌' },
  { bad: 'o"', good: '🚚' },
  { bad: 'Em Trnsito', good: 'Em Trânsito' },
  { bad: 'Distribuio', good: 'Distribuição' },
  { bad: 'Lotao', good: 'Lotação' },
  { bad: 'dinmica', good: 'dinâmica' },
  { bad: 'Zootcnico', good: 'Zootécnico' },
  { bad: 'eficincia', good: 'eficiência' },
  { bad: 'mecnica', good: 'mecânica' },
  { bad: 'Mecnica', good: 'Mecânica' },
  { bad: 'Logstica', good: 'Logística' },
  { bad: 'Mdio', good: 'Médio' },
  { bad: 'Anlise', good: 'Análise' },
  { bad: 'Varincia', good: 'Variância' },
  { bad: 'Decomposio', good: 'Decomposição' },
  { bad: 'preo', good: 'preço' },
  { bad: 'PECURIA', good: 'PECUÁRIA' },
  { bad: '?', good: '•' },
  { bad: 'Pgina', good: 'Página' },
  { bad: 'Exposio', good: 'Exposição' },
  { bad: 'Eficincia', good: 'Eficiência' },
  { bad: 'especfica', good: 'específica' },
  { bad: 'Viso', good: 'Visão' },
  { bad: 'Sade', good: 'Saúde' },
  { bad: 'Converso', good: 'Conversão' },
  { bad: 'aprovao', good: 'aprovação' },
  { bad: 'Parmetros', good: 'Parâmetros' }
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const r of replacements) {
        if (content.includes(r.bad)) {
          content = content.split(r.bad).join(r.good);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed mojibake in', fullPath);
      }
    }
  }
}

walk(directoryPath);
console.log('Done fixing mojibake.');
