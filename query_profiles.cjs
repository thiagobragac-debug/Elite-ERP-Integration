const { createClient } = require('@supabase/supabase-js');
const url = 'https://nmirpozhgcoabcjwgvqk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak';
const supabase = createClient(url, key);

async function run() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(10);
    
  console.log(profiles, error);
}
run();