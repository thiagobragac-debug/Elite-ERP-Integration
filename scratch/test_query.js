import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nmirpozhgcoabcjwgvqk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak';

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('\n--- Testing Tenants Query ---');
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('*')
    .limit(5);
  
  if (tenantsError) {
    console.error('Tenants Error:', tenantsError);
  } else {
    console.log(`Tenants Success! Found ${tenants.length} tenants.`);
    console.log(JSON.stringify(tenants, null, 2));
  }

  console.log('\n--- Testing Invoices Query ---');
  const { data: invoices, error: invoicesError } = await supabase
    .from('saas_invoices')
    .select('*, tenants(name:nome)')
    .limit(5);

  if (invoicesError) {
    console.error('Invoices Error:', invoicesError);
  } else {
    console.log(`Invoices Success! Found ${invoices.length} invoices.`);
    console.log(JSON.stringify(invoices, null, 2));
  }
}

test();
