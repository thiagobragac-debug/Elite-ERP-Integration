# 🚀 Quick Wins - Melhorias Rápidas (< 1 hora cada)

Estas são melhorias de alto impacto que podem ser implementadas rapidamente.

---

## 1. Remover `.env` do Git 🔴 URGENTE (15min)

```bash
# 1. Backup das variáveis
cp .env .env.backup

# 2. Garantir que está no .gitignore
echo "" >> .gitignore
echo "# Environment variables" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# 3. Remover do tracking
git rm --cached .env
git commit -m "security: remove .env from version control"
git push

# 4. IMPORTANTE: Rotacionar TODAS as chaves no Supabase e Stripe
```

**⚠️ Depois disso, rotacionar:**
- Chave Stripe (Dashboard → Developers → API keys)
- Chave Supabase (Dashboard → Settings → API)

---

## 2. Atualizar Dependências (10min)

```bash
# Atualizar tudo
npm update

# Verificar vulnerabilidades
npm audit fix

# Commit
git add package.json package-lock.json
git commit -m "chore: update dependencies to latest versions"
```

---

## 3. Adicionar Validação de ENV no Startup (5min)

Criar `src/lib/validateEnv.ts`:

```typescript
const requiredEnvs = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

export function validateEnv() {
  const missing = requiredEnvs.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\nCopy .env.example to .env and fill in the values.`
    );
  }
}
```

Usar em `src/main.tsx`:

```typescript
import { validateEnv } from './lib/validateEnv';

validateEnv(); // Adicionar antes de createRoot

createRoot(document.getElementById('root')!).render(
  // ...
);
```

---

## 4. Padronizar Loading Fallback (10min)

Criar `src/components/Feedback/LoadingSkeleton.tsx`:

```tsx
export function LoadingSkeleton() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'hsl(var(--bg-main))',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid hsl(var(--border))',
        borderTopColor: 'hsl(var(--brand))',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'hsl(var(--text-muted))',
        letterSpacing: '0.05em',
        textTransform: 'uppercase'
      }}>
        Carregando módulo...
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
```

Usar em `App.tsx`:

```tsx
import { LoadingSkeleton } from './components/Feedback/LoadingSkeleton';

// Substituir todos os fallbacks inline
<Suspense fallback={<LoadingSkeleton />}>
  <Routes>
    {/* ... */}
  </Routes>
</Suspense>
```

---

## 5. Remover Console.logs de Produção (5min)

Adicionar em `vite.config.ts`:

```typescript
export default defineConfig({
  esbuild: {
    drop: ['console', 'debugger'],
    pure: ['console.log'],
  },
  // ... resto da config
});
```

**Ou** configurar ESLint:

```javascript
// eslint.config.js
export default [
  {
    rules: {
      'no-console': ['warn', { allow: ['error', 'warn', 'info'] }],
    }
  }
];
```

---

## 6. Adicionar Meta Tags para SEO/PWA (5min)

Atualizar `index.html`:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- SEO -->
    <meta name="description" content="Sistema de Gestão Agropecuária - ERP completo para fazendas" />
    <meta name="keywords" content="ERP agropecuário, gestão de gado, pecuária, fazenda" />
    
    <!-- PWA -->
    <meta name="theme-color" content="#27a376" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="apple-touch-icon" href="/favicon.png" />
    
    <!-- OG Tags -->
    <meta property="og:title" content="Tauze ERP - Gestão Agropecuária" />
    <meta property="og:description" content="Sistema completo para gestão de fazendas" />
    <meta property="og:type" content="website" />
    
    <title>Tauze ERP v5.0 | Gestão Inteligente</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 7. Otimizar React Query Defaults (5min)

Atualizar `src/contexts/QueryProvider.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5min (reduz refetches desnecessários)
      cacheTime: 1000 * 60 * 30, // 30min
      refetchOnWindowFocus: false, // Evita refetch excessivo em produção
      retry: 1, // Só tenta 1x em vez de 3x
      retryDelay: 1000,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

