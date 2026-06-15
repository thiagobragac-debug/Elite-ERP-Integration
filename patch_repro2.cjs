const fs = require('fs');
const file = 'src/pages/Pecuaria/ReproductionManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `      if (selectedEvent) {
        const { error } = await supabase.from('eventos_reprodutivos').update(reproPayload).eq('id', selectedEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('eventos_reprodutivos').insert([{ ...reproPayload, ...insertPayload }]);
        if (error) throw error;
      }

      // Atualiza o dossiê reprodutivo do animal (fase atual)
      if (resultado === 'Prenha') {
        await supabase.from('animais').update({ fase_atual: 'Prenha' }).eq('id', animalId);
      } else if (resultado === 'Vazia') {
        await supabase.from('animais').update({ fase_atual: 'Vazia' }).eq('id', animalId);
      } else if (reproPayload.tipo_evento === 'Parto') {
        await supabase.from('animais').update({ fase_atual: 'Lactação' }).eq('id', animalId);
      }

      // Efeito Cascata: Salvar produtos no dossiê de sanidade e dar baixa no estoque
      if (produtos && produtos.length > 0) {
        for (const prod of produtos) {
          const { data: pData } = await supabase.from('produtos').select('is_storable, nome').eq('id', prod.produto_id).maybeSingle();
          
          const custoCalculado = Number(prod.quantidade) * Number(prod.custo_medio || prod.valor_unitario || 0);

          // 1. Inserir em sanidade
          const { data: sanData, error: sanErr } = await supabase.from('sanidade').insert([{
            produto: pData?.nome || 'Produto ID ' + prod.produto_id,
            dose: prod.quantidade + ' un',
            data_manejo: reproPayload.data_evento,
            animal_id: animalId,
            status: 'REALIZADO',
            observacao: 'Fármaco aplicado em manejo reprodutivo',
            ...insertPayload
          }]).select();
          if (sanErr) throw sanErr;

          // 2. Inserir em sanidade_animais para o taxímetro
          if (sanData && sanData[0]) {
             await supabase.from('sanidade_animais').insert([{
               sanidade_id: sanData[0].id,
               animal_id: animalId,
               data_aplicacao: reproPayload.data_evento,
               custo_estimado: custoCalculado,
               status: 'REALIZADO',
               ...insertPayload
             }]);
          }

          // 3. Dar baixa no estoque se for controlável
          // Removido prod.deposito_id obrigatoriedade caso seja produto sem deposito fixo, 
          // Mas garantindo que exista para a movimentacao
          if (pData?.is_storable && prod.deposito_id) {
            await supabase.from('estoque_movimentacoes').insert([{
              produto_id: prod.produto_id,
              deposito_id: prod.deposito_id,
              tipo_movimentacao: 'saida',
              quantidade: Number(prod.quantidade),
              custo_unitario: Number(prod.custo_medio || prod.valor_unitario || 0),
              custo_total: custoCalculado,
              data_movimentacao: new Date().toISOString(),
              motivo: 'Uso em manejo reprodutivo',
              ...insertPayload
            }]);
            
            const { data: currentStock } = await supabase.from('produtos_fazenda')
              .select('quantidade, id').eq('produto_id', prod.produto_id).eq('deposito_id', prod.deposito_id).maybeSingle();

            if (currentStock) {
              await supabase.from('produtos_fazenda').update({
                quantidade: Number(currentStock.quantidade) - Number(prod.quantidade)
              }).eq('id', currentStock.id);
            } else {
              await supabase.from('produtos_fazenda').insert([{
                produto_id: prod.produto_id,
                deposito_id: prod.deposito_id,
                quantidade: -Number(prod.quantidade),
                ...insertPayload
              }]);
            }
          }
        }
      }`;

const replacement = `      // Calcula o custo total dos produtos para o Custo Reprodução
      let totalCustoRepro = 0;
      if (produtos && produtos.length > 0) {
        produtos.forEach((p: any) => {
          totalCustoRepro += Number(p.quantidade) * Number(p.custo_medio || p.valor_unitario || 0);
        });
      }

      reproPayload.custo = totalCustoRepro;

      if (selectedEvent) {
        const { error } = await supabase.from('eventos_reprodutivos').update(reproPayload).eq('id', selectedEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('eventos_reprodutivos').insert([{ ...reproPayload, ...insertPayload }]);
        if (error) throw error;
      }

      // Atualiza o dossiê reprodutivo do animal (fase atual)
      if (resultado === 'Prenha') {
        await supabase.from('animais').update({ fase_atual: 'Prenha' }).eq('id', animalId);
      } else if (resultado === 'Vazia') {
        await supabase.from('animais').update({ fase_atual: 'Vazia' }).eq('id', animalId);
      } else if (reproPayload.tipo_evento === 'Parto') {
        await supabase.from('animais').update({ fase_atual: 'Lactação' }).eq('id', animalId);
      }

      // Efeito Cascata: Salvar produtos no dossiê de sanidade e dar baixa no estoque
      if (produtos && produtos.length > 0) {
        for (const prod of produtos) {
          const { data: pData } = await supabase.from('produtos').select('is_storable, nome').eq('id', prod.produto_id).maybeSingle();
          
          const custoCalculado = Number(prod.quantidade) * Number(prod.custo_medio || prod.valor_unitario || 0);

          // 1. Inserir em sanidade
          const { data: sanData, error: sanErr } = await supabase.from('sanidade').insert([{
            produto: pData?.nome || 'Produto ID ' + prod.produto_id,
            dose: prod.quantidade + ' un',
            data_manejo: reproPayload.data_evento,
            animal_id: animalId,
            status: 'REALIZADO',
            observacao: 'Fármaco aplicado em manejo reprodutivo',
            ...insertPayload
          }]).select();
          if (sanErr) throw sanErr;

          // 2. Inserir em sanidade_animais para o taxímetro
          if (sanData && sanData[0]) {
             await supabase.from('sanidade_animais').insert([{
               sanidade_id: sanData[0].id,
               animal_id: animalId,
               data_aplicacao: reproPayload.data_evento,
               valor_total_aplicado: custoCalculado,
               status: 'REALIZADO',
               ...insertPayload
             }]);
          }

          // 3. Dar baixa no estoque se for controlável
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
            }]);
            
            const { data: currentStock } = await supabase.from('saldos_estoque')
              .select('quantidade, id').eq('produto_id', prod.produto_id).eq('deposito_id', prod.deposito_id).maybeSingle();

            if (currentStock) {
              await supabase.from('saldos_estoque').update({
                quantidade: Number(currentStock.quantidade) - Number(prod.quantidade)
              }).eq('id', currentStock.id);
            } else {
              await supabase.from('saldos_estoque').insert([{
                produto_id: prod.produto_id,
                deposito_id: prod.deposito_id,
                quantidade: -Number(prod.quantidade),
                ...insertPayload
              }]);
            }
          }
        }
      }`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed tables in ReproductionManagement!');
