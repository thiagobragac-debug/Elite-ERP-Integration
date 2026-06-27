import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('animais')
    .select('id, brinco, status, fazenda_id, tenant_id, romaneio_id')
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', JSON.stringify(data, null, 2));
    
    // Also count total available
    const { count, error: countErr } = await supabase
      .from('animais')
      .select('*', { count: 'exact', head: true })
      .is('romaneio_id', null)
      .in('status', ['ATIVO', 'Ativo', 'ativo']);
      
    console.log('Available animals for romaneio count:', count);
  }
}

test();
