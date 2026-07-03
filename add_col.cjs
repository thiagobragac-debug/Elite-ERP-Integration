const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS landing_default_theme text DEFAULT 'dark';" });
  console.log('Result:', data, error);
}
addColumn();
