require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('animais').select('id, brinco, nome, raca, sexo').limit(1);
  console.log("DATA:", JSON.stringify(data));
  console.log("ERROR:", JSON.stringify(error));
}
test();
