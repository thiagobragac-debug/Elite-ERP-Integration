import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nmirpozhgcoabcjwgvqk.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'copy it from env';

// Let's read the .env file to get the anon key
import fs from 'fs';
let anonKey = '';
if (fs.existsSync('C:/Saas/.env')) {
  const envFile = fs.readFileSync('C:/Saas/.env', 'utf-8');
  const match = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
  if (match) anonKey = match[1];
}

const supabase = createClient(supabaseUrl, anonKey);

async function check() {
  const { data, error } = await supabase.from('fornecedores').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    if (data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
    } else {
      console.log("No data. Cannot determine schema without data using select *.");
    }
  }
}
check();
