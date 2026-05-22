const { createClient } = require('@supabase/supabase-js');
const url = 'https://nmirpozhgcoabcjwgvqk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak';
const supabase = createClient(url, key);

async function run() {
  // Try to find the user
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'thiagobraga.c@gmail.com')
    .single();
    
  if (error) {
    console.error('Error finding profile:', error);
    // Maybe query by auth table if accessible?
  } else {
    console.log('Found profile:', profile);
    
    // Update role and permissions
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'ADMIN',
        permissions: ['all']
      })
      .eq('id', profile.id)
      .select();
      
    if (updateError) {
      console.error('Error updating:', updateError);
    } else {
      console.log('Updated profile successfully:', updated);
    }
  }
}
run();