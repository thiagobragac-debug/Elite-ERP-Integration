import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('Fetching demo tenants...');
  const { data: tenants, error: fetchError } = await supabase
    .from('tenants')
    .select('id, nome, plano')
    .eq('plano', 'DEMO');

  if (fetchError) {
    console.error('Error fetching tenants:', fetchError);
    process.exit(1);
  }

  if (!tenants || tenants.length === 0) {
    console.log('No tenants found with plan = DEMO.');
    return;
  }

  console.log(`Found ${tenants.length} tenants to update.`);

  for (const t of tenants) {
    console.log(`Updating tenant: ${t.nome} (ID: ${t.id})`);
    const { error: updateError } = await supabase
      .from('tenants')
      .update({ plano: 'Porteira Aberta' })
      .eq('id', t.id);

    if (updateError) {
      console.error(`Failed to update ${t.id}:`, updateError);
    } else {
      console.log(`Successfully updated ${t.nome}.`);
    }
  }
}

run();
