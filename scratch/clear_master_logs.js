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

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- LOGGING IN AS SAAS_ADMIN ---');
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'thiagobraga.c@gmail.com',
    password: 'Thi@#sd1'
  });

  if (authError) {
    console.error('Failed to log in:', authError);
    return;
  }
  
  console.log('Logged in successfully.');

  const targets = [
    { id: '00000000-0000-0000-0000-000000000000', name: 'TEMPLATE MASTER [NÃO EXCLUIR]' },
    { id: '00000000-0000-0000-0000-000000000001', name: 'TBC SOLUÇÃO EM ERP' }
  ];

  for (const tenant of targets) {
    console.log(`\nClearing logs for tenant: ${tenant.name} (${tenant.id})`);
    
    // Clear from audit_logs
    const { count: countLogs, error: errLogs } = await supabase
      .from('audit_logs')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenant.id);
      
    if (errLogs) {
      console.error(`Error clearing audit_logs:`, errLogs);
    } else {
      console.log(`Successfully deleted ${countLogs} logs from audit_logs.`);
    }

    // Clear from saas_audit_logs
    const { count: countSaasLogs, error: errSaasLogs } = await supabase
      .from('saas_audit_logs')
      .delete({ count: 'exact' })
      .eq('target_tenant_id', tenant.id);
      
    if (errSaasLogs) {
      console.error(`Error clearing saas_audit_logs:`, errSaasLogs);
    } else {
      console.log(`Successfully deleted ${countSaasLogs} logs from saas_audit_logs.`);
    }
  }

  console.log('\n--- VERIFICATION ---');
  for (const tenant of targets) {
    const { count, error } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id);
      
    if (error) {
      console.error(`Verification error for ${tenant.name}:`, error);
    } else {
      console.log(`Tenant ${tenant.name} now has: ${count} logs.`);
    }
  }
}

run();
