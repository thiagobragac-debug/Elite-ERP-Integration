/**
 * Runner script for tenant isolation SQL test
 * Executes the SQL test script against Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY (or VITE_SUPABASE_ANON_KEY) in .env');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
console.log(`   URL: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
console.log('🔍 Testing connection...');
const { error: testError } = await supabase
  .from('fazendas')
  .select('id')
  .limit(1);

if (testError) {
  console.error('❌ Connection failed:', testError.message);
  console.error('   This might be due to RLS policies or missing permissions.');
  console.error('   The test will continue anyway...\n');
} else {
  console.log('✅ Connected successfully\n');
}

// Read the SQL test script
console.log('📖 Reading SQL test script...');
const sqlScript = readFileSync(
  join(__dirname, 'src', 'database', 'test-tenant-isolation.sql'),
  'utf-8'
);

console.log('✅ SQL script loaded\n');
console.log('========================================');
console.log('RUNNING TENANT ISOLATION TEST');
console.log('========================================');
console.log('');
console.log('⚠️  NOTE: This script uses Supabase RPC to execute SQL.');
console.log('    For best results, run the SQL script directly in');
console.log('    Supabase SQL Editor where you have full access.\n');

// Execute the SQL script
// Note: Supabase client doesn't support direct SQL execution
// We need to use the SQL Editor or create an RPC function

console.log('========================================');
console.log('ALTERNATIVE: Run SQL Script Manually');
console.log('========================================');
console.log('');
console.log('Since the Supabase JS client does not support raw SQL execution,');
console.log('please follow these steps:');
console.log('');
console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Create a new query');
console.log('4. Copy the contents of: src/database/test-tenant-isolation.sql');
console.log('5. Paste into SQL Editor');
console.log('6. Click "Run" or press Ctrl+Enter');
console.log('');
console.log('The test will:');
console.log('  ✓ Create test data for two tenants');
console.log('  ✓ Verify each tenant can only see their own data');
console.log('  ✓ Verify cross-tenant access is blocked');
console.log('  ✓ Test write protection');
console.log('  ✓ Cleanup all test data');
console.log('');
console.log('Expected result: All tests should PASS with green checkmarks');
console.log('');
console.log('========================================');
console.log('ALTERNATIVE: Run TypeScript Test');
console.log('========================================');
console.log('');
console.log('You can also run the TypeScript version:');
console.log('');
console.log('  npm run test:tenant-isolation');
console.log('');
console.log('Or directly:');
console.log('');
console.log('  node --loader ts-node/esm src/database/test-tenant-isolation.ts');
console.log('');
console.log('========================================');

// Let's run a simplified version of the test using the Supabase client
console.log('\n🧪 Running simplified test via Supabase client...\n');

const TENANT_A_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

try {
  // Cleanup
  console.log('🧹 Cleaning up any existing test data...');
  await supabase.from('animais').delete().like('brinco', 'TEST-TENANT-%');
  await supabase.from('contas_pagar').delete().like('descricao', 'TEST-TENANT-%');
  await supabase.from('contas_receber').delete().like('descricao', 'TEST-TENANT-%');
  await supabase.from('lotes').delete().like('nome', 'TEST-TENANT-%');
  await supabase.from('fazendas').delete().like('nome', 'TEST-TENANT-%');
  await supabase.from('parceiros').delete().like('nome_fantasia', 'TEST-TENANT-%');
  console.log('✅ Cleanup complete\n');

  // Create fazenda for Tenant A
  console.log('📝 Creating test data for Tenant A...');
  const { data: fazendaA, error: fazendaAError } = await supabase
    .from('fazendas')
    .insert({
      tenant_id: TENANT_A_ID,
      nome: 'TEST-TENANT-A-Farm',
      cidade: 'São Paulo',
      estado: 'SP'
    })
    .select()
    .single();

  if (fazendaAError) {
    console.error('❌ Failed to create fazenda A:', fazendaAError.message);
    throw fazendaAError;
  }
  console.log(`  ✅ Created fazenda: ${fazendaA.id}`);

  // Create lote for Tenant A
  const { data: loteA, error: loteAError } = await supabase
    .from('lotes')
    .insert({
      tenant_id: TENANT_A_ID,
      fazenda_id: fazendaA.id,
      nome: 'TEST-TENANT-A-Lot'
    })
    .select()
    .single();

  if (loteAError) {
    console.error('❌ Failed to create lote A:', loteAError.message);
    throw loteAError;
  }
  console.log(`  ✅ Created lote: ${loteA.id}`);

  // Create animals for Tenant A
  const { error: animalsAError } = await supabase
    .from('animais')
    .insert([
      {
        tenant_id: TENANT_A_ID,
        fazenda_id: fazendaA.id,
        lote_id: loteA.id,
        brinco: 'TEST-TENANT-A-001',
        raca: 'Nelore',
        sexo: 'Macho',
        status: 'Ativo',
        peso_atual: 350.5,
        data_nascimento: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        tenant_id: TENANT_A_ID,
        fazenda_id: fazendaA.id,
        lote_id: loteA.id,
        brinco: 'TEST-TENANT-A-002',
        raca: 'Angus',
        sexo: 'Fêmea',
        status: 'Ativo',
        peso_atual: 320.0,
        data_nascimento: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]);

  if (animalsAError) {
    console.error('❌ Failed to create animals A:', animalsAError.message);
    throw animalsAError;
  }
  console.log('  ✅ Created 2 animals\n');

  // Create fazenda for Tenant B
  console.log('📝 Creating test data for Tenant B...');
  const { data: fazendaB, error: fazendaBError } = await supabase
    .from('fazendas')
    .insert({
      tenant_id: TENANT_B_ID,
      nome: 'TEST-TENANT-B-Farm',
      cidade: 'Rio de Janeiro',
      estado: 'RJ'
    })
    .select()
    .single();

  if (fazendaBError) {
    console.error('❌ Failed to create fazenda B:', fazendaBError.message);
    throw fazendaBError;
  }
  console.log(`  ✅ Created fazenda: ${fazendaB.id}`);

  // Create lote for Tenant B
  const { data: loteB, error: loteBError } = await supabase
    .from('lotes')
    .insert({
      tenant_id: TENANT_B_ID,
      fazenda_id: fazendaB.id,
      nome: 'TEST-TENANT-B-Lot'
    })
    .select()
    .single();

  if (loteBError) {
    console.error('❌ Failed to create lote B:', loteBError.message);
    throw loteBError;
  }
  console.log(`  ✅ Created lote: ${loteB.id}`);

  // Create animals for Tenant B
  const { error: animalsBError } = await supabase
    .from('animais')
    .insert([
      {
        tenant_id: TENANT_B_ID,
        fazenda_id: fazendaB.id,
        lote_id: loteB.id,
        brinco: 'TEST-TENANT-B-001',
        raca: 'Brahman',
        sexo: 'Macho',
        status: 'Ativo',
        peso_atual: 400.0,
        data_nascimento: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        tenant_id: TENANT_B_ID,
        fazenda_id: fazendaB.id,
        lote_id: loteB.id,
        brinco: 'TEST-TENANT-B-002',
        raca: 'Nelore',
        sexo: 'Fêmea',
        status: 'Ativo',
        peso_atual: 280.5,
        data_nascimento: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        tenant_id: TENANT_B_ID,
        fazenda_id: fazendaB.id,
        lote_id: loteB.id,
        brinco: 'TEST-TENANT-B-003',
        raca: 'Angus',
        sexo: 'Macho',
        status: 'Ativo',
        peso_atual: 380.0,
        data_nascimento: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]);

  if (animalsBError) {
    console.error('❌ Failed to create animals B:', animalsBError.message);
    throw animalsBError;
  }
  console.log('  ✅ Created 3 animals\n');

  // Query all test animals (service role can see all)
  console.log('🔍 Querying all test animals (using service role - bypasses RLS)...');
  const { data: allAnimals, error: queryError } = await supabase
    .from('animais')
    .select('brinco, tenant_id, raca')
    .like('brinco', 'TEST-TENANT-%')
    .order('brinco');

  if (queryError) {
    console.error('❌ Query failed:', queryError.message);
    throw queryError;
  }

  console.log(`  Found ${allAnimals.length} animals total:\n`);
  allAnimals.forEach(animal => {
    const tenantLabel = animal.tenant_id === TENANT_A_ID ? 'A' : 'B';
    console.log(`    ${animal.brinco} (Tenant ${tenantLabel}) - ${animal.raca}`);
  });

  console.log('\n⚠️  NOTE: This test uses SERVICE ROLE KEY which bypasses RLS.');
  console.log('    This shows all animals from both tenants.');
  console.log('');
  console.log('    In production, with user JWT tokens:');
  console.log('      - Tenant A users would only see TEST-TENANT-A-* animals (2 animals)');
  console.log('      - Tenant B users would only see TEST-TENANT-B-* animals (3 animals)');
  console.log('');
  console.log('    To properly test RLS isolation, you need to:');
  console.log('      1. Create actual user accounts for each tenant');
  console.log('      2. Authenticate as those users');
  console.log('      3. Query the data with their JWT tokens');
  console.log('');
  console.log('    OR run the SQL test script in Supabase SQL Editor');
  console.log('    which can manipulate JWT claims directly.\n');

  // Cleanup
  console.log('🧹 Cleaning up test data...');
  await supabase.from('animais').delete().like('brinco', 'TEST-TENANT-%');
  await supabase.from('lotes').delete().like('nome', 'TEST-TENANT-%');
  await supabase.from('fazendas').delete().like('nome', 'TEST-TENANT-%');
  console.log('✅ Cleanup complete\n');

  console.log('========================================');
  console.log('✅ SIMPLIFIED TEST COMPLETED');
  console.log('========================================');
  console.log('');
  console.log('Test data was successfully created and cleaned up.');
  console.log('');
  console.log('For complete RLS isolation testing, please run the');
  console.log('SQL script in Supabase SQL Editor as described above.');
  console.log('');

} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error('');
  console.error('Attempting cleanup...');
  
  try {
    await supabase.from('animais').delete().like('brinco', 'TEST-TENANT-%');
    await supabase.from('lotes').delete().like('nome', 'TEST-TENANT-%');
    await supabase.from('fazendas').delete().like('nome', 'TEST-TENANT-%');
    console.log('✅ Cleanup successful');
  } catch (cleanupError) {
    console.error('❌ Cleanup failed:', cleanupError.message);
  }
  
  process.exit(1);
}
