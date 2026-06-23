const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nmirpozhgcoabcjwgvqk.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taXJwb3poZ2NvYWJjandndnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjA5MjIsImV4cCI6MjA5MzQzNjkyMn0.TgJr4vnEeXZmxqXr_5_xPqdMlgojrli-Mewy60ocdak';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createPlans() {
  const plans = [
    {
      name: 'Plano Cria',
      price: 197.00,
      users_limit: 3,
      storage_gb: 5,
      features: [
        'Gestão de Rebanho',
        'Lotes',
        'Pastagens',
        'Eventos Sanitários',
        'Pesagens',
        'Relatórios básicos'
      ]
    },
    {
      name: 'Plano Recria',
      price: 397.00,
      users_limit: 8,
      storage_gb: 20,
      features: [
        'Tudo do Cria',
        'Compras',
        'Estoque',
        'Almoxarifado',
        'Custos operacionais'
      ]
    },
    {
      name: 'Plano Engorda',
      price: 697.00,
      users_limit: 15,
      storage_gb: 50,
      features: [
        'Tudo do Recria',
        'Máquinas e Frota',
        'Manutenções',
        'Abastecimentos',
        'Financeiro completo',
        'Indicadores zootécnicos'
      ]
    },
    {
      name: 'Plano Confinamento',
      price: 1297.00,
      users_limit: 999,
      storage_gb: 100,
      features: [
        'Tudo do Engorda',
        'Multiempresa',
        'Multifazenda',
        'Consolidação de resultados',
        'Dashboards executivos',
        'Permissões avançadas'
      ]
    }
  ];

  for (const plan of plans) {
    const { data, error } = await supabase
      .from('saas_plans')
      .insert([plan]);
    
    if (error) {
      console.error('Erro ao criar plano', plan.name, error);
    } else {
      console.log('Criado plano:', plan.name);
    }
  }
}

createPlans();
