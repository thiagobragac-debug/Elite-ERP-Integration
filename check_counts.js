import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('C:/Saas/.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function run() {
  const { count: cp, error: ep } = await supabase.from('parceiros').select('*', {count: 'exact', head: true});
  const { count: cc, error: ec } = await supabase.from('clientes').select('*', {count: 'exact', head: true});
  const { count: cf, error: ef } = await supabase.from('fornecedores').select('*', {count: 'exact', head: true});
  
  console.log('parceiros:', cp, ep ? ep.message : '');
  console.log('clientes:', cc, ec ? ec.message : '');
  console.log('fornecedores:', cf, ef ? ef.message : '');
}
run();
