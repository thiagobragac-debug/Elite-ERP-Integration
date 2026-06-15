const fs = require('fs');
const file = 'src/pages/Pecuaria/HealthManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                const { error: stockError } = await supabase.from('movimentacoes_estoque').insert({
                  produto_id: prodId,
                  tipo: 'SAIDA',
                  quantidade: totalQuantityUsed,
                  custo_unitario: custoMedio,
                  data_movimentacao: sanidade.data_manejo,
                  origem_destino: \`Manejo Sanitário: \${sanidade.titulo || sanidade.produto || 'Aplicação'}\`,
                  responsavel: sanidade.veterinario || 'Sistema Pecuária',
                  fazenda_id: activeFarmId,
                  tenant_id: activeTenantId,
                  deposito_id: depositoId
                });`;

const replacement = `                const { error: stockError } = await supabase.from('movimentacoes_estoque').insert({
                  produto_id: prodId,
                  tipo: 'SAIDA',
                  quantidade: totalQuantityUsed,
                  valor_unitario: custoMedio,
                  data_movimentacao: sanidade.data_manejo,
                  origem_destino: \`Manejo Sanitário: \${sanidade.titulo || sanidade.produto || 'Aplicação'}\`,
                  responsavel: sanidade.veterinario || 'Sistema Pecuária',
                  fazenda_id: activeFarmId,
                  tenant_id: activeTenantId,
                  deposito_id: depositoId
                });`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed Health Movement');
