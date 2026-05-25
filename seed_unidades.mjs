import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nmirpozhgcoabcjwgvqk.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Fetching tenant_id...');
  const { data: catData, error: catError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  if (catError) {
    console.error('Error fetching tenant:', catError);
    return;
  }

  if (!catData || catData.length === 0) {
    console.error('No tenant_id found in tenants table');
    return;
  }

  const tenantId = catData[0].id;
  console.log('Found tenantId:', tenantId);

  const defaultCategories = [
    { tenant_id: tenantId, modulo: 'unidades', nome: 'un', cor: '#94a3b8', is_active: true },
    { tenant_id: tenantId, modulo: 'unidades', nome: 'kg', cor: '#3b82f6', is_active: true },
    { tenant_id: tenantId, modulo: 'unidades', nome: 'ton', cor: '#ef4444', is_active: true },
    { tenant_id: tenantId, modulo: 'unidades', nome: 'L', cor: '#10b981', is_active: true },
    { tenant_id: tenantId, modulo: 'unidades', nome: 'm³', cor: '#f59e0b', is_active: true }
  ];

  console.log('Inserting units...');
  const { error } = await supabase.from('categorias_sistema').insert(defaultCategories);

  if (error) {
    console.error('Error inserting units:', error);
  } else {
    console.log('Units inserted successfully!');
  }
}

seed();
