const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nmirpozhgcoabcjwgvqk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak');

async function testDelete() {
  const { data, error } = await supabase.rpc('get_triggers_test', {}); // Just to see if there's a trigger function
  console.log(data, error);
}

testDelete();
