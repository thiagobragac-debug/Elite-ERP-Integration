# Design Document - System Improvements

## Overview

Este documento detalha o design técnico para as melhorias sistêmicas do Tauze ERP v5.0. O design abrange 10 áreas principais de melhoria que transformarão o sistema em uma plataforma enterprise-grade, segura, testável e performática.

**Escopo do Design:**
- **Segurança:** Validação de environment variables, rotação de chaves, auditoria RLS
- **Qualidade:** Testes (12.5% → 60%), TypeScript strict mode, linting/formatting
- **Performance:** Bundle optimization (<500KB gzipped), code splitting, lazy loading
- **Arquitetura:** Refatoração de componentes grandes, extração de hooks customizados
- **Offline-First:** PWA com sync queue, IndexedDB, Background Sync API
- **Observabilidade:** Sentry (errors), Analytics (business events), Web Vitals
- **Database:** Índices compostos, eliminação de N+1 queries
- **Developer Experience:** LoadingSkeleton, Command Palette, documentação
- **CI/CD:** Pipeline automatizado (lint → test → build → deploy)

**Tecnologias Base:**
- Frontend: React 19, TypeScript 6.0, Vite 8
- Backend: Supabase (PostgreSQL 14 + Auth + Storage)
- State: React Query (TanStack), Context API
- Testing: Vitest 4.1, Playwright 1.61, MSW 2.14
- Monitoring: Sentry, Web Vitals, Analytics (PostHog/Mixpanel)

**Princípios de Design:**
1. **Security by Default:** Validações em todas as camadas, princípio do menor privilégio
2. **Progressive Enhancement:** Sistema funcional sem JavaScript moderno
3. **Offline-First:** Toda operação crítica deve ter suporte offline
4. **Performance Budget:** <500KB gzipped, LCP <2.5s, FID <100ms, CLS <0.1
5. **Developer Experience:** Setup <10min, feedback rápido, documentação inline


## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       DEVELOPER WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Local Dev → Pre-commit → Push → CI/CD → Staging → Production      │
│              (Husky)           (GitHub Actions)                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CI/CD PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌───────┐  ┌────────┐              │
│  │ Lint │→│ Type │→│ Test │→│ Build │→│ Deploy │              │
│  │Check │  │Check │  │ 60%+ │  │ Opt   │  │ Verify │              │
│  └──────┘  └──────┘  └──────┘  └───────┘  └────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND APPLICATION                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │  Security Layer                                            │    │
│  │  • Environment Variable Validation (startup)               │    │
│  │  • Secrets Management Integration                          │    │
│  │  • Auth Guard (JWT validation)                             │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │  Offline Layer (Service Worker + IndexedDB)                │    │
│  │  • Network First → Cache Fallback                          │    │
│  │  • Offline Queue (create/update/delete)                    │    │
│  │  • Background Sync (photos, batch operations)              │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │  State Management Layer                                    │    │
│  │  • React Query (server state + cache)                      │    │
│  │  • Context API (auth, tenant, theme, offline)              │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │  Component Layer (Refactored)                              │    │
│  │  • Modular Components (<500 lines)                         │    │
│  │  • Custom Hooks (business logic extraction)                │    │
│  │  • LoadingSkeleton (UX improvement)                        │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │  Monitoring Layer                                          │    │
│  │  • Sentry (errors + performance)                           │    │
│  │  • Analytics (business events)                             │    │
│  │  • Web Vitals (LCP, FID, CLS)                              │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (Supabase API)
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Supabase)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL 14                                             │    │
│  │  • RLS Policies (tenant isolation)                         │    │
│  │  • Composite Indexes (performance)                         │    │
│  │  • Audit Logs (security)                                   │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │  Auth + Storage                                            │    │
│  │  • JWT Token Management                                    │    │
│  │  • MFA Support                                             │    │
│  │  • File Storage (photos, documents)                        │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```


### Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                  APPLICATION STARTUP FLOW                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  main.tsx        │
                    │  Entry Point     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ validateEnv()    │◄─── src/lib/validateEnv.ts
                    │ • Check required │
                    │ • Type validation│
                    │ • Throw on fail  │
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    │                  │
                 [PASS]            [FAIL]
                    │                  │
                    ▼                  ▼
          ┌──────────────┐    ┌──────────────────┐
          │ Init App     │    │ Show Error Screen│
          │ Render Root  │    │ "Missing ENV: X" │
          └──────────────┘    │ Halt Execution   │
                              └──────────────────┘
```

**Environment Variable Validation Strategy:**

```typescript
// src/lib/validateEnv.ts

interface RequiredEnvVars {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_STRIPE_PUBLISHABLE_KEY?: string; // Optional
}

export function validateEnv(): void {
  const required: (keyof RequiredEnvVars)[] = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !import.meta.env[key]);

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
```

**Secrets Management Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│                     SECRETS FLOW                             │
└──────────────────────────────────────────────────────────────┘

Development:
  .env (local) → gitignored → loaded by Vite

CI/CD:
  GitHub Secrets → Injected at build time → Environment variables

Production:
  Hosting Platform (Vercel/Netlify) → Environment Variables UI
  or
  HashiCorp Vault → API call → Inject at runtime
```


**Key Rotation Strategy:**

```
┌──────────────────────────────────────────────────────────────┐
│           KEY ROTATION PROCEDURE (Zero Downtime)             │
└──────────────────────────────────────────────────────────────┘

Phase 1: Generate New Keys
  • Supabase Dashboard → Settings → API → "Generate new anon key"
  • Stripe Dashboard → Developers → API keys → "Create key"
  • Document old key IDs for revocation

Phase 2: Dual-Key Support (Grace Period: 24-48h)
  • Update secrets manager with NEW keys
  • Deploy app with NEW keys
  • Keep OLD keys active in backend
  • Monitor for errors

Phase 3: Validate & Revoke
  • Verify all clients using NEW keys (check logs)
  • Revoke OLD keys
  • Remove from secrets manager
  • Update audit log
```

**RLS Audit Scripts:**

```sql
-- src/database/audit-rls.sql

-- 1. Find tables WITHOUT RLS enabled
SELECT 
  schemaname, 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE 'pg_%'
  AND NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE pg_policies.tablename = pg_tables.tablename
  )
ORDER BY tablename;

-- 2. Enable RLS on missing tables
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- 3. Create tenant isolation policy (SELECT)
CREATE POLICY "tenant_isolation_select"
ON public.your_table
FOR SELECT
USING (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);

-- 4. Create tenant isolation policy (INSERT/UPDATE/DELETE)
CREATE POLICY "tenant_isolation_modify"
ON public.your_table
FOR ALL
USING (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
)
WITH CHECK (
  tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid
);

-- 5. Test tenant isolation
DO $$
DECLARE
  test_tenant_a uuid := gen_random_uuid();
  test_tenant_b uuid := gen_random_uuid();
BEGIN
  -- Insert test data
  INSERT INTO animais (tenant_id, brinco) VALUES (test_tenant_a, 'TEST-A');
  INSERT INTO animais (tenant_id, brinco) VALUES (test_tenant_b, 'TEST-B');
  
  -- Set JWT claims to tenant A
  PERFORM set_config('request.jwt.claims', 
    json_build_object('tenant_id', test_tenant_a)::text, 
    true);
  
  -- Query should only return tenant A's data
  ASSERT (SELECT count(*) FROM animais WHERE brinco LIKE 'TEST-%') = 1,
    'RLS failed: tenant can see other tenant data';
  
  RAISE NOTICE 'RLS test passed';
END $$;
```


## Components and Interfaces

### Testing Architecture

**Directory Structure:**

```
src/
├── __tests__/
│   ├── unit/                     # Unit tests (60% of coverage)
│   │   ├── utils/
│   │   │   ├── format.test.ts    # formatCurrency, formatDate
│   │   │   ├── validation.test.ts # validateCPF, validateEmail
│   │   │   └── export.test.ts    # exportToExcel, exportToPDF
│   │   ├── hooks/
│   │   │   ├── useAuth.test.ts
│   │   │   ├── useFarmFilter.test.ts
│   │   │   └── useOfflineSync.test.ts
│   │   └── lib/
│   │       └── supabase.test.ts  # Mock Supabase client
│   │
│   ├── integration/               # Integration tests (30%)
│   │   ├── flows/
│   │   │   ├── purchase-flow.test.tsx
│   │   │   ├── payment-flow.test.tsx
│   │   │   └── animal-registration.test.tsx
│   │   └── components/
│   │       ├── ModernTable.test.tsx
│   │       ├── FormModal.test.tsx
│   │       └── SearchableSelect.test.tsx
│   │
│   └── e2e/                       # E2E tests (10%)
│       ├── critical-paths.spec.ts
│       └── smoke.spec.ts
│
├── __mocks__/
│   ├── supabase.ts               # MSW handlers for Supabase
│   ├── stripe.ts                 # Mock Stripe SDK
│   └── browser.ts                # MSW setup
│
└── test-utils/
    ├── render.tsx                # Custom render with providers
    ├── factories.ts              # Test data factories
    └── msw-handlers.ts           # Shared MSW handlers
```

**Vitest Configuration:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/__tests__/**',
        'src/__mocks__/**',
        'src/types/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```


**Test Setup & Utilities:**

```typescript
// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { server } from '../__mocks__/browser';

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests are done
afterAll(() => server.close());

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
```

