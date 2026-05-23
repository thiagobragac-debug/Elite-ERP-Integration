import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('c:/Saas/.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) env[key.trim()] = values.join('=').trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const email = 'thiagobraga.c@gmail.com'; 
  console.log('Fetching user profile...');
  const { data: profile, error: err1 } = await supabase.from('profiles').select('*').eq('email', email).single();
  console.log('Profile:', profile?.id, err1);

  console.log('Fetching tenant...');
  const { data: tenant, error: err2 } = await supabase.from('tenants').select('*').limit(1).single();
  console.log('Tenant:', tenant?.id, err2);

  if (!tenant) return;

  console.log('Fetching unidades...');
  const { data: unidades, error: err3 } = await supabase.from('unidades').select('*').limit(500).eq('tenant_id', tenant.id);
  console.log('Unidades count:', unidades?.length, err3);

  console.log('Fetching profiles_view...');
  const { data: users, error: err4 } = await supabase.from('profiles_view').select('*, perfis_usuario(nome)').eq('tenant_id', tenant.id);
  console.log('Users count:', users?.length, err4?.message);
}

test();
