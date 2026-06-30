import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, categorias_sistema!produtos_categoria_id_fkey(nome)', { count: 'exact' })
    .is('deleted_at', null)
    .eq('categorias_sistema.nome', 'Sementes')
    .eq('tenant_id', '8c897dc1-8b07-479d-a3ee-29fd26c2ae7c');

  console.log(JSON.stringify({ data, error }, null, 2));
}
testQuery();