```typescript
// src/test-utils/render.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

interface WrapperProps {
  children: React.ReactNode;
}

export function AllTheProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            {children}
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}
```

```typescript
// src/test-utils/factories.ts
import { faker } from '@faker-js/faker';

export const animalFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    tenant_id: faker.string.uuid(),
    brinco: faker.string.numeric(6),
    raca: faker.helpers.arrayElement(['Nelore', 'Angus', 'Brahman']),
    sexo: faker.helpers.arrayElement(['Macho', 'Fêmea']),
    peso_atual: faker.number.int({ min: 200, max: 600 }),
    data_nascimento: faker.date.past({ years: 3 }),
    status: 'Ativo',
    ...overrides,
  }),
  
  buildList: (count: number, overrides = {}) => 
    Array.from({ length: count }, () => animalFactory.build(overrides)),
};

export const contaPagarFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    tenant_id: faker.string.uuid(),
    descricao: faker.commerce.productName(),
    valor_total: faker.number.float({ min: 100, max: 10000, precision: 0.01 }),
    data_vencimento: faker.date.future(),
    status: faker.helpers.arrayElement(['PENDENTE', 'PAGO', 'VENCIDA']),
    ...overrides,
  }),
};
```


**MSW Setup for Supabase Mocking:**

```typescript
// src/__mocks__/browser.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://test.supabase.co';

export const handlers = [
  // Auth endpoints
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
      },
    });
  }),

  // Generic table query
  http.get(`${SUPABASE_URL}/rest/v1/:table`, ({ params }) => {
    return HttpResponse.json([]);
  }),

  // Insert
  http.post(`${SUPABASE_URL}/rest/v1/:table`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...body, id: 'new-id' }, { status: 201 });
  }),

  // Update
  http.patch(`${SUPABASE_URL}/rest/v1/:table`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),

  // Delete
  http.delete(`${SUPABASE_URL}/rest/v1/:table`, () => {
    return HttpResponse.json({}, { status: 204 });
  }),
];

export const server = setupServer(...handlers);
```

**Example Unit Test:**

```typescript
// src/__tests__/unit/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatCPF } from '@/utils/format';

describe('formatCurrency', () => {
  it('should format positive numbers as BRL currency', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });

  it('should format negative numbers', () => {
    expect(formatCurrency(-500)).toBe('-R$ 500,00');
  });
});

describe('formatDate', () => {
  it('should format date as DD/MM/YYYY', () => {
    const date = new Date('2024-06-15');
    expect(formatDate(date)).toBe('15/06/2024');
  });
});

describe('formatCPF', () => {
  it('should format CPF with dots and dash', () => {
    expect(formatCPF('12345678900')).toBe('123.456.789-00');
  });

  it('should handle already formatted CPF', () => {
    expect(formatCPF('123.456.789-00')).toBe('123.456.789-00');
  });
});
```


**Example Integration Test:**

```typescript
// src/__tests__/integration/flows/animal-registration.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/__mocks__/browser';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test-utils/render';
import AnimalManagement from '@/pages/Pecuaria/AnimalManagement';

describe('Animal Registration Flow', () => {
  it('should successfully register a new animal', async () => {
    const user = userEvent.setup();

    // Mock successful API response
    server.use(
      http.post('*/rest/v1/animais', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          ...body,
          id: 'new-animal-id',
        }, { status: 201 });
      })
    );

    renderWithProviders(<AnimalManagement />);

    // Click "Novo Animal" button
    await user.click(screen.getByRole('button', { name: /novo animal/i }));

    // Fill form
    await user.type(screen.getByLabelText(/brinco/i), '123456');
    await user.selectOptions(screen.getByLabelText(/raça/i), 'Nelore');
    await user.type(screen.getByLabelText(/peso/i), '350');

    // Submit
    await user.click(screen.getByRole('button', { name: /salvar/i }));

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/animal cadastrado com sucesso/i)).toBeInTheDocument();
    });

    // Verify table updated
    expect(screen.getByText('123456')).toBeInTheDocument();
  });

  it('should show validation errors for empty brinco', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnimalManagement />);

    await user.click(screen.getByRole('button', { name: /novo animal/i }));
    await user.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText(/brinco é obrigatório/i)).toBeInTheDocument();
    });
  });
});
```

**Playwright E2E Test:**

```typescript
// e2e/critical-paths.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Critical Business Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should complete full purchase → inventory → payment flow', async ({ page }) => {
    // Navigate to Purchases
    await page.click('text=Compras');
    await page.click('text=Nova Compra');

    // Fill purchase form
    await page.selectOption('select[name="fornecedor"]', { label: 'Fornecedor Teste' });
    await page.fill('input[name="valor"]', '5000');
    await page.click('text=Adicionar Item');
    await page.selectOption('select[name="insumo"]', { label: 'Ração' });
    await page.fill('input[name="quantidade"]', '100');
    await page.click('button:has-text("Salvar Compra")');

    // Verify inventory updated
    await page.click('text=Estoque');
    await expect(page.locator('text=Ração')).toBeVisible();
    await expect(page.locator('text=100')).toBeVisible();

    // Verify accounts payable created
    await page.click('text=Financeiro');
    await page.click('text=Contas a Pagar');
    await expect(page.locator('text=R$ 5.000,00')).toBeVisible();
  });
});
```


### Bundle Optimization Architecture

**Code Splitting Strategy:**

```
┌────────────────────────────────────────────────────────────┐
│                  BUNDLE STRUCTURE                          │
└────────────────────────────────────────────────────────────┘

Initial Load (<200KB gzipped):
  ├── main.js (150KB) ← Core app shell
  │   ├── React + ReactDOM
  │   ├── React Router
  │   ├── Auth logic
  │   ├── Layout components
  │   └── Critical CSS
  │
  └── vendor-react.js (50KB)
      └── React runtime only

Lazy Loaded Chunks (on-demand):
  ├── pages-pecuaria.js (80KB)
  ├── pages-finance.js (85KB)
  ├── pages-inventory.js (70KB)
  ├── pages-fleet.js (65KB)
  ├── pages-purchasing.js (60KB)
  ├── pages-sales.js (60KB)
  ├── pages-market.js (55KB)
  ├── vendor-charts.js (80KB) ← Recharts
  └── vendor-maps.js (60KB) ← Leaflet

Total Bundle: ~465KB gzipped (Goal: <500KB)
```

**Vite Configuration (Enhanced):**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Production optimizations
      babel: {
        plugins: [
          process.env.NODE_ENV === 'production' && [
            'transform-remove-console',
            { exclude: ['error', 'warn'] }
          ]
        ].filter(Boolean),
      },
    }),
    VitePWA({ /* ... existing config ... */ }),
    // Bundle analysis (only in build)
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor splitting
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'vendor-maps';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Group remaining vendors
            return 'vendor-misc';
          }
          
          // Page-based splitting
          if (id.includes('src/pages/Pecuaria')) return 'pages-pecuaria';
          if (id.includes('src/pages/Finance')) return 'pages-finance';
          if (id.includes('src/pages/Inventory')) return 'pages-inventory';
          if (id.includes('src/pages/Fleet')) return 'pages-fleet';
          if (id.includes('src/pages/Purchasing')) return 'pages-purchasing';
          if (id.includes('src/pages/Sales')) return 'pages-sales';
          if (id.includes('src/pages/Market')) return 'pages-market';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
    ],
  },
});
```


**Lazy Loading Implementation:**

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingSkeleton from '@/components/Feedback/LoadingSkeleton';

// Eager load (critical routes)
import Layout from '@/components/Layout/Layout';
import Dashboard from '@/pages/Dashboard/ExecutiveDashboard';
import Login from '@/pages/Auth/Login';

// Lazy load (secondary routes)
const AnimalManagement = lazy(() => import('@/pages/Pecuaria/AnimalManagement'));
const AccountsPayable = lazy(() => import('@/pages/Finance/AccountsPayable'));
const InventoryManagement = lazy(() => import('@/pages/Inventory/InventoryManagement'));
const FleetManagement = lazy(() => import('@/pages/Fleet/FleetManagement'));
const PurchaseOrders = lazy(() => import('@/pages/Purchasing/PurchaseOrders'));
const SalesOrders = lazy(() => import('@/pages/Sales/SalesOrders'));
const MarketIndicators = lazy(() => import('@/pages/Market/MarketIndicators'));

// Lazy load heavy charts
const ReportsCharts = lazy(() => import('@/pages/Reports/ReportsCharts'));
const MapView = lazy(() => import('@/pages/Pecuaria/MapView'));

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        
        <Route path="/pecuaria/*" element={
          <Suspense fallback={<LoadingSkeleton type="table" />}>
            <AnimalManagement />
          </Suspense>
        } />
        
        <Route path="/financeiro/*" element={
          <Suspense fallback={<LoadingSkeleton type="table" />}>
            <AccountsPayable />
          </Suspense>
        } />
        
        <Route path="/relatorios/graficos" element={
          <Suspense fallback={<LoadingSkeleton type="charts" />}>
            <ReportsCharts />
          </Suspense>
        } />
      </Route>
    </Routes>
  );
}
```

**Icon Tree-Shaking (Lucide React):**

