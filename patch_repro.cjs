const fs = require('fs');
const file = 'src/pages/Pecuaria/ReproductionManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `  const saveReproMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (selectedEvent) {
        const { error } = await supabase.from('eventos_reprodutivos').update(payload).eq('id', selectedEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('eventos_reprodutivos').insert([{ ...payload, ...insertPayload }]);
        if (error) throw error;
      }
    },`;

const replacement1 = `  const saveReproMutation = useMutation({
    mutationFn: async ({ reproPayload, animalId, resultado, produtos }: any) => {
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
          
          // 1. Inserir em sanidade
          const { data: sanData, error: sanErr } = await supabase.from('sanidade').insert([{
            produto_id: prod.produto_id,
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
               custo_estimado: (Number(prod.quantidade) * Number(prod.custo_unitario || 0)),
               status: 'REALIZADO',
               ...insertPayload
             }]);
          }

          // 3. Dar baixa no estoque se for controlável
          if (pData?.is_storable && prod.deposito_id) {
            await supabase.from('estoque_movimentacoes').insert([{
              produto_id: prod.produto_id,
              deposito_id: prod.deposito_id,
              tipo_movimentacao: 'saida',
              quantidade: Number(prod.quantidade),
              custo_unitario: Number(prod.custo_unitario || 0),
              custo_total: Number(prod.quantidade) * Number(prod.custo_unitario || 0),
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
      }
    },`;

const target2 = `    saveReproMutation.mutate(payload);
  };`;

const replacement2 = `    saveReproMutation.mutate({
      reproPayload: payload,
      animalId: data.animal_id,
      resultado: data.resultado || data.resultado_diagnostico,
      produtos: data.produtos || []
    });
  };`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed cascade in ReproductionManagement.tsx');
