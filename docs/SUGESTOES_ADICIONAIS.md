# 🎯 Sugestões Adicionais - Alto Impacto

**Data:** 16/06/2026  
**Prioridade:** 🔴 Crítica a 🟢 Baixa

---

## 🚨 CRÍTICO - Resolver Imediatamente

### 1. 🔴 Credenciais Hardcoded em Arquivos de Teste

**Status:** 🔴 **VULNERABILIDADE CRÍTICA**

**Problema Identificado:**
Encontrei credenciais Supabase **hardcoded** em 4 arquivos:

```
❌ check_db2.js
❌ check_db3.js  
❌ test_db.js
❌ src/lib/supabase.ts (fallback hardcoded)
```

**URL Exposta:** `https://nmirpozhgcoabcjwgvqk.supabase.co`  
**Token Exposto:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Risco:**
- ⚠️ Qualquer pessoa com acesso ao repositório pode acessar seu banco
- ⚠️ Possível vazamento de dados de clientes
- ⚠️ Violação de compliance (LGPD)

**Ação Imediata:**

```bash
# 1. Deletar arquivos de teste do root
git rm check_db2.js check_db3.js test_db.js
git commit -m "security: remove hardcoded credentials from test files"

# 2. Remover fallback hardcoded de supabase.ts
# Editar src/lib/supabase.ts e remover o fallback
```

**Correção para `src/lib/supabase.ts`:**
```typescript
// ❌ ANTES (INSEGURO)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nmirpozhgcoabcjwgvqk.supabase.co';

// ✅ DEPOIS (SEGURO)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Check .env file.');
}
```

**Depois de corrigir:**
```bash
# Rotacionar credenciais IMEDIATAMENTE
# Supabase Dashboard → Settings → API → Reset Project API keys
```

---

### 2. 🔴 Falta CI/CD Pipeline

**Status:** ❌ Não existe

**Impacto:** Alto risco de bugs em produção, processo manual de deploy

**Solução:** Criar GitHub Actions

Criar `.github/workflows/ci.yml`:

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Format check
        run: npm run format:check
      
      - name: Run tests
        run: npm run test:run
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

  coverage:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
