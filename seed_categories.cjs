const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nmirpozhgcoabcjwgvqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak';
const supabase = createClient(supabaseUrl, supabaseKey);

const defaultCategories = [
  { modulo: 'financeiro', nome: 'Receita Operacional', cor: '#10b981', is_active: true },
  { modulo: 'financeiro', nome: 'Venda de Animais', cor: '#059669', is_active: true },
  { modulo: 'financeiro', nome: 'Venda de Safra', cor: '#34d399', is_active: true },
  { modulo: 'financeiro', nome: 'Despesa Administrativa', cor: '#f59e0b', is_active: true },
  { modulo: 'financeiro', nome: 'Nutrição Animal', cor: '#d97706', is_active: true },
  { modulo: 'financeiro', nome: 'Sanidade Animal', cor: '#b45309', is_active: true },
  { modulo: 'financeiro', nome: 'Insumos Agrícolas', cor: '#f97316', is_active: true },
  { modulo: 'financeiro', nome: 'Mão de Obra', cor: '#ef4444', is_active: true },
  { modulo: 'financeiro', nome: 'Manutenção de Frota', cor: '#8b5cf6', is_active: true },
  { modulo: 'financeiro', nome: 'Combustível', cor: '#ec4899', is_active: true },
  { modulo: 'financeiro', nome: 'Impostos e Taxas', cor: '#64748b', is_active: true },
  { modulo: 'financeiro', nome: 'Investimentos', cor: '#3b82f6', is_active: true }
];

async function seed() {
  console.log('Buscando tenants...');
  const { data: tenants, error: tenantError } = await supabase.from('tenants').select('id');
  
  if (tenantError) {
    console.error('Erro ao buscar tenants:', tenantError);
    return;
  }

  for (const tenant of tenants) {
    console.log(`Injetando no tenant ${tenant.id}...`);
    
    // Check if they already have financial categories
    const { data: existing } = await supabase
      .from('categorias_sistema')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('modulo', 'financeiro');
      
    if (existing && existing.length > 0) {
      console.log(`Tenant ${tenant.id} já possui categorias. Ignorando.`);
      continue;
    }

    const payload = defaultCategories.map(cat => ({
      ...cat,
      tenant_id: tenant.id
    }));

    const { error: insertError } = await supabase
      .from('categorias_sistema')
      .insert(payload);

    if (insertError) {
      console.error(`Erro ao inserir no tenant ${tenant.id}:`, insertError);
    } else {
      console.log(`Categorias inseridas com sucesso para o tenant ${tenant.id}!`);
    }
  }
}

seed();
