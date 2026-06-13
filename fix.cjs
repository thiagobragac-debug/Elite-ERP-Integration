const fs = require('fs');
let code = fs.readFileSync('src/pages/Pecuaria/HealthManagement.tsx', 'utf-8');

// 1. In handleSubmit, update payload creation for data.produtos
code = code.replace(
  /const payload = data\.produtos\.map\(\(p: any\) => \(\{\n\s*tipo: data\.tipo,\n\s*titulo: data\.titulo,\n\s*animal_id: data\.animal_id \|\| null,\n\s*lote_id: data\.lote_id \|\| null,\n\s*data_manejo: data\.data_manejo,\n\s*produto: p\.produto,\n\s*dose: p\.dose,\n\s*via_aplicacao: p\.via_aplicacao,\n\s*local_aplicacao: p\.local_aplicacao,\n\s*carencia_dias: parseInt\(p\.carencia_dias\) \|\| 0,\n\s*observacao: data\.observacao,\n\s*status: data\.status\n\s*\}\)\);/,
  `const payload = data.produtos.map((p: any) => {
        const custoTotal = (Number(p.custo_total || 0) > 0)
          ? Number(p.custo_total)
          : (Number(p.custo_medio || 0) * (Number(p.quantidade || 1)));
        return {
          tipo: data.tipo,
          titulo: data.titulo,
          animal_id: data.animal_id || null,
          lote_id: data.lote_id || null,
          data_manejo: data.data_manejo,
          produto: p.produto || p.nome,
          produto_id: p.produto_id || null,
          dose: p.dose || String(p.quantidade || ''),
          via_aplicacao: p.via_aplicacao || null,
          local_aplicacao: p.local_aplicacao || null,
          carencia_dias: parseInt(p.carencia_dias) || 0,
          custo: custoTotal,
          observacao: data.observacao,
          status: data.status
        };
      });`
);

// 2. In handleSubmit, update payload for single item
code = code.replace(
  /const payload = \{\n\s*tipo: data\.tipo,\n\s*titulo: data\.titulo,\n\s*animal_id: data\.animal_id \|\| null,\n\s*lote_id: data\.lote_id \|\| null,\n\s*data_manejo: data\.data_manejo,\n\s*produto: data\.produto,\n\s*dose: data\.dose,\n\s*via_aplicacao: data\.via_aplicacao,\n\s*local_aplicacao: data\.local_aplicacao,\n\s*carencia_dias: parseInt\(data\.carencia_dias\) \|\| 0,\n\s*observacao: data\.observacao,\n\s*status: data\.status\n\s*\};/,
  `const payload = {
        tipo: data.tipo,
        titulo: data.titulo,
        animal_id: data.animal_id || null,
        lote_id: data.lote_id || null,
        data_manejo: data.data_manejo,
        produto: data.produto,
        produto_id: data.produto_id || null,
        dose: data.dose,
        via_aplicacao: data.via_aplicacao,
        local_aplicacao: data.local_aplicacao,
        carencia_dias: parseInt(data.carencia_dias) || 0,
        custo: parseFloat(String(data.custo || 0)) || 0,
        observacao: data.observacao,
        status: data.status
      };`
);

// 3. Update the cascade logic loop and add error check
code = code.replace(
  /for \(const sanidade of sanidadeData\) \{\n\s*\/\/ Obtem custo medio atual do produto, se houver\n\s*let custoMedio = 0;\n\s*if \(sanidade\.produto_id\) \{\n\s*const \{ data: prod \} = await supabase\.from\('produtos'\)\.select\('custo_medio'\)\.eq\('id', sanidade\.produto_id\)\.maybeSingle\(\);\n\s*if \(prod\) custoMedio = Number\(prod\.custo_medio \|\| 0\);\n\s*\}/,
  `for (let i = 0; i < sanidadeData.length; i++) {
            const sanidade = sanidadeData[i];
            const originalPayload = insertions[i];
            const prodId = originalPayload.produto_id;
            
            // Obtem custo medio atual do produto, se houver
            let custoMedio = 0;
            if (prodId) {
              const { data: prod } = await supabase.from('produtos').select('custo_medio').eq('id', prodId).maybeSingle();
              if (prod) custoMedio = Number(prod.custo_medio || 0);
            }`
);

code = code.replace(
  /produto_id: sanidade\.produto_id \|\| null,\n\s*quantidade_dose: parsedDose,\n\s*valor_unitario_aplicado: custoMedio,\n\s*valor_total_aplicado: totalDoseCost,\n\s*data_aplicacao: sanidade\.data_manejo,\n\s*fase: fase\n\s*\}\)\);\n\n\s*await supabase\.from\('sanidade_animais'\)\.insert\(sanidadeAnimaisInserts\);\n\s*\}/g,
  `produto_id: prodId || null,
                 quantidade_dose: parsedDose,
                 valor_unitario_aplicado: custoMedio,
                 valor_total_aplicado: totalDoseCost,
                 data_aplicacao: sanidade.data_manejo,
                 fase: fase
               }));

               const { error: saError } = await supabase.from('sanidade_animais').insert(sanidadeAnimaisInserts);
               if (saError) {
                 console.error('Erro no sanidade_animais:', saError);
                 throw new Error('Erro no efeito cascata: ' + saError.message);
               }
            }`
);

fs.writeFileSync('src/pages/Pecuaria/HealthManagement.tsx', code);
console.log('Script completed');