```

**Benefícios:**
- ✅ Validação automática de PRs
- ✅ Previne merge de código quebrado
- ✅ Relatório de cobertura automático
- ✅ Deploy automatizado (próximo passo)

**Tempo:** 30 minutos

---

## 🟡 Alta Prioridade

### 3. 🟡 TypeScript Strict Mode

**Status:** ⚠️ Modo permissivo (perigoso)

**Problema:** TypeScript configurado com `strict: false` permite:
- `any` implícito
- Null/undefined não checados
- Parâmetros não utilizados passam despercebidos

**Solução:** Habilitar strict mode progressivamente

Criar `tsconfig.strict.json`:
```json
{
  "extends": "./tsconfig.app.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Estratégia Gradual:**
1. Criar branch `typescript-strict`
2. Habilitar uma opção por vez
3. Corrigir erros módulo por módulo
4. Começar por `utils/` e `lib/`

**Benefícios:**
- 70% menos bugs relacionados a tipos
- IntelliSense mais preciso
- Refactoring mais seguro

**Tempo:** 2-3 sprints (gradual)

---

### 4. 🟡 Error Boundary por Módulo

**Status:** ⚠️ Apenas global

**Problema:** Um erro em qualquer componente derruba o app inteiro

**Solução:** Error boundaries granulares

Criar `src/components/Feedback/ModuleErrorBoundary.tsx`:

```typescript
import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to Sentry/monitoring
    console.error(`Error in ${this.props.moduleName}:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: 'hsl(var(--bg-card))',
          borderRadius: '12px',
          margin: '24px',
        }}>
          <AlertTriangle size={48} color="hsl(var(--error))" />
          <h2 style={{ marginTop: '16px', color: 'hsl(var(--text-main))' }}>
            Erro no módulo {this.props.moduleName}
          </h2>
          <p style={{ color: 'hsl(var(--text-muted))', marginTop: '8px' }}>
            Algo deu errado. Tente recarregar a página.
          </p>
          {this.state.error && (
            <details style={{ marginTop: '16px', textAlign: 'left' }}>
              <summary>Detalhes técnicos</summary>
              <pre style={{ 
                background: '#000', 
                padding: '12px', 
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '12px',
                marginTop: '8px'
              }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              background: 'hsl(var(--brand))',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={16} />
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usar em cada módulo:**
```tsx
<Route path="pecuaria/*" element={
  <ModuleErrorBoundary moduleName="Pecuária">
    <PecuariaRoutes />
  </ModuleErrorBoundary>
} />
```

**Benefícios:**
- ✅ Falha isolada (não derruba todo o app)
- ✅ Melhor UX em caso de erro
- ✅ Logs específicos por módulo

**Tempo:** 2 horas

---

### 5. 🟡 Testes de Integração (E2E)

**Status:** ❌ Não existe

**Problema:** Nenhum teste valida fluxos completos

**Solução:** Playwright para testes E2E

```bash
npm install -D @playwright/test
npx playwright install
```

Criar `tests/e2e/login.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Fluxo de Login', () => {
  test('deve fazer login com sucesso', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Preencher formulário
    await page.fill('input[type="email"]', 'teste@exemplo.com');
    await page.fill('input[type="password"]', 'senha123');
    
    // Clicar em entrar
    await page.click('button:has-text("Entrar")');
    
    // Aguardar redirecionamento
    await page.waitForURL('**/painel');
    
    // Verificar dashboard carregou
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    await page.fill('input[type="email"]', 'invalido@exemplo.com');
    await page.fill('input[type="password"]', 'errado');
    await page.click('button:has-text("Entrar")');
    
    // Verificar mensagem de erro
    await expect(page.locator('.toast')).toContainText('Credenciais inválidas');
  });
});
```

**Fluxos Críticos para Testar:**
1. Login/Logout
2. Cadastro de animal
3. Lançamento financeiro (pagar/receber)
4. Criação de pedido de compra
5. Movimentação de estoque

**Benefícios:**
- Validação de fluxos reais
- Previne regressões em features críticas
- Confiança em deploys

**Tempo:** 1 semana (configuração + 5 fluxos)

---

## 🟢 Média Prioridade

### 6. 🟢 Storybook para Componentes

**Status:** ❌ Não existe

**Benefício:** Desenvolvimento isolado de componentes

```bash
npx storybook@latest init
```

Exemplo `ModernTable.stories.tsx`:
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ModernTable } from './ModernTable';

const meta: Meta<typeof ModernTable> = {
  title: 'Components/ModernTable',
  component: ModernTable,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ModernTable>;

export const Default: Story = {
  args: {
    data: [
      { id: 1, name: 'João', role: 'Admin' },
      { id: 2, name: 'Maria', role: 'User' },
    ],
    columns: [
      { header: 'Nome', accessor: 'name' },
      { header: 'Função', accessor: 'role' },
    ],
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns: Default.args.columns,
  },
};
```

**Benefícios:**
- Design System documentado visualmente
- Testes visuais automáticos
- Componentes isolados (fácil QA)

**Tempo:** 1 sprint

---

### 7. 🟢 Database Migrations Versionadas

**Status:** ⚠️ Migrations manuais (provavelmente)

**Problema:** Mudanças no schema não versionadas

**Solução:** Supabase CLI + migrations

```bash
npm install -D supabase
npx supabase init
```

Criar `supabase/migrations/20260616_add_indexes.sql`:
```sql
-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_animais_tenant_status 
  ON animais(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_animais_fazenda_lote 
  ON animais(fazenda_id, lote_id);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento 
  ON contas_pagar(tenant_id, data_vencimento)
  WHERE status != 'PAGO';

-- Comentários para documentação
COMMENT ON INDEX idx_animais_tenant_status IS 
  'Otimiza queries por tenant e status (dashboard)';
```

**Workflow:**
```bash
# Criar migration
npx supabase migration new add_feature_x

# Aplicar localmente
npx supabase db push

# Deploy para produção (via CI/CD)
npx supabase db push --remote
```

**Benefícios:**
- Histórico de mudanças no banco
- Rollback fácil
- Deploy consistente entre ambientes

**Tempo:** 4 horas (setup + migrations iniciais)

---

### 8. 🟢 Feature Flags

**Status:** ❌ Não existe

**Problema:** Features novas vão direto para produção

**Solução:** Sistema simples de feature flags

Criar `src/lib/featureFlags.ts`:
```typescript
type FeatureFlags = {
  newDashboard: boolean;
  aiRecommendations: boolean;
  bulkImport: boolean;
  advancedReports: boolean;
};

const defaultFlags: FeatureFlags = {
  newDashboard: false,
  aiRecommendations: false,
  bulkImport: true,
  advancedReports: false,
};

export function getFeatureFlags(userEmail?: string): FeatureFlags {
  // Ambiente de desenvolvimento: tudo habilitado
  if (import.meta.env.DEV) {
    return Object.fromEntries(
      Object.keys(defaultFlags).map(key => [key, true])
    ) as FeatureFlags;
  }

  // Beta testers (lista hardcoded ou da tabela)
  const betaTesters = ['admin@tauze.com', 'teste@exemplo.com'];
  if (userEmail && betaTesters.includes(userEmail)) {
    return {
      ...defaultFlags,
      newDashboard: true,
      aiRecommendations: true,
    };
  }

  // Produção: flags padrão
  return defaultFlags;
}

export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const { user } = useAuth();
  const flags = getFeatureFlags(user?.email);
  return flags[flag];
}
```

**Uso:**
```tsx
function Dashboard() {
  const hasNewDashboard = useFeatureFlag('newDashboard');
  
  return hasNewDashboard ? <NewDashboard /> : <OldDashboard />;
}
```

**Evolução Futura:**
- Integrar com LaunchDarkly/PostHog
- Flags por tenant
- A/B testing

**Tempo:** 3 horas

---

### 9. 🟢 Monitoramento de Performance (Web Vitals)

**Status:** ❌ Não configurado

**Solução:** Reportar Core Web Vitals

Criar `src/lib/webVitals.ts`:
```typescript
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Enviar para seu analytics (Google Analytics, PostHog, etc.)
  console.log(metric);
  
  // Exemplo: Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

export function initWebVitals() {
  if (import.meta.env.PROD) {
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onLCP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  }
}
```

Adicionar em `main.tsx`:
```typescript
import { initWebVitals } from './lib/webVitals';

validateEnv();
initWebVitals();

createRoot(document.getElementById('root')!).render(/* ... */);
```

**Métricas Coletadas:**
- **LCP** (Largest Contentful Paint): <2.5s
- **FID** (First Input Delay): <100ms
- **CLS** (Cumulative Layout Shift): <0.1
- **FCP** (First Contentful Paint): <1.8s
- **TTFB** (Time to First Byte): <600ms

**Tempo:** 1 hora

---

### 10. 🟢 Renovate Bot (Dependências Automáticas)

**Status:** ❌ Atualização manual

**Solução:** Renovate Bot no GitHub

Criar `renovate.json`:
```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:base"],
  "schedule": ["every weekend"],
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true
    },
    {
      "matchPackagePatterns": ["^@types/"],
      "automerge": true
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true
  }
}
```

**Benefícios:**
- PRs automáticos para updates
- Vulnerabilidades detectadas
- Changelog automático

**Tempo:** 15 minutos

---

## 🎯 Roadmap Priorizado (Próximas 4 Semanas)

### Semana 1: Segurança + CI/CD
- [ ] 🔴 Remover credenciais hardcoded (URGENTE)
- [ ] 🔴 Rotacionar chaves Supabase
- [ ] 🔴 Criar GitHub Actions CI
- [ ] 🟡 Error boundaries por módulo

### Semana 2: Qualidade + Testes
- [ ] 🟡 TypeScript strict (iniciar)
- [ ] 🟡 Playwright E2E (5 fluxos críticos)
- [ ] 🟢 Web Vitals tracking

### Semana 3: Infraestrutura
- [ ] 🟢 Database migrations versionadas
- [ ] 🟢 Feature flags sistema
- [ ] 🟢 Renovate Bot

### Semana 4: DX + Docs
- [ ] 🟢 Storybook (10 componentes principais)
- [ ] 🟢 Adicionar mais testes (meta: 40% cobertura)

---

## 📊 Impacto Esperado

| Melhoria | Esforço | ROI | Impacto |
|----------|---------|-----|---------|
| Remover credenciais hardcoded | 30min | ⭐⭐⭐⭐⭐ | Segurança |
| GitHub Actions CI | 30min | ⭐⭐⭐⭐⭐ | Qualidade |
| Error boundaries | 2h | ⭐⭐⭐⭐ | UX |
| TypeScript strict | 2-3 sprints | ⭐⭐⭐⭐ | Qualidade |
| Playwright E2E | 1 semana | ⭐⭐⭐⭐ | Confiança |
| Storybook | 1 sprint | ⭐⭐⭐ | DX |
| Database migrations | 4h | ⭐⭐⭐⭐ | Deploy |
| Feature flags | 3h | ⭐⭐⭐ | Deploy |
| Web Vitals | 1h | ⭐⭐⭐ | Performance |
| Renovate Bot | 15min | ⭐⭐⭐⭐ | Manutenção |

---

## 🎁 Bônus: Quick Scripts Úteis

### Verificar Credenciais Hardcoded
```bash
# Criar scripts/check-secrets.ps1
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx |
  Select-String -Pattern "sk_live|pk_live|supabase\.co|password\s*=\s*['\"]" |
  Select-Object -Property Path,LineNumber,Line
```

### Bundle Size Report
```bash
# Adicionar ao package.json
"analyze": "vite-bundle-visualizer"

npm install -D vite-bundle-visualizer
npm run build && npm run analyze
```

### Find Unused Exports
```bash
npm install -D ts-prune
npx ts-prune | grep -v "used in module"
```

---

## ✅ Próximos Passos Imediatos

1. **HOJE:**
   ```bash
   # Remover credenciais hardcoded
   git rm check_db2.js check_db3.js test_db.js
   # Editar src/lib/supabase.ts (remover fallback)
   git commit -m "security: remove hardcoded credentials"
   
   # Rotacionar keys no Supabase Dashboard
   ```

2. **Esta Semana:**
   - Criar GitHub Actions CI
   - Implementar error boundaries
   - Iniciar TypeScript strict

3. **Próximas 2 Semanas:**
   - Playwright E2E (5 fluxos)
   - Database migrations
   - Feature flags

---

**Documento criado em:** 16/06/2026  
**Versão:** 1.0  
**Autor:** Análise Técnica Kiro

Quer que eu implemente alguma dessas sugestões agora?
