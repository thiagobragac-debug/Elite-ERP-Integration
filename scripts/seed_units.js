import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

const env = dotenv.parse(readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  if (!tenants || tenants.length === 0) return console.log('No tenant found');
  const tenantId = tenants[0].id;

  const units = ['ml', 'g', 'mg', 'Caixa', 'Frasco'];
  
  for (const u of units) {
    const { data: existing } = await supabase
      .from('categorias_sistema')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('modulo', 'unidades')
      .eq('nome', u);
      
    if (!existing || existing.length === 0) {
      await supabase.from('categorias_sistema').insert({
        tenant_id: tenantId,
        modulo: 'unidades',
        nome: u,
        cor: '#34d399',
        is_active: true
      });
      console.log('Inserted', u);
    } else {
      console.log('Already exists', u);
    }
  }
}

run();
