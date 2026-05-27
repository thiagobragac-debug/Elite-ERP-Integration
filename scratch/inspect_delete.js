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

async function inspect() {
  console.log('--- LOGGING IN ---');
  
  // Try logging in with the standard credentials first
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'thiagobraga.c@gmail.com',
    password: 'Thi@#sd1'
  });

  if (authError) {
    console.warn('Login with gmail failed, trying hotmail...');
    const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
      email: 'thiagobraga.c@hotmail.com',
      password: 'Thi@#sd1'
    });
    if (authError2) {
      console.error('All login attempts failed:', authError2);
    } else {
      console.log('Logged in successfully as hotmail admin.');
    }
  } else {
    console.log('Logged in successfully as gmail admin.');
  }

  // Check profile in database
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'thiagobraga.c@gmail.com')
    .single();
  
  if (profileErr) {
    console.error('Error fetching profile:', profileErr);
  } else {
    console.log('User Profile in DB:', { id: profile.id, role: profile.role, tenant_id: profile.tenant_id });
  }

  console.log('\n--- INSPECTING SYSTEM ---');

  // Let's get the list of tenants in the database
  const { data: tenants, error: tenantsErr } = await supabase
    .from('tenants')
    .select('id, nome, status, created_at')
    .order('created_at', { ascending: false });

  if (tenantsErr) {
    console.error('Error fetching tenants:', tenantsErr);
  } else {
    console.log(`Found ${tenants.length} tenants in the database:`);
    tenants.forEach(t => {
      console.log(`- [${t.status}] ID: ${t.id} | Name: ${t.nome} | Created: ${t.created_at}`);
    });
  }

  // Let's call a RPC to get custom function details using postgres pg_proc
  console.log('\n--- FETCHING postgres pg_proc for delete_demo_tenant ---');
  const { data: funcInfo, error: funcErr } = await supabase.rpc('get_reproductive_stats', { p_tenant_id: '00000000-0000-0000-0000-000000000000' });
  // We can write a custom RPC query if we had custom SQL, but we can also execute a select on pg_catalog via an existing view or table if it's exposed, but pg_proc is not exposed.
  // Wait, let's see if we can check if there are audit logs for the newly created tenant.
  if (tenants && tenants.length > 0) {
    const latestTenantId = tenants[0].id;
    console.log(`\nChecking audit logs for latest tenant (${latestTenantId} - ${tenants[0].name}):`);
    const { data: logs, error: logsErr } = await supabase
      .from('audit_logs')
      .select('id, action, entity, description, created_at')
      .eq('tenant_id', latestTenantId)
      .limit(10);
    
    if (logsErr) {
      console.error('Error fetching logs:', logsErr);
    } else {
      console.log(`Found ${logs.length} logs:`);
      logs.forEach(l => {
        console.log(`- [${l.action}] ${l.entity}: ${l.description} | ${l.created_at}`);
      });
    }
  }
}

inspect();
