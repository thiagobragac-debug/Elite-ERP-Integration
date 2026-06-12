const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Saas/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('movimentacoes_estoque').select('*').order('created_at', { ascending: false }).limit(5);
  if (error) console.error(error);
  console.log(JSON.stringify(data, null, 2));
}

check();
