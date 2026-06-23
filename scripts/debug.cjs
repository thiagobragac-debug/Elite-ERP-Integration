const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nmirpozhgcoabcjwgvqk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak');

async function debugInsert() {
  const payload = {
    produto_id: 'a9ec5aeb-cbf9-47ed-8de6-3e429986bbd7', // Valid id if we had one, but we'll see if it complains about animal_id first
    deposito_id: 'a9ec5aeb-cbf9-47ed-8de6-3e429986bbd7',
    tipo: 'SAIDA',
    origem_destino: 'Manejo Reprodutivo',
    quantidade: 1,
    custo_unitario: 10,
    data_movimentacao: new Date().toISOString(),
    animal_id: 'a9ec5aeb-cbf9-47ed-8de6-3e429986bbd7'
  };

  const { data, error } = await supabase.from('movimentacoes_estoque').insert([payload]);
  console.log('Result:', data, 'Error:', error);
}

debugInsert();