```typescript
// ❌ BAD: Imports entire library (~500KB)
import * as Icons from 'lucide-react';

// ✅ GOOD: Import only what you need
import { ChevronRight, Users, DollarSign } from 'lucide-react';

// For dynamic icons, use a registry:
// src/components/Icon/iconRegistry.ts
import {
  ChevronRight,
  ChevronLeft,
  Users,
  DollarSign,
  Package,
  Truck,
  ShoppingCart,
  TrendingUp,
  Settings,
  LogOut,
} from 'lucide-react';

export const iconRegistry = {
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'users': Users,
  'dollar-sign': DollarSign,
  'package': Package,
  'truck': Truck,
  'shopping-cart': ShoppingCart,
  'trending-up': TrendingUp,
  'settings': Settings,
  'log-out': LogOut,
} as const;

export type IconName = keyof typeof iconRegistry;

// Usage:
// <Icon name="users" size={24} />
```


### Component Refactoring Architecture

**Refactoring Strategy for Large Components (>500 lines):**

```
BEFORE Refactoring:
┌──────────────────────────────────────┐
│  AccountsPayable.tsx (850 lines)    │
│                                      │
│  • State management (50 lines)      │
│  • API calls (80 lines)              │
│  • Business logic (120 lines)        │
│  • Event handlers (100 lines)        │
│  • UI rendering (500 lines)          │
│      - Table                         │
│      - Filters                       │
│      - Modal                         │
│      - Forms                         │
└──────────────────────────────────────┘

AFTER Refactoring:
┌──────────────────────────────────────────────────────────┐
│  src/pages/Finance/AccountsPayable/                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ├── index.tsx (150 lines) ← Main orchestrator          │
│  │                                                       │
│  ├── components/                                         │
│  │   ├── AccountsTable.tsx (120 lines)                  │
│  │   ├── FilterPanel.tsx (80 lines)                     │
│  │   ├── PaymentModal.tsx (100 lines)                   │
│  │   └── AccountForm.tsx (150 lines)                    │
│  │                                                       │
│  ├── hooks/                                              │
│  │   ├── useAccountsData.ts (60 lines)                  │
│  │   ├── usePaymentMutation.ts (40 lines)               │
│  │   └── useFilters.ts (50 lines)                       │
│  │                                                       │
│  ├── types.ts (30 lines)                                │
│  └── utils.ts (40 lines)                                │
│                                                          │
│  Total: ~820 lines (modularized, testable)              │
└──────────────────────────────────────────────────────────┘
```

**Refactoring Template:**

```typescript
// src/pages/Finance/AccountsPayable/index.tsx
import { AccountsTable } from './components/AccountsTable';
import { FilterPanel } from './components/FilterPanel';
import { PaymentModal } from './components/PaymentModal';
import { useAccountsData } from './hooks/useAccountsData';
import { useFilters } from './hooks/useFilters';
import { usePaymentMutation } from './hooks/usePaymentMutation';

export default function AccountsPayable() {
  const { filters, updateFilter, resetFilters } = useFilters();
  const { accounts, isLoading } = useAccountsData(filters);
  const { mutate: makePayment, isPending } = usePaymentMutation();
  
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePayment = (accountId: string, amount: number) => {
    makePayment({ accountId, amount });
    setIsModalOpen(false);
  };

  return (
    <div className="accounts-payable">
      <FilterPanel 
        filters={filters} 
        onFilterChange={updateFilter}
        onReset={resetFilters}
      />
      
      <AccountsTable
        data={accounts}
        isLoading={isLoading}
        onPayClick={(account) => {
          setSelectedAccount(account);
          setIsModalOpen(true);
        }}
      />
      
      <PaymentModal
        isOpen={isModalOpen}
        account={selectedAccount}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handlePayment}
        isProcessing={isPending}
      />
    </div>
  );
}
```


**Custom Hook Extraction Pattern:**

```typescript
// src/pages/Finance/AccountsPayable/hooks/useAccountsData.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AccountFilter } from '../types';

export function useAccountsData(filters: AccountFilter) {
  return useQuery({
    queryKey: ['accounts-payable', filters],
    queryFn: async () => {
      let query = supabase
        .from('contas_pagar')
        .select('*, fornecedor:fornecedores(*)')
        .eq('tenant_id', filters.tenantId)
        .order('data_vencimento', { ascending: true });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.startDate) {
        query = query.gte('data_vencimento', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('data_vencimento', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

```typescript
// src/pages/Finance/AccountsPayable/hooks/usePaymentMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export function usePaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, amount }: { accountId: string; amount: number }) => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .update({
          status: 'PAGO',
          data_pagamento: new Date().toISOString(),
          valor_pago: amount,
        })
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      toast.success('Pagamento registrado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });
}
```

```typescript
// src/pages/Finance/AccountsPayable/hooks/useFilters.ts
import { useState, useCallback } from 'react';
import type { AccountFilter } from '../types';

const initialFilters: AccountFilter = {
  tenantId: '', // Set from context
  status: null,
  startDate: null,
  endDate: null,
  fornecedorId: null,
};

export function useFilters() {
  const [filters, setFilters] = useState<AccountFilter>(initialFilters);

  const updateFilter = useCallback((key: keyof AccountFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  return { filters, updateFilter, resetFilters };
}
```


### PWA Offline-First Architecture

**Offline Sync System Design:**

```
┌─────────────────────────────────────────────────────────────┐
│                OFFLINE SYNC ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   User       │
                    │   Action     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Navigator   │
                    │  .onLine?    │
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                │                     │
            [ONLINE]              [OFFLINE]
                │                     │
                ▼                     ▼
      ┌─────────────────┐   ┌─────────────────┐
      │ Supabase API    │   │ IndexedDB Queue │
      │ (Direct)        │   │ + LocalStorage  │
      └────────┬────────┘   └────────┬────────┘
               │                     │
               ▼                     │
      ┌─────────────────┐            │
      │ Success ✓       │            │
      │ Update UI       │            │
      └─────────────────┘            │
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ Show Banner:    │
                            │ "Offline - 3    │
                            │  pending ops"   │
                            └─────────────────┘
                                     │
                                     │ (Back online)
                                     ▼
                            ┌─────────────────┐
                            │ Sync Queue      │
                            │ • Retry w/      │
                            │   backoff       │
                            │ • Handle errors │
                            │ • Update UI     │
                            └─────────────────┘
```

**OfflineSyncContext Implementation:**

```typescript
// src/contexts/OfflineSyncContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface QueuedOperation {
  id: string;
  action: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retries: number;
  lastError?: string;
}

interface OfflineDB extends DBSchema {
  queue: {
    key: string;
    value: QueuedOperation;
    indexes: { 'by-timestamp': number };
  };
}

interface OfflineSyncContextType {
  isOnline: boolean;
  queue: QueuedOperation[];
  addToQueue: (operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>) => Promise<void>;
  removeFromQueue: (id: string) => Promise<void>;
  syncQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | null>(null);

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [db, setDb] = useState<IDBPDatabase<OfflineDB> | null>(null);

  // Initialize IndexedDB
  useEffect(() => {
    openDB<OfflineDB>('tauze-offline', 1, {
      upgrade(db) {
        const store = db.createObjectStore('queue', { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
      },
    }).then(setDb);
  }, []);

  // Load queue from IndexedDB
  useEffect(() => {
    if (!db) return;
    db.getAll('queue').then(setQueue);
  }, [db]);

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue(); // Auto-sync when back online
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToQueue = async (operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>) => {
    if (!db) return;

    const queuedOp: QueuedOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
    };

    await db.add('queue', queuedOp);
    setQueue(prev => [...prev, queuedOp]);
  };

  const removeFromQueue = async (id: string) => {
    if (!db) return;
    await db.delete('queue', id);
    setQueue(prev => prev.filter(op => op.id !== id));
  };

  const syncQueue = async () => {
    if (!isOnline || !db) return;

    for (const operation of queue) {
      try {
        await executeOperation(operation);
        await removeFromQueue(operation.id);
      } catch (error) {
        // Update retry count with exponential backoff
        const updatedOp = {
          ...operation,
          retries: operation.retries + 1,
          lastError: error.message,
        };
        
        await db.put('queue', updatedOp);
        setQueue(prev => prev.map(op => op.id === operation.id ? updatedOp : op));
        
        // Max 5 retries
        if (updatedOp.retries >= 5) {
          console.error('Max retries reached for operation:', operation);
        }
      }
    }
  };

  const clearQueue = async () => {
    if (!db) return;
    await db.clear('queue');
    setQueue([]);
  };

  return (
    <OfflineSyncContext.Provider value={{
      isOnline,
      queue,
      addToQueue,
      removeFromQueue,
      syncQueue,
      clearQueue,
    }}>
      {children}
    </OfflineSyncContext.Provider>
  );
}

export const useOfflineSync = () => {
  const context = useContext(OfflineSyncContext);
  if (!context) throw new Error('useOfflineSync must be used within OfflineSyncProvider');
  return context;
};

// Helper function to execute operations
async function executeOperation(operation: QueuedOperation) {
  const { action, table, data } = operation;
  const { supabase } = await import('@/lib/supabase');

  switch (action) {
    case 'create':
      const { error: createError } = await supabase.from(table).insert(data);
      if (createError) throw createError;
      break;
    case 'update':
      const { error: updateError } = await supabase.from(table).update(data).eq('id', data.id);
      if (updateError) throw updateError;
      break;
    case 'delete':
      const { error: deleteError } = await supabase.from(table).delete().eq('id', data.id);
      if (deleteError) throw deleteError;
      break;
  }
}
```


**Offline Banner Component:**

```typescript
// src/components/Feedback/OfflineBanner.tsx
import { useOfflineSync } from '@/contexts/OfflineSyncContext';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline, queue, syncQueue } = useOfflineSync();

  if (isOnline && queue.length === 0) return null;

  return (
    <div className={`offline-banner ${isOnline ? 'syncing' : 'offline'}`}>
      {!isOnline ? (
        <>
          <WifiOff size={20} />
          <span>Você está offline - {queue.length} operações pendentes</span>
        </>
      ) : (
        <>
          <RefreshCw size={20} className="animate-spin" />
          <span>Sincronizando {queue.length} operações...</span>
          <button onClick={syncQueue}>Tentar agora</button>
        </>
      )}
    </div>
  );
}
```

**Background Sync for Photos (Service Worker):**

```typescript
// public/sw.js (Service Worker)

