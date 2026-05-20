const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nmirpozhgcoabcjwgvqk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak'
);

const tablesToCheck = [
  { table: 'pesagens', cols: 'id, peso, data_pesagem, tipo, animal_id, lote_id, observacao, fazenda_id, tenant_id, created_at' },
  { table: 'abastecimentos', cols: 'id, data, litros, valor_total, tipo_combustivel, responsavel, valor_medidor, maquina_id, fazenda_id, tenant_id' },
  { table: 'pedidos_venda', cols: 'id, numero, status, created_at, valor_total, observacoes, cliente_id, fazenda_id, tenant_id' },
  { table: 'contratos', cols: 'id, numero_contrato, tipo, status, data_inicio, data_fim, valor_total, cliente_id, fornecedor_id, fazenda_id, tenant_id' },
  { table: 'notas_saida', cols: 'id, numero_nota, serie, status, data_emissao, valor_total, natureza_operacao, cliente_id, fazenda_id, tenant_id' },
  { table: 'sanidade', cols: '*' },
];

async function run() {
  for (const { table, cols } of tablesToCheck) {
    const { data, error } = await supabase.from(table).select(cols).limit(1);
    if (error) {
      console.log(`FAIL ${table}: ${error.message}`);
    } else {
      console.log(`OK   ${table}`);
    }
  }
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
