/**
 * Script de healthcheck para validar conexão com Supabase
 * Útil para CI/CD e troubleshooting
 * 
 * Uso: node scripts/healthcheck.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carregar .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function healthcheck() {
  console.log('🏥 Iniciando healthcheck...\n');

  // Validar variáveis de ambiente
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Variáveis de ambiente não encontradas');
    console.error('   Certifique-se de ter criado o arquivo .env');
    console.error('   cp .env.example .env\n');
    process.exit(1);
  }

  console.log('✅ Variáveis de ambiente: OK');
  console.log(`   URL: ${SUPABASE_URL}\n`);

  // Criar cliente Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // Testar conexão básica
    console.log('🔌 Testando conexão com Supabase...');
    const { data, error } = await supabase
      .from('tenants')
      .select('count')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Conexão com banco de dados: OK\n');

    // Testar auth
    console.log('🔐 Testando serviço de autenticação...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError && authError.message !== 'Auth session missing!') {
      throw authError;
    }

    console.log('✅ Serviço de autenticação: OK\n');

    // Sumário
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Todos os serviços estão funcionando!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Healthcheck falhou!\n');
    console.error('Erro:', error.message);
    console.error('\nPossíveis causas:');
    console.error('  • Credenciais inválidas no .env');
    console.error('  • Projeto Supabase pausado ou deletado');
    console.error('  • Problemas de rede/firewall');
    console.error('  • Tabela "tenants" não existe\n');
    
    process.exit(1);
  }
}

// Executar
healthcheck();