// Register background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'photo-upload') {
    event.waitUntil(syncPhotos());
  }
});

async function syncPhotos() {
  const cache = await caches.open('pending-photos');
  const requests = await cache.keys();

  for (const request of requests) {
    try {
      const response = await cache.match(request);
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      await uploadPhoto(blob);
      
      // Remove from cache on success
      await cache.delete(request);
    } catch (error) {
      console.error('Failed to sync photo:', error);
    }
  }
}
```

**Usage in Component:**

```typescript
// src/pages/Pecuaria/AnimalManagement.tsx
import { useOfflineSync } from '@/contexts/OfflineSyncContext';

function AnimalManagement() {
  const { isOnline, addToQueue } = useOfflineSync();

  const handleCreateAnimal = async (data: AnimalData) => {
    if (!isOnline) {
      // Queue for later sync
      await addToQueue({
        action: 'create',
        table: 'animais',
        data,
      });
      toast.info('Operação salva. Sincronizará quando online.');
    } else {
      // Direct API call
      await supabase.from('animais').insert(data);
      toast.success('Animal cadastrado!');
    }
  };

  return (
    // ... component JSX
  );
}
```


## Data Models

### Monitoring and Observability Architecture

**Sentry Integration:**

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      
      // Performance monitoring
      integrations: [
        new BrowserTracing(),
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      
      // Sample rates
      tracesSampleRate: 0.1, // 10% of transactions
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of errors
      
      // Context enrichment
      beforeSend(event, hint) {
        // Add tenant context
        const tenant = localStorage.getItem('tenant_id');
        if (tenant) {
          event.contexts = {
            ...event.contexts,
            tenant: { id: tenant },
          };
        }
        
        // Filter sensitive data
        if (event.request?.data) {
          delete event.request.data.password;
          delete event.request.data.token;
        }
        
        return event;
      },
      
      // Ignore common errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],
    });
  }
}

// Wrap components with error boundary
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Manual error capture
export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;

// Set user context
export function setSentryUser(user: { id: string; email: string; role: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}
```

**Usage in App:**

```typescript
// src/main.tsx
import { initSentry, SentryErrorBoundary } from './lib/sentry';

initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SentryErrorBoundary
      fallback={({ error }) => (
        <div>
          <h1>Ops! Algo deu errado</h1>
          <p>{error.message}</p>
        </div>
      )}
    >
      <App />
    </SentryErrorBoundary>
  </React.StrictMode>
);
```


**Analytics Integration:**

```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js';

export function initAnalytics() {
  if (import.meta.env.PROD) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      autocapture: false, // Manual events only
      capture_pageview: true,
      capture_pageleave: true,
    });
  }
}

// Track business events
export const analytics = {
  // Animal management
  animalRegistered: (data: { raca: string; peso: number }) => {
    posthog.capture('animal_registered', data);
  },
  
  // Sales
  saleCompleted: (data: { valor: number; cliente: string }) => {
    posthog.capture('sale_completed', data);
  },
  
  // Payments
  paymentReceived: (data: { valor: number; metodo: string }) => {
    posthog.capture('payment_received', data);
  },
  
  // Performance
  apiSlowResponse: (data: { endpoint: string; duration: number }) => {
    if (data.duration > 3000) { // > 3s
      posthog.capture('api_slow_response', data);
    }
  },
  
  pageLoadTime: (data: { route: string; duration: number }) => {
    posthog.capture('page_load_time', data);
  },
};

// Set user identity
export function identifyUser(user: { id: string; email: string; tenant_id: string }) {
  posthog.identify(user.id, {
    email: user.email,
    tenant_id: user.tenant_id,
  });
}

// Opt-out support
export function optOutAnalytics() {
  posthog.opt_out_capturing();
  localStorage.setItem('analytics_opted_out', 'true');
}
```

**Web Vitals Tracking:**

```typescript
// src/lib/webVitals.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';
import { analytics } from './analytics';

export function trackWebVitals() {
  onCLS((metric) => {
    analytics.pageLoadTime({
      route: window.location.pathname,
      duration: metric.value,
      metric: 'CLS',
    });
  });

  onFID((metric) => {
    analytics.pageLoadTime({
      route: window.location.pathname,
      duration: metric.value,
      metric: 'FID',
    });
  });

  onLCP((metric) => {
    analytics.pageLoadTime({
      route: window.location.pathname,
      duration: metric.value,
      metric: 'LCP',
    });
    
    // Alert if LCP > 2.5s
    if (metric.value > 2500) {
      console.warn(`Poor LCP on ${window.location.pathname}: ${metric.value}ms`);
    }
  });

  onFCP((metric) => {
    analytics.pageLoadTime({
      route: window.location.pathname,
      duration: metric.value,
      metric: 'FCP',
    });
  });

  onTTFB((metric) => {
    analytics.pageLoadTime({
      route: window.location.pathname,
      duration: metric.value,
      metric: 'TTFB',
    });
  });
}
```


### Database Performance Schema

**Index Creation Scripts:**

```sql
-- src/database/performance-indexes.sql

-- ============================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================

-- Animais: tenant + status (most common filter)
CREATE INDEX IF NOT EXISTS idx_animais_tenant_status 
ON animais(tenant_id, status) 
WHERE status = 'Ativo';

-- Animais: fazenda + lote (hierarchical query)
CREATE INDEX IF NOT EXISTS idx_animais_fazenda_lote 
ON animais(fazenda_id, lote_id);

-- Animais: brinco lookup (unique constraint already indexes)
-- No additional index needed

-- Pesagens: animal + data (historical queries)
CREATE INDEX IF NOT EXISTS idx_pesagens_animal_data 
ON pesagens(animal_id, data DESC);

-- Abastecimentos: tenant + data (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_abastecimentos_tenant_data 
ON abastecimentos(tenant_id, data DESC);

-- Contas a Pagar: tenant + vencimento (most critical)
CREATE INDEX IF NOT EXISTS idx_contas_pagar_tenant_vencimento 
ON contas_pagar(tenant_id, data_vencimento DESC);

-- Partial index for unpaid accounts only
CREATE INDEX IF NOT EXISTS idx_contas_pagar_pendentes 
ON contas_pagar(tenant_id, data_vencimento) 
WHERE status != 'PAGO';

-- Contas a Receber: similar pattern
CREATE INDEX IF NOT EXISTS idx_contas_receber_tenant_vencimento 
ON contas_receber(tenant_id, data_vencimento DESC);

CREATE INDEX IF NOT EXISTS idx_contas_receber_pendentes 
ON contas_receber(tenant_id, data_vencimento) 
WHERE status != 'RECEBIDO';

-- Movimentações de Estoque: insumo + data
CREATE INDEX IF NOT EXISTS idx_movimentacoes_insumo_data 
ON movimentacoes_estoque(insumo_id, data DESC);

-- Pedidos de Compra: tenant + status
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_tenant_status 
ON pedidos_compra(tenant_id, status, data_pedido DESC);

-- Vendas: tenant + cliente + data
CREATE INDEX IF NOT EXISTS idx_vendas_tenant_cliente_data 
ON vendas(tenant_id, cliente_id, data_venda DESC);

-- ============================================
-- ANALYZE QUERIES FOR MONITORING
-- ============================================

-- Find slow queries in production
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE 'pg_toast%'
ORDER BY schemaname, tablename;

-- Find missing indexes (seq scans on large tables)
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / seq_scan AS avg_tuples_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 0
  AND seq_tup_read / seq_scan > 1000
ORDER BY seq_tup_read DESC
LIMIT 10;
```


**N+1 Query Prevention:**

```typescript
// ❌ BAD: N+1 query problem
async function getAnimalsWithFarms() {
  const animals = await supabase.from('animais').select('*');
  
  // This makes N additional queries!
  for (const animal of animals.data) {
    const farm = await supabase
      .from('fazendas')
      .select('*')
      .eq('id', animal.fazenda_id)
      .single();
    animal.fazenda = farm.data;
  }
  
  return animals.data;
}

// ✅ GOOD: Single query with JOIN
async function getAnimalsWithFarms() {
  const { data, error } = await supabase
    .from('animais')
    .select(`
      *,
      fazenda:fazendas(*),
      lote:lotes(*)
    `);
  
  if (error) throw error;
  return data;
}

// ✅ ALSO GOOD: Batch loading with React Query
function useAnimalsWithFarms() {
  return useQuery({
    queryKey: ['animals-with-farms'],
    queryFn: async () => {
      const { data } = await supabase
        .from('animais')
        .select('*, fazendas(*), lotes(*)');
      return data;
    },
  });
}
```

