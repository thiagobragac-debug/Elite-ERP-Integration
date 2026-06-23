import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testUpdate() {
  // We need to authenticate to test RLS
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'thiagobraga.c@hotmail.com',
    password: 'password' // We probably don't know the password
  });
  
  console.log("Auth:", authError ? authError.message : "Success");
}

testUpdate();
