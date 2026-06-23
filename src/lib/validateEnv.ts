/**
 * Validação de variáveis de ambiente obrigatórias
 * Garante que o app não inicie sem configurações críticas
 */

interface RequiredEnvVars {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_STRIPE_PUBLISHABLE_KEY?: string; // Optional
}

export function validateEnv(): void {
  const required: (keyof RequiredEnvVars)[] = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
        `Please check .env.example for reference.`
    );
  }

  // URL validation
  try {
    new URL(import.meta.env.VITE_SUPABASE_URL);
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid URL');
  }
}