**Query Performance Monitoring:**

```typescript
// src/lib/supabase.ts (enhanced)
import { createClient } from '@supabase/supabase-js';
import { analytics } from './analytics';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Wrap queries with performance monitoring
export async function monitoredQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await queryFn();
    const duration = performance.now() - start;
    
    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      analytics.apiSlowResponse({ endpoint: queryName, duration });
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`Query failed: ${queryName} after ${duration}ms`, error);
    throw error;
  }
}

// Usage:
const animals = await monitoredQuery(
  () => supabase.from('animais').select('*'),
  'fetch-animals'
);
```


## Error Handling

### Error Handling Strategy

**Centralized Error Handler:**

```typescript
// src/lib/errorHandler.ts
import { captureException } from './sentry';
import { toast } from 'react-hot-toast';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function handleError(error: unknown, context?: string) {
  console.error(`Error in ${context}:`, error);

  // Determine error type
  if (error instanceof AppError) {
    // Operational error - show to user
    toast.error(error.message);
    
    if (!error.isOperational) {
      captureException(error);
    }
  } else if (error instanceof Error) {
    // Programming error - log to Sentry
    captureException(error);
    toast.error('Ocorreu um erro inesperado. Nossa equipe foi notificada.');
  } else {
    // Unknown error
    captureException(new Error(`Unknown error: ${JSON.stringify(error)}`));
    toast.error('Ocorreu um erro desconhecido.');
  }
}

// Supabase error mapper
export function mapSupabaseError(error: any): AppError {
  switch (error.code) {
    case '23505': // Unique violation
      return new AppError('Este registro já existe', 'DUPLICATE_ENTRY', 409);
    case '23503': // Foreign key violation
      return new AppError('Registro relacionado não encontrado', 'NOT_FOUND', 404);
    case 'PGRST116': // No rows found
      return new AppError('Registro não encontrado', 'NOT_FOUND', 404);
    default:
      return new AppError(error.message || 'Erro no banco de dados', 'DATABASE_ERROR', 500, false);
  }
}
```

**React Query Error Handling:**

```typescript
// src/contexts/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { handleError, mapSupabaseError } from '@/lib/errorHandler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      onError: (error) => {
        const appError = mapSupabaseError(error);
        handleError(appError, 'React Query');
      },
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        const appError = mapSupabaseError(error);
        handleError(appError, 'Mutation');
      },
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```


## Testing Strategy

### Testing Approach

**Testing Pyramid:**

```
        E2E (10%)
       ╱────────╲
      ╱ Critical ╲
     ╱   Paths    ╲
    ╱──────────────╲
   ╱  Integration   ╲
  ╱ (30%) Components╲
 ╱────────────────────╲
╱   Unit Tests (60%)   ╲
╱ Utils, Hooks, Logic  ╲
──────────────────────────
```

**Coverage Strategy:**

| Module | Target Coverage | Priority | Test Types |
|--------|----------------|----------|------------|
| `src/utils/` | 90%+ | 🔴 Critical | Unit |
| `src/hooks/` | 80%+ | 🔴 Critical | Unit + Integration |
| `src/lib/` | 80%+ | 🔴 Critical | Unit |
| `src/components/` | 70%+ | 🟡 High | Unit + Integration |
| `src/pages/Finance/` | 60%+ | 🟡 High | Integration + E2E |
| `src/pages/Pecuaria/` | 60%+ | 🟡 High | Integration + E2E |
| `src/pages/Inventory/` | 50%+ | 🟢 Medium | Integration |
| `src/contexts/` | 70%+ | 🟡 High | Integration |

**Test Execution Strategy:**

```bash
# Local development
npm run test              # Watch mode
npm run test:ui           # Vitest UI

# Pre-commit (Husky)
npm run test:run          # Run once, fast
npm run lint              # ESLint

# CI/CD Pipeline
npm run lint              # ESLint (fail on error)
npm run type-check        # TypeScript (fail on error)
npm run test:coverage     # Vitest with coverage (fail if <60%)
npm run build             # Production build
```

**Property-Based Testing (Future Enhancement):**

For critical business logic, consider property-based testing with `fast-check`:

```typescript
// Example: Testing formatCurrency properties
import fc from 'fast-check';

describe('formatCurrency properties', () => {
  it('should always return a string starting with R$', () => {
    fc.assert(
      fc.property(fc.float(), (value) => {
        const result = formatCurrency(value);
        return result.startsWith('R$');
      })
    );
  });

  it('should be idempotent when parsing back', () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 1000000 }), (value) => {
        const formatted = formatCurrency(value);
        const parsed = parseCurrency(formatted);
        return Math.abs(parsed - value) < 0.01; // Float precision
      })
    );
  });
});
```


### CI/CD Pipeline Design

**GitHub Actions Workflow:**

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20.x'

