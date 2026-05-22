require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', esModuleInterop: true } });
const pecuaria = require('./src/hooks/report-handlers/pecuaria.ts');
pecuaria.dashboardOverview('tenant', 'fazenda', 1, 20).then(res => {
  const estoque = res.stats.find(s => s.label.includes('Estoque Bi'));
  console.log('Estoque Label:', estoque.label);
  console.log('Sparkline exists?', !!estoque.sparkline);
  console.log('Sparkline data length:', estoque.sparkline ? estoque.sparkline.length : 0);
}).catch(console.error);