---

## 8. Adicionar Comando de Análise de Bundle (2min)

Atualizar `package.json`:

```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "build:analyze": "tsc -b && vite build --mode analyze",
    "preview": "vite preview"
  }
}
```

Atualizar `vite.config.ts`:

```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ /* ... */ }),
    process.env.ANALYZE && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
});
```

Instalar plugin:
```bash
npm install -D rollup-plugin-visualizer
```

Usar:
```bash
ANALYZE=true npm run build:analyze
```

---

## 9. Criar .editorconfig Completo (3min)

Já existe, mas pode melhorar:

```ini
# .editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[*.{json,yml,yaml}]
indent_size = 2

[*.{ts,tsx,js,jsx}]
indent_size = 2
quote_type = single
```

---

## 10. Adicionar Healthcheck Script (5min)

Criar `scripts/healthcheck.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function healthcheck() {
  try {
    const { data, error } = await supabase.from('tenants').select('count').limit(1);
    
    if (error) throw error;
    
    console.log('✅ Database connection: OK');
    console.log('✅ Supabase API: OK');
    process.exit(0);
  } catch (error) {
    console.error('❌ Healthcheck failed:', error.message);
    process.exit(1);
  }
}

healthcheck();
```

Adicionar em `package.json`:

```json
{
  "scripts": {
    "healthcheck": "node scripts/healthcheck.js"
  }
}
```

---

## 11. Adicionar Pre-commit Hook (10min)

```bash
npm install -D husky lint-staged

# Inicializar husky
npx husky init

# Criar hook de pre-commit
echo 'npx lint-staged' > .husky/pre-commit
```

Adicionar em `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

---

## 12. Configurar Prettier (5min)

Criar `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

Criar `.prettierignore`:

```
dist
coverage
node_modules
*.min.js
*.map
package-lock.json
```

Adicionar script:

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""
  }
}
```

---

## 13. Adicionar Scripts de Desenvolvimento (5min)

Atualizar `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:host": "vite --host", // Testar em dispositivos móveis
    "dev:https": "vite --https", // Testar PWA localmente
    "build": "tsc -b && vite build",
    "build:staging": "tsc -b && vite build --mode staging",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "clean": "rimraf dist coverage node_modules/.vite",
    "prepare": "husky"
  }
}
```

---

## 14. Criar Script de Análise de Código (10min)

Criar `scripts/analyze.sh`:

```bash
#!/bin/bash

echo "📊 Análise de Código - Tauze ERP"
echo "================================="
echo ""

echo "📦 Tamanho do projeto:"
find ./src -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1

echo ""
echo "🧪 Cobertura de testes:"
npm run test:coverage --silent | grep "All files"

echo ""
echo "🔍 Componentes sem testes:"
COMPONENTS=$(find ./src/pages -name "*.tsx" | wc -l)
TESTS=$(find ./src/pages -name "*.test.tsx" | wc -l)
echo "Total: $COMPONENTS componentes, $TESTS testes"
echo "Faltam: $((COMPONENTS - TESTS)) testes"

echo ""
echo "📦 Tamanho do bundle:"
npm run build --silent && du -sh dist

echo ""
echo "⚠️ TODOs pendentes:"
grep -r "TODO\|FIXME\|XXX" src/ --include="*.ts" --include="*.tsx" | wc -l
```

Dar permissão:
```bash
chmod +x scripts/analyze.sh
```

Usar:
```bash
./scripts/analyze.sh
```

---

## 15. Adicionar README para Novos Desenvolvedores (10min)

Atualizar `README.md`:

```markdown
# 🌾 Tauze ERP v5.0 - Sistema de Gestão Agropecuária

ERP multi-tenant completo para gestão de fazendas (pecuária, financeiro, estoque, compras, vendas).

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- npm 9+
- Conta Supabase

### Instalação (< 5 minutos)