jobs:
  lint:
    name: Lint & Format Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Check formatting
        run: npm run format:check

  type-check:
    name: TypeScript Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - run: npm ci
      - run: npm run type-check

  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - run: npm ci
      
      - name: Run tests with coverage
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true
      
      - name: Check coverage threshold
        run: |
          COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
          if (( $(echo "$COVERAGE < 60" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 60% threshold"
            exit 1
          fi

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  build:
    name: Build Production
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.tauze.com
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./dist

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build, e2e]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://app.tauze.com
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./dist
      
      - name: Notify Sentry of deployment
        run: |
          curl https://sentry.io/api/0/organizations/${{ secrets.SENTRY_ORG }}/releases/ \
            -X POST \
            -H "Authorization: Bearer ${{ secrets.SENTRY_AUTH_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "version": "${{ github.sha }}",
              "projects": ["tauze-erp"]
            }'
```


### Code Quality Tooling

**ESLint Configuration:**

```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import a11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': a11y,
    },
    rules: {
      // React Hooks
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      
      // Accessibility
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/label-has-associated-control': 'warn',
      
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // Performance
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      
      // Best practices
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
    },
  }
);
```

**Prettier Configuration:**

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Husky + lint-staged Setup:**

```json
// package.json (scripts section)
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```


**TypeScript Strict Mode Migration:**

```json
// tsconfig.json (strict configuration)
{
  "compilerOptions": {
    // Strict checks
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    
    // Module resolution
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    
    // Bundler mode
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    
    // Path aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Migration Strategy (Incremental):**

```typescript
// Step 1: Enable strict mode in tsconfig.json
// Step 2: Fix errors module by module (start with utils/)

// Before (implicit any):
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// After (strict types):
interface Item {
  price: number;
  quantity: number;
}

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Step 3: Handle null/undefined properly
// Before:
function getUserName(user) {
  return user.name.toUpperCase();
}

// After:
interface User {
  name?: string;
}

function getUserName(user: User): string {
  return user.name?.toUpperCase() ?? 'Anonymous';
}
```


### Developer Experience Components

**LoadingSkeleton Component:**

```typescript
// src/components/Feedback/LoadingSkeleton.tsx
import './LoadingSkeleton.css';

type SkeletonType = 'table' | 'card' | 'form' | 'chart' | 'text';

interface LoadingSkeletonProps {
  type: SkeletonType;
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ type, rows = 5, className = '' }: LoadingSkeletonProps) {
  switch (type) {
    case 'table':
      return (
        <div className={`skeleton-table ${className}`}>
          <div className="skeleton-row skeleton-header">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-cell" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="skeleton-row">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="skeleton-cell" />
              ))}
            </div>
          ))}
        </div>
      );

    case 'card':
      return (
        <div className={`skeleton-card ${className}`}>
          <div className="skeleton-title" />
          <div className="skeleton-text" />
          <div className="skeleton-text" style={{ width: '60%' }} />
        </div>
      );

    case 'form':
      return (
        <div className={`skeleton-form ${className}`}>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="skeleton-field">
              <div className="skeleton-label" />
              <div className="skeleton-input" />
            </div>
          ))}
        </div>
      );

    case 'chart':
      return (
        <div className={`skeleton-chart ${className}`}>
          <div className="skeleton-chart-bars">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-bar"
                style={{ height: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
        </div>
      );

    case 'text':
    default:
      return (
        <div className={`skeleton-text-block ${className}`}>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="skeleton-text" />
          ))}
        </div>
      );
  }
}
```

```css
/* src/components/Feedback/LoadingSkeleton.css */
.skeleton-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border);
}

.skeleton-header {
  background: var(--bg-elevated);
}

.skeleton-cell {
  height: 20px;
  background: linear-gradient(
    90deg,
    var(--bg-card) 0%,
    var(--bg-elevated) 50%,
    var(--bg-card) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-card {
  padding: 1.5rem;
  border-radius: 8px;
  background: var(--bg-card);
}

.skeleton-title {
  height: 24px;
  width: 40%;
  margin-bottom: 1rem;
  background: var(--bg-elevated);
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

.skeleton-text {
  height: 16px;
  margin-bottom: 0.5rem;
  background: var(--bg-elevated);
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}
```


**Command Palette Enhancement:**

```typescript
// src/components/Navigation/CommandPalette.tsx (enhanced)
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command } from 'lucide-react';

interface CommandAction {
  id: string;
  label: string;
  keywords: string[];
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'settings';
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands: CommandAction[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'Ir para Dashboard',
      keywords: ['dashboard', 'home', 'início'],
      icon: <Home />,
      shortcut: 'Ctrl+H',
      action: () => navigate('/dashboard'),
      category: 'navigation',
    },
    {
      id: 'nav-animals',
      label: 'Ir para Animais',
      keywords: ['animais', 'pecuária', 'gado'],
      icon: <Cow />,
      action: () => navigate('/pecuaria/animais'),
      category: 'navigation',
    },
    {
      id: 'nav-finance',
      label: 'Ir para Financeiro',
      keywords: ['financeiro', 'contas', 'pagamentos'],
      icon: <DollarSign />,
      action: () => navigate('/financeiro'),
      category: 'navigation',
    },

    // Actions
    {
      id: 'action-new-animal',
      label: 'Registrar novo animal',
      keywords: ['novo', 'animal', 'cadastrar', 'registrar'],
      icon: <Plus />,
      action: () => {
        navigate('/pecuaria/animais');
        // Trigger new animal modal
        setTimeout(() => {
          document.querySelector('[data-action="new-animal"]')?.click();
        }, 100);
      },
      category: 'actions',
    },
    {
      id: 'action-new-payment',
      label: 'Lançar pagamento',
      keywords: ['pagamento', 'pagar', 'conta'],
      icon: <Receipt />,
      action: () => navigate('/financeiro/contas-pagar?action=new'),
      category: 'actions',
    },

    // Settings
    {
      id: 'settings-theme',
      label: 'Alternar tema (claro/escuro)',
      keywords: ['tema', 'dark', 'light', 'modo'],
      icon: <Moon />,
      action: () => {
        document.body.classList.toggle('light-mode');
      },
      category: 'settings',
    },
    {
      id: 'settings-farm',
      label: 'Trocar fazenda',
      keywords: ['fazenda', 'trocar', 'mudar'],
      icon: <Building />,
      action: () => {
        // Open farm selector
      },
      category: 'settings',
    },
  ], [navigate]);

  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    
    const lowerSearch = search.toLowerCase();
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(lowerSearch) ||
      cmd.keywords.some(kw => kw.includes(lowerSearch))
    );
  }, [commands, search]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {
      navigation: [],
      actions: [],
      settings: [],
    };

    filteredCommands.forEach(cmd => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-search">
          <Search size={20} />
          <input
            type="text"
            placeholder="Digite um comando ou pesquise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <kbd className="shortcut">
            <Command size={12} /> K
          </kbd>
        </div>

        <div className="command-results">
          {Object.entries(groupedCommands).map(([category, cmds]) => {
            if (cmds.length === 0) return null;

            return (
              <div key={category} className="command-group">
                <div className="command-group-title">
                  {category === 'navigation' && 'Navegação'}
                  {category === 'actions' && 'Ações'}
                  {category === 'settings' && 'Configurações'}
                </div>
                {cmds.map((cmd) => (
                  <button
                    key={cmd.id}
                    className="command-item"
                    onClick={() => {
                      cmd.action();
                      setIsOpen(false);
                    }}
                  >
                    <div className="command-item-left">
                      {cmd.icon}
                      <span>{cmd.label}</span>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="command-shortcut">{cmd.shortcut}</kbd>
                    )}
                  </button>
                ))}
              </div>
            );
          })}

          {filteredCommands.length === 0 && (
            <div className="command-empty">
              Nenhum comando encontrado para "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```


**React Query Optimization:**

```typescript
// src/contexts/QueryProvider.tsx (optimized configuration)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache configuration
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes (renamed to gcTime in v5)
      
      // Refetch configuration
      refetchOnWindowFocus: import.meta.env.PROD ? false : true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      
      // Retry configuration
      retry: 1, // Only retry once (not 3 times)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Error handling
      useErrorBoundary: false,
    },
    mutations: {
      retry: 0, // Don't retry mutations
      useErrorBoundary: false,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

**Custom Query Hooks with Optimized Settings:**

```typescript
// src/hooks/useMarketData.ts (long staleTime for infrequent data)
import { useQuery } from '@tanstack/react-query';

export function useMarketData() {
  return useQuery({
    queryKey: ['market-data', 'cepea'],
    queryFn: fetchCepeaData,
    staleTime: 60 * 60 * 1000, // 1 hour (market data changes infrequently)
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
  });
}

// src/hooks/useAnimals.ts (shorter staleTime for dynamic data)
export function useAnimals(filters: AnimalFilter) {
  return useQuery({
    queryKey: ['animals', filters],
    queryFn: () => fetchAnimals(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}
```

**Prefetching Strategy:**

```typescript
// src/pages/Dashboard/ExecutiveDashboard.tsx
import { useQueryClient } from '@tanstack/react-query';

export function ExecutiveDashboard() {
  const queryClient = useQueryClient();

  // Prefetch likely next pages
  useEffect(() => {
    // User likely to visit animals page next
    queryClient.prefetchQuery({
      queryKey: ['animals'],
      queryFn: fetchAnimals,
    });

    // Prefetch accounts payable
    queryClient.prefetchQuery({
      queryKey: ['accounts-payable'],
      queryFn: fetchAccountsPayable,
    });
  }, [queryClient]);

  return (
    // ... dashboard UI
  );
}
```


**Image Optimization:**

```typescript
// src/utils/imageCompression.ts
export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
}

const defaultOptions: CompressionOptions = {
  maxSizeMB: 0.5, // 500KB max
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

export async function compressImage(
  file: File,
  options: Partial<CompressionOptions> = {}
): Promise<File> {
  const opts = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > height) {
          if (width > opts.maxWidthOrHeight) {
            height = (height * opts.maxWidthOrHeight) / width;
            width = opts.maxWidthOrHeight;
          }
        } else {
          if (height > opts.maxWidthOrHeight) {
            width = (width * opts.maxWidthOrHeight) / height;
            height = opts.maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            // Check if size is acceptable
            const sizeMB = blob.size / 1024 / 1024;
            if (sizeMB > opts.maxSizeMB) {
              // Try again with lower quality
              canvas.toBlob(
                (blob2) => {
                  if (!blob2) {
                    reject(new Error('Failed to compress image'));
                    return;
                  }
                  const compressedFile = new File([blob2], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                },
                'image/jpeg',
                0.6 // Lower quality
              );
            } else {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          'image/jpeg',
          0.8 // Quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Usage in component
export function AnimalPhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      // Compress client-side
      setProgress(30);
      const compressed = await compressImage(file);
      
      // Upload to Supabase
      setProgress(60);
      const { data, error } = await supabase.storage
        .from('animal-photos')
        .upload(`${animalId}/${Date.now()}.jpg`, compressed);

      if (error) throw error;

      setProgress(100);
      toast.success('Foto enviada com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar foto');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
}
```


### Documentation Strategy

**README.md Structure:**

```markdown
# Tauze ERP v5.0

Sistema SaaS multi-tenant para gestão agropecuária.

## 🚀 Quick Start (< 10 minutos)

### Pré-requisitos
- Node.js 20+ (recomendado: 20.11.0)
- npm 10+
- Git

### Setup Local

1. Clone o repositório:
```bash
git clone https://github.com/tauze/erp.git
cd erp
```

2. Instale dependências:
```bash
npm install
```

3. Configure variáveis de ambiente:
```bash
cp .env.example .env
# Edite .env com suas credenciais Supabase
```

4. Rode os testes:
```bash
npm run test
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Acesse: http://localhost:5173

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── pages/          # Rotas da aplicação
├── contexts/       # Estado global
├── hooks/          # Custom hooks
├── lib/            # Bibliotecas e SDKs
├── utils/          # Funções utilitárias
└── __tests__/      # Testes (unit, integration, e2e)
```

## 🧪 Testes

```bash
npm run test              # Watch mode
npm run test:coverage     # Com cobertura (60%+ obrigatório)
npm run test:e2e          # End-to-end (Playwright)
```

## 🏗️ Build & Deploy

```bash
npm run build             # Build para produção
npm run preview           # Preview do build
```

## 📚 Documentação

- [Arquitetura](./docs/ARQUITETURA_ATUAL.md)
- [Guia de Contribuição](./CONTRIBUTING.md)
- [ADRs](./docs/decisions/)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## 🔧 Scripts Úteis

```bash
npm run lint              # ESLint
npm run lint:fix          # Fix automático
npm run format            # Prettier
npm run type-check        # TypeScript
```
```


**TROUBLESHOOTING.md:**

```markdown
# Troubleshooting Guide

## Problemas Comuns

### 1. Erro: "Missing environment variables"

**Sintoma:** Aplicação não inicia, erro no console sobre variáveis de ambiente.

**Solução:**
```bash
# Verifique se .env existe
ls -la .env

# Se não existir, copie do exemplo
cp .env.example .env

# Edite com suas credenciais
code .env
```

### 2. Testes falhando com erro de timeout

**Sintoma:** `Error: Test timeout exceeded`

**Solução:**
```typescript
// Aumentar timeout em testes específicos
it('should handle slow operation', { timeout: 10000 }, async () => {
  // ...
});
```

### 3. Build falha com "JavaScript heap out of memory"

**Sintoma:** Erro durante `npm run build`

**Solução:**
```bash
# Aumentar memória do Node.js
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### 4. Supabase retorna 406 Not Acceptable

**Sintoma:** Queries retornam erro 406

**Solução:**
```typescript
// Adicionar cabeçalho Accept
const { data } = await supabase
  .from('table')
  .select('*')
  .headers({
    'Accept': 'application/json',
  });
```

### 5. Hot reload não funciona

**Sintoma:** Mudanças no código não refletem no browser

**Solução:**
```bash
# Limpar cache do Vite
rm -rf node_modules/.vite
npm run dev
```

### 6. TypeScript errors após habilitar strict mode

**Sintoma:** Muitos erros de tipo após migração

**Solução:** Migrar incrementalmente:
```bash
# Desabilitar strict temporariamente
# Habilitar módulo por módulo em tsconfig.json
```

## Logs e Debugging

### Habilitar logs detalhados do Supabase

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  auth: {
    debug: true, // Logs de autenticação
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-debug': 'true',
    },
  },
});
```

### Verificar coverage threshold

```bash
# Ver relatório de cobertura
npm run test:coverage
open coverage/index.html
```

## Problemas de Performance

### Bundle muito grande

```bash
# Análise do bundle
npm run build:analyze
open dist/stats.html
```

### Queries lentas

```sql
-- No Supabase SQL Editor
EXPLAIN ANALYZE
SELECT * FROM animais WHERE tenant_id = 'xxx';
```

## Contato

- Slack: #tauze-dev
- Email: dev@tauze.com
```


**Architecture Decision Records (ADR Template):**

```markdown
# ADR-001: Use Supabase for Backend

## Status
Accepted

## Context
We needed a backend solution that provides:
- PostgreSQL database with Row Level Security
- Built-in authentication
- File storage
- Real-time capabilities
- Managed infrastructure

## Decision
Use Supabase as our Backend-as-a-Service platform.

## Consequences

### Positive
- Faster development (no backend code to write)
- Built-in RLS for multi-tenancy
- Automatic API generation
- Managed infrastructure
- Cost-effective for MVP

### Negative
- Vendor lock-in
- Limited control over backend logic
- Potential performance limitations at scale
- Migration complexity if needed

### Mitigation
- Use Supabase client abstraction layer
- Keep business logic in frontend hooks
- Monitor performance metrics
- Plan for Edge Functions if needed

---

# ADR-002: React Query for Server State

## Status
Accepted

## Context
We need a solution for:
- Server state management
- Caching
- Automatic refetching
- Optimistic updates
- Request deduplication

## Decision
Use @tanstack/react-query (formerly React Query) for all server state management.

## Consequences

### Positive
- Automatic caching and invalidation
- Reduced boilerplate
- Built-in loading/error states
- Excellent DevTools
- Active community

### Negative
- Learning curve for team
- Additional dependency
- Requires careful query key management

### Mitigation
- Establish query key conventions
- Document common patterns
- Use custom hooks for reusability

---

# ADR-003: Vitest over Jest

## Status
Accepted

## Context
We need a fast, modern testing framework compatible with Vite.

## Decision
Use Vitest instead of Jest for unit and integration testing.

## Consequences

### Positive
- Native ESM support
- Faster execution
- Vite config reuse
- Compatible with Jest API
- Better TypeScript support

### Negative
- Smaller ecosystem than Jest
- Some plugins may not be compatible

### Mitigation
- Use MSW for API mocking (Jest-compatible)
- Document any Vitest-specific patterns
```


## Correctness Properties

### Property-Based Testing Applicability Assessment

**Analysis:** The "System Improvements" spec focuses primarily on:
- Infrastructure changes (CI/CD, environment validation, key rotation)
- Code quality tooling (ESLint, Prettier, TypeScript strict mode)
- Performance optimizations (bundle size, lazy loading, database indexes)
- Developer experience enhancements (LoadingSkeleton, Command Palette)
- Monitoring integration (Sentry, Analytics)

**Conclusion:** Property-based testing is **NOT appropriate** for this spec because:

1. **Infrastructure as Code elements:** Environment validation, CI/CD pipeline configuration, deployment scripts are declarative configurations, not pure functions with testable properties.

2. **Tooling configuration:** ESLint rules, Prettier settings, TypeScript configs are static configurations that don't have input/output behavior suitable for PBT.

3. **UI components:** LoadingSkeleton, Command Palette, OfflineBanner are React components best tested with snapshot tests and user interaction tests, not property-based tests.

4. **Performance optimizations:** Bundle size, lazy loading, and database indexes are measured via metrics (bundle analyzer, Lighthouse, EXPLAIN ANALYZE), not property-based tests.

5. **Integration work:** Sentry, Analytics, and Web Vitals integrations are side-effect operations that should use mock-based unit tests.

**Testing Strategy for This Spec:**

Instead of property-based testing, this spec requires:

1. **Unit tests** for pure utility functions:
   - `validateEnv()` - test with various missing/invalid env combinations
   - `compressImage()` - test with different file sizes and formats
   - `formatCurrency()`, `formatDate()` - example-based tests

2. **Integration tests** for components:
   - LoadingSkeleton rendering
   - CommandPalette keyboard shortcuts
   - OfflineSyncContext queue behavior

3. **E2E tests** for critical workflows:
   - Offline sync → online → sync success
   - Environment validation failure halts app
   - Command Palette navigation

4. **Snapshot tests** for UI components:
   - LoadingSkeleton variants
   - Error boundaries

5. **Performance tests**:
   - Bundle size assertions (<500KB gzipped)
   - Lighthouse CI scores (>90 for all metrics)
   - Database query performance (EXPLAIN ANALYZE)

6. **Static analysis**:
   - TypeScript strict mode (no errors)
   - ESLint rules (no violations)
   - Coverage thresholds (60%+)

**Therefore, we skip the Correctness Properties section entirely for this design document.**


## Testing Strategy

### Testing Approach Summary

Given that property-based testing is not applicable to this infrastructure and tooling-focused spec, we adopt a multi-layered testing strategy:

**1. Unit Testing (60% of test effort)**

**Target Coverage:** 90%+ for pure utility functions

```typescript
// Example: Environment validation tests
describe('validateEnv', () => {
  beforeEach(() => {
    // Reset environment
    vi.stubEnv('VITE_SUPABASE_URL', undefined);
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined);
  });

  it('should throw when VITE_SUPABASE_URL is missing', () => {
    expect(() => validateEnv()).toThrow('Missing required environment variables');
  });

  it('should throw when VITE_SUPABASE_URL is invalid', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'not-a-url');
    expect(() => validateEnv()).toThrow('must be a valid URL');
  });

  it('should pass when all required vars are present', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
    expect(() => validateEnv()).not.toThrow();
  });
});

// Example: Image compression tests
describe('compressImage', () => {
  it('should reduce file size below 500KB', async () => {
    const largeFile = createMockFile(2000000); // 2MB
    const compressed = await compressImage(largeFile);
    expect(compressed.size).toBeLessThan(500000);
  });

  it('should limit dimensions to 1920px', async () => {
    const largeImage = createMockImage(3840, 2160);
    const compressed = await compressImage(largeImage);
    const dimensions = await getImageDimensions(compressed);
    expect(Math.max(dimensions.width, dimensions.height)).toBeLessThanOrEqual(1920);
  });
});
```

**2. Integration Testing (30% of test effort)**

**Target Coverage:** 70%+ for component interactions

```typescript
// Example: OfflineSync integration test
describe('OfflineSync Integration', () => {
  it('should queue operations when offline and sync when online', async () => {
    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: OfflineSyncProvider,
    });

    // Simulate offline
    vi.stubGlobal('navigator', { onLine: false });
    window.dispatchEvent(new Event('offline'));

    // Add operation to queue
    await act(async () => {
      await result.current.addToQueue({
        action: 'create',
        table: 'animais',
        data: { brinco: '123' },
      });
    });

    expect(result.current.queue).toHaveLength(1);

    // Simulate coming back online
    vi.stubGlobal('navigator', { onLine: true });
    window.dispatchEvent(new Event('online'));

    // Wait for auto-sync
    await waitFor(() => {
      expect(result.current.queue).toHaveLength(0);
    });
  });
});

// Example: CommandPalette integration test
describe('CommandPalette', () => {
  it('should open with Cmd+K and navigate on selection', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

    render(<CommandPalette />);

    // Open palette
    await user.keyboard('{Meta>}k{/Meta}');
    expect(screen.getByPlaceholderText(/digite um comando/i)).toBeInTheDocument();

    // Search and select
    await user.type(screen.getByRole('textbox'), 'animais');
    await user.click(screen.getByText('Ir para Animais'));

    expect(navigate).toHaveBeenCalledWith('/pecuaria/animais');
  });
});
```


**3. End-to-End Testing (10% of test effort)**

**Target:** Critical business workflows only

```typescript
// e2e/system-improvements.spec.ts
import { test, expect } from '@playwright/test';

test.describe('System Improvements E2E', () => {
  test('should block app startup with missing env vars', async ({ page }) => {
    // Simulate missing env by using a build without env vars
    await page.goto('http://localhost:5173/?simulate_missing_env=true');
    
    await expect(page.locator('text=Missing required environment variables')).toBeVisible();
    await expect(page.locator('text=VITE_SUPABASE_URL')).toBeVisible();
  });

  test('should complete offline → online sync flow', async ({ page, context }) => {
    await page.goto('http://localhost:5173');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Navigate to animals
    await page.click('text=Pecuária');

    // Go offline
    await context.setOffline(true);
    await expect(page.locator('text=Você está offline')).toBeVisible();

    // Try to register animal (should queue)
    await page.click('button:has-text("Novo Animal")');
    await page.fill('input[name="brinco"]', '999999');
    await page.click('button:has-text("Salvar")');

    await expect(page.locator('text=1 operações pendentes')).toBeVisible();

    // Go online
    await context.setOffline(false);
    await page.waitForTimeout(1000); // Wait for auto-sync

    await expect(page.locator('text=Sincronizando')).toBeVisible();
    await expect(page.locator('text=0 operações pendentes')).toBeVisible();
  });

  test('should measure Core Web Vitals', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};
        
        // Measure LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          vitals.lcp = entries[entries.length - 1].renderTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Measure CLS
        new PerformanceObserver((list) => {
          vitals.cls = list.getEntries().reduce((sum, entry: any) => sum + entry.value, 0);
        }).observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => resolve(vitals), 3000);
      });
    });

    expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(metrics.cls).toBeLessThan(0.1);  // CLS < 0.1
  });
});
```

**4. Performance Testing**

**Bundle Size Assertion:**

```typescript
// __tests__/performance/bundle-size.test.ts
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { statSync } from 'fs';
import { gzipSync } from 'zlib';
import { readFileSync } from 'fs';

