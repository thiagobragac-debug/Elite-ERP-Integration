require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } });
const pecuaria = require('./src/hooks/report-handlers/pecuaria.ts');
pecuaria.dashboardOverview('tenant', 'fazenda', 1, 20).then(res => {
  const estoque = res.stats.find(s => s.label === 'Estoque Biolgico' || s.label === 'Estoque Biológico');
  console.log('Sparkline exists?', !!estoque.sparkline);
  console.log('Sparkline data:', estoque.sparkline);
}).catch(console.error);