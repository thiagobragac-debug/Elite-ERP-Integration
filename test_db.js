import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://nmirpozhgcoabcjwgvqk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak');

async function test() {
  const { data: prod } = await supabase.from('produtos').select('nome, is_storable').limit(5);
  console.log('Produtos:', prod);
}

test();
