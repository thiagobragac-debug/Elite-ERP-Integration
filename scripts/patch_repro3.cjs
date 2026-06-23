const fs = require('fs');
const file = 'src/pages/Pecuaria/ReproductionManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `          // 3. Dar baixa no estoque se for controlável
          if (pData?.is_storable && prod.deposito_id) {
            await supabase.from('movimentacoes_estoque').insert([{
              produto_id: prod.produto_id,
              deposito_id: prod.deposito_id,
              tipo: 'SAIDA',
              origem_destino: 'Manejo Reprodutivo',
              quantidade: Number(prod.quantidade),
              custo_unitario: Number(prod.custo_medio || prod.valor_unitario || 0),
              data_movimentacao: new Date().toISOString(),
              animal_id: animalId,
              ...insertPayload
            }]);`;

const replacement = `          // 3. Dar baixa no estoque se for controlável
          if (pData?.is_storable && prod.deposito_id) {
            const { error: stockErr } = await supabase.from('movimentacoes_estoque').insert([{
              produto_id: prod.produto_id,
              deposito_id: prod.deposito_id,
              tipo: 'SAIDA',
              origem_destino: 'Manejo Reprodutivo',
              quantidade: Number(prod.quantidade),
              valor_unitario: Number(prod.custo_medio || prod.valor_unitario || 0),
              data_movimentacao: new Date().toISOString(),
              ...insertPayload
            }]);
            
            if (stockErr) {
              console.error('Erro na movimentação de estoque:', stockErr);
            }`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed Repro Movement');
