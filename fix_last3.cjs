const fs = require('fs');

function fixPecuaria() {
  const fp = 'C:/Saas/src/hooks/report-handlers/pecuaria.ts';
  let content = fs.readFileSync(fp, 'utf8');
  content = content.replace(/label:\s*`R\$\$\{v,\s*value:/g, 'label: `R$$${v}` })), value:');
  fs.writeFileSync(fp, content, 'utf8');
}

function fixFinanceiro() {
  const fp = 'C:/Saas/src/hooks/report-handlers/financeiro.ts';
  let content = fs.readFileSync(fp, 'utf8');
  content = content.replace(/\}\)\)\(\),\s*value:\s*'R\$\s*1\.700\.000'/g, '})), value: \'R$ 1.700.000\'');
  fs.writeFileSync(fp, content, 'utf8');
}

function fixIa() {
  const fp = 'C:/Saas/src/hooks/report-handlers/ia.ts';
  let content = fs.readFileSync(fp, 'utf8');
  // the script injected `})(), value:` which made it `.map(...)()`. It should be `.map(...)); })()`.
  content = content.replace(/\}\)\)\(\),\s*value:\s*'R\$\s*1\.700\.000'/g, '})); })(), value: \'R$ 1.700.000\'');
  fs.writeFileSync(fp, content, 'utf8');
}

fixPecuaria();
fixFinanceiro();
fixIa();
console.log('Fixed last 3 syntax errors.');