import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://nmirpozhgcoabcjwgvqk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak');

async function check() {
  const { data, error } = await supabase.from('movimentacoes_estoque').select('*').limit(1);
  if (error) console.error("ERR:", error);
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
  } else {
    console.log("No data, but error is:", error);
  }
}

check();
