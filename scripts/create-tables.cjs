const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://nmirpozhgcoabcjwgvqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS user_drafts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        draft_key TEXT NOT NULL UNIQUE,
        payload JSONB,
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS record_locks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        table_name TEXT,
        record_id UUID,
        user_id UUID,
        user_name TEXT,
        locked_at TIMESTAMPTZ DEFAULT now(),
        expires_at TIMESTAMPTZ
      );
    `
  });
  console.log('Result:', error || 'Tables created successfully via RPC');
}
createTables();
