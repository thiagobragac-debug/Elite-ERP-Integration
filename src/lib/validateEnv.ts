/**
 * Validação de variáveis de ambiente obrigatórias
 * Garante que o app não inicie sem configurações críticas
 */

const requiredEnvs = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

const optionalEnvs = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_STRIPE_SECRET_KEY',
  'VITE_STRIPE_WEBHOOK_SECRET',
  'VITE_BILLING_CURRENCY',
  'VITE_BILLING_LOCALE',
] as const;

export function validateEnv(): void {
  const missing = requiredEnvs.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    const errorMessage = [
      '❌ Variáveis de ambiente obrigatórias não encontradas:',
      '',
      ...missing.map(key => `  • ${key}`),
      '',
      '📝 Solução:',
      '  1. Copie o arquivo: cp .env.example .env',
      '  2. Preencha as variáveis obrigatórias',
      '  3. Reinicie o servidor de desenvolvimento',
      '',
      '🔗 Documentação: README.md',
    ].join('\n');
    
    console.error(errorMessage);
    throw new Error('Missing required environment variables');
  }

  // Avisos para variáveis opcionais (não bloqueia)
  const missingOptional = optionalEnvs.filter(key => !import.meta.env[key]);
  if (missingOptional.length > 0 && import.meta.env.DEV) {
    console.warn(
      '⚠️ Variáveis opcionais não configuradas (funcionalidades limitadas):',
      missingOptional.map(key => `\n  • ${key}`)
    );
  }

  // Log de sucesso em desenvolvimento
  if (import.meta.env.DEV) {
    console.log('✅ Variáveis de ambiente validadas com sucesso');
  }
}