describe('Bundle Size', () => {
  it('should be under 500KB gzipped', () => {
    // Build first
    execSync('npm run build', { stdio: 'inherit' });

    // Find main JS file
    const distFiles = execSync('ls dist/assets/*.js', { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean);

    const mainFile = distFiles.find(f => f.includes('index'));
    expect(mainFile).toBeDefined();

    // Measure gzipped size
    const content = readFileSync(mainFile!, 'utf-8');
    const gzipped = gzipSync(content);
    const sizeKB = gzipped.length / 1024;

    console.log(`Bundle size: ${sizeKB.toFixed(2)} KB (gzipped)`);
    expect(sizeKB).toBeLessThan(500);
  });
});
```

**5. Static Analysis Testing**

**TypeScript Strict Mode:**

```bash
# CI/CD Pipeline
npm run type-check  # Must pass with 0 errors
```

**Linting:**

```bash
# CI/CD Pipeline
npm run lint        # Must pass with 0 errors
npm run format:check # Must pass
```

**Coverage Thresholds:**

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
```

**Test Execution Matrix:**

| Phase | Tests Run | Criteria | Action on Fail |
|-------|-----------|----------|----------------|
| Pre-commit (Husky) | Related unit tests | Must pass | Block commit |
| PR Open | Lint + Type + Unit | Must pass | Block merge |
| PR Update | Lint + Type + Unit | Must pass | Block merge |
| Merge to develop | All + E2E | Must pass | Block merge |
| Deploy Staging | All + E2E + Bundle | Must pass | Block deploy |
| Merge to main | All + E2E + Bundle | Must pass | Block merge |
| Deploy Production | All + Performance | Must pass | Block deploy |


## Implementation Roadmap

### Phase 1: Security & Foundations (Week 1-2)

**Priority: CRITICAL**

1. **Environment Variable Validation**
   - Implement `validateEnv()` function
   - Update `main.tsx` to call validation
   - Create error UI for missing variables
   - Update `.gitignore` and `.env.example`
   - **Validation:** App should not start without required env vars

2. **Git History Cleanup**
   - Remove `.env` from Git history using `git filter-branch`
   - Force push to all branches
   - Notify team of the change
   - **Validation:** `git log --all -- .env` returns nothing

3. **Key Rotation**
   - Generate new Supabase keys
   - Generate new Stripe keys
   - Update in secrets management
   - Deploy with dual-key support (48h grace period)
   - Revoke old keys
   - **Validation:** Old keys return 401 Unauthorized

4. **RLS Audit**
   - Run audit SQL scripts
   - Enable RLS on missing tables
   - Create tenant isolation policies
   - Test with multi-tenant data
   - **Validation:** All tables have RLS enabled, tenant isolation works

### Phase 2: Code Quality & Testing (Week 2-4)

**Priority: HIGH**

1. **TypeScript Strict Mode**
   - Enable strict mode in `tsconfig.json`
   - Fix errors module by module (start with `utils/`)
   - Document common patterns
   - **Validation:** `npm run type-check` passes with 0 errors

2. **ESLint + Prettier + Husky**
   - Configure ESLint with recommended rules
   - Configure Prettier
   - Install Husky and lint-staged
   - Add pre-commit hooks
   - **Validation:** Commits blocked if lint fails

3. **Test Infrastructure**
   - Setup Vitest configuration
   - Create test utilities (`renderWithProviders`, factories)
   - Setup MSW for Supabase mocking
   - Install Playwright for E2E
   - **Validation:** `npm run test` executes successfully

4. **Increase Test Coverage to 60%**
   - Write unit tests for `src/utils/` (target: 90%)
   - Write unit tests for `src/hooks/` (target: 80%)
   - Write integration tests for critical flows
   - Write E2E tests for smoke tests
   - **Validation:** Coverage report shows 60%+ across all metrics

### Phase 3: Performance Optimization (Week 4-6)

**Priority: HIGH**

1. **Bundle Optimization**
   - Configure manual chunks in Vite
   - Implement lazy loading for all routes
   - Tree-shake lucide-react imports
   - Run bundle analyzer
   - **Validation:** Bundle <500KB gzipped

2. **Component Refactoring**
   - Refactor AccountsPayable (850 lines → modular)
   - Refactor AccountsReceivable
   - Refactor AuditLog
   - Refactor SalesOrders
   - **Validation:** No component >500 lines, tests still pass

3. **Database Performance**
   - Create composite indexes
   - Create partial indexes for pending accounts
   - Eliminate N+1 queries (use JOINs)
   - Add query performance monitoring
   - **Validation:** Slow query logs show <1s for all queries

4. **React Query Optimization**
   - Configure optimized defaults
   - Implement prefetching strategy
   - Add longer staleTime for market data
   - Disable refetchOnWindowFocus in production
   - **Validation:** DevTools show reduced network requests

### Phase 4: Offline-First PWA (Week 6-8)

**Priority: MEDIUM**

1. **OfflineSyncContext**
   - Implement IndexedDB queue
   - Implement sync logic with exponential backoff
   - Add online/offline event listeners
   - Create OfflineBanner component
   - **Validation:** Operations queue offline and sync online

2. **Service Worker Enhancements**
   - Configure Workbox cache strategies
   - Implement background sync for photos
   - Add cache-first for static assets
   - Add network-first for API calls
   - **Validation:** App works offline, syncs when online

3. **Image Optimization**
   - Implement client-side compression
   - Limit to 500KB and 1920px
   - Show upload progress
   - Use Web Worker for compression
   - **Validation:** Photos upload fast, <500KB each

### Phase 5: Monitoring & Observability (Week 8-9)

**Priority: MEDIUM**

1. **Sentry Integration**
   - Setup Sentry project
   - Initialize in `main.tsx`
   - Configure error boundary
   - Add context enrichment (tenant, user)
   - Filter sensitive data
   - **Validation:** Errors appear in Sentry dashboard

2. **Analytics Integration**
   - Setup PostHog/Mixpanel
   - Track business events (animal_registered, sale_completed)
   - Track performance events (api_slow_response)
   - Implement opt-out
   - **Validation:** Events appear in analytics dashboard

3. **Web Vitals Tracking**
   - Integrate web-vitals library
   - Track LCP, FID, CLS, FCP, TTFB
   - Send to analytics
   - Alert on poor metrics
   - **Validation:** Vitals tracked in analytics

### Phase 6: CI/CD & Developer Experience (Week 9-10)

**Priority: MEDIUM**

1. **GitHub Actions Pipeline**
   - Create workflow for lint, type-check, test, build
   - Add E2E tests to pipeline
   - Configure deployment to staging (develop branch)
   - Configure deployment to production (main branch)
   - Add Sentry release tracking
   - **Validation:** Pipeline runs on every PR, blocks merge on failure

2. **LoadingSkeleton Component**
   - Implement skeleton variants (table, card, form, chart)
   - Replace all "Carregando..." text
   - Add CSS animations
   - **Validation:** All routes show skeletons during loading

3. **Command Palette Enhancement**
   - Add navigation actions
   - Add quick actions (new animal, new payment)
   - Add settings actions (theme toggle, farm switch)
   - Implement search
   - **Validation:** Cmd+K opens palette, actions work

4. **Documentation**
   - Write comprehensive README
   - Create TROUBLESHOOTING guide
   - Document ADRs
   - Create onboarding guide
   - **Validation:** New developer can setup in <10 minutes

### Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Test Coverage | 12.5% | 60%+ | Vitest coverage report |
| Bundle Size (gzipped) | ~280KB | <500KB | Bundle analyzer |
| LCP | Unknown | <2.5s | Lighthouse CI |
| FID | Unknown | <100ms | Lighthouse CI |
| CLS | Unknown | <0.1 | Lighthouse CI |
| TypeScript Errors | ~50 | 0 | `tsc --noEmit` |
| ESLint Errors | ~30 | 0 | `npm run lint` |
| Slow Queries (>1s) | Unknown | 0 | DB logs |
| Lines per Component (max) | 850 | 500 | Manual inspection |