1. Clone o repositório:
```bash
git clone <repo-url>
cd Saas
```

2. Instale dependências:
```bash
npm install
```

3. Configure variáveis de ambiente:
```bash
cp .env.example .env
# Edite .env e preencha as chaves do Supabase
```

4. Inicie o servidor:
```bash
npm run dev
```

Acesse: http://localhost:5173

## 📚 Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── contexts/       # React Context (Auth, Tenant, Theme)
├── hooks/          # Custom hooks
├── pages/          # Páginas/rotas do app
│   ├── Admin/      # Gestão de usuários, config
│   ├── Finance/    # Contas a pagar/receber, fluxo de caixa
│   ├── Fleet/      # Frota e manutenções
│   ├── Inventory/  # Estoque e movimentações
│   ├── Pecuaria/   # Animais, lotes, sanidade
│   ├── Purchasing/ # Compras e fornecedores
│   └── Sales/      # Vendas e clientes
├── types/          # TypeScript types
└── utils/          # Funções auxiliares
```

## 🛠️ Scripts Disponíveis

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build para produção
npm run preview          # Preview do build
npm run test             # Executar testes
npm run test:coverage    # Cobertura de testes
npm run lint             # Validar código
npm run lint:fix         # Corrigir erros de lint
npm run type-check       # Validar TypeScript
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Modo watch
npm run test:watch

# Com cobertura
npm run test:coverage

# UI interativa
npm run test:ui
```

## 📖 Documentação

- [Diretrizes UI/UX](./docs/UI_UX_GUIDELINES.md)
- [Sugestões de Melhorias](./docs/SUGESTOES_MELHORIAS.md)
- [Quick Wins](./docs/QUICK_WINS.md)

## 🏗️ Stack Tecnológica

- **Frontend:** React 19, TypeScript, Vite
- **Roteamento:** React Router v7
- **Estado:** React Query, Context API
- **Backend:** Supabase (PostgreSQL + RLS)
- **UI:** CSS Modules, Lucide Icons, Recharts
- **Testes:** Vitest, Testing Library
- **PWA:** Vite PWA Plugin, Workbox

## 🔐 Segurança

- Multi-tenancy com Row Level Security (RLS)
- Autenticação MFA (2FA)
- Roles e permissões granulares
- Audit log completo

## 🌐 Módulos

- ✅ **Pecuária:** Gestão de rebanho, sanidade, reprodução
- ✅ **Financeiro:** Contas, fluxo de caixa, conciliação
- ✅ **Estoque:** Inventário, movimentações, auditorias
- ✅ **Frota:** Máquinas, manutenções, abastecimentos
- ✅ **Compras:** Pedidos, cotações, fornecedores
- ✅ **Vendas:** Clientes, contratos, notas fiscais
- ✅ **Mercado:** Indicadores Cepea, análise de preços

## 🤝 Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
2. Commit suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
3. Push para a branch: `git push origin feature/nova-funcionalidade`
4. Abra um Pull Request

## 📄 Licença

Proprietário - Tauze Intelligence © 2026
```

---

## ✅ Checklist de Implementação

Execute na ordem:

- [ ] 1. Remover `.env` do Git (URGENTE)
- [ ] 2. Atualizar dependências
- [ ] 3. Validação de ENV no startup
- [ ] 4. Loading skeleton padronizado
- [ ] 5. Remover console.logs
- [ ] 6. Meta tags PWA
- [ ] 7. React Query defaults
- [ ] 8. Bundle analyzer
- [ ] 9. .editorconfig
- [ ] 10. Healthcheck script
- [ ] 11. Pre-commit hooks
- [ ] 12. Prettier
- [ ] 13. Scripts de dev
- [ ] 14. Script de análise
- [ ] 15. README atualizado

**Tempo total:** ~1.5 horas  
**Impacto:** Alto (segurança, DX, performance)

---

Após implementar esses quick wins, prosseguir com as melhorias do documento principal `SUGESTOES_MELHORIAS.md`.
