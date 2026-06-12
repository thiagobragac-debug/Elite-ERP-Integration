import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://nmirpozhgcoabcjwgvqk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak');

async function check() {
  const { data, error } = await supabase.from('movimentacoes_estoque').select('*').order('created_at', { ascending: false }).limit(5);
  if (error) console.error(error);
  console.log(JSON.stringify(data, null, 2));
}

check();
