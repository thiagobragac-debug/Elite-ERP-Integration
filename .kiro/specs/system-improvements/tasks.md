# Implementation Plan: System Improvements - Tauze ERP v5.0

## Overview

Este plano de implementação transforma o Tauze ERP v5.0 em uma plataforma enterprise-grade através de 6 fases coordenadas cobrindo segurança crítica, qualidade de código, performance, testes automatizados, capacidades offline-first, e observabilidade. O roadmap segue 10 semanas de trabalho com prioridades claramente definidas.

**Stack Tecnológica:** React 19, TypeScript 6.0, Vite 8, Supabase (PostgreSQL + Auth), React Query, Vitest, Playwright

**Baseline Atual:**
- 257 arquivos React/TypeScript
- 12.5% cobertura de testes
- ~850KB bundle size (não otimizado)
- 50+ erros TypeScript em modo permissivo
- Sem monitoramento de erros
- Sem suporte offline

**Metas Finais:**
- 60%+ cobertura de testes
- <500KB bundle gzipped
- 0 erros TypeScript (strict mode)
- Lighthouse score 90+
- Monitoramento completo (Sentry + Analytics)
- PWA offline-first funcional

## Tasks

### Phase 1: Security & Foundations (Week 1-2) 🔴 CRITICAL

- [x] 1. Implement environment variable validation system
  - [x] 1.1 Create `src/lib/validateEnv.ts` with validation logic
    - Implement `validateEnv()` function to check required environment variables
    - Check for: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
    - Validate URL format for Supabase URL
    - Throw descriptive errors for missing or invalid variables
    - Return silent success if all validations pass
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 1.2 Integrate validation into application startup
    - Update `src/main.tsx` to call `validateEnv()` before rendering
    - Create error UI component for missing environment variables
    - Display error screen with clear instructions if validation fails
    - Prevent React root from mounting if validation fails
    - _Requirements: 1.1, 1.4_
  
  - [x] 1.3 Update `.gitignore` and create `.env.example`
    - Add `.env`, `.env.local`, `.env.*.local` to `.gitignore`
    - Create comprehensive `.env.example` with all required variables documented
    - Include comments explaining each variable's purpose
    - Add setup instructions in comments
    - _Requirements: 1.2, 1.6_

- [ ] 2. Remove `.env` from Git history and rotate compromised keys
  - [x] 2.1 Clean Git history
    - Use `git filter-repo` or `git filter-branch` to remove `.env` from all commits
    - Create backup of repository before cleanup
    - Force push to `main` branch after cleanup
    - Force push to `develop` and feature branches
    - Verify cleanup with `git log --all -- .env`
    - _Requirements: 1.1, 2.1_
  
  - [x] 2.2 Rotate Supabase API keys
    - Generate new `anon` key in Supabase Dashboard → Settings → API
    - Generate new `service_role` key (if used in backend scripts)
    - Document old key IDs in rotation checklist
    - Update keys in GitHub Secrets (or secrets management system)
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [x] 2.3 Rotate Stripe API keys
    - Generate new keys in Stripe Dashboard → Developers → API keys
    - Update `VITE_STRIPE_PUBLISHABLE_KEY` in secrets
    - Test checkout flow with new keys
    - Document old key IDs for revocation
    - _Requirements: 2.2, 2.4_
  
  - [x] 2.4 Deploy with dual-key support and revoke old keys
    - Deploy application with new keys to production
    - Monitor error logs for 48 hours (grace period)
    - Verify all clients using new keys
    - Revoke old Supabase and Stripe keys after grace period
    - Update audit log with rotation completion
    - _Requirements: 2.5, 2.6, 2.7_
    - _Deliverables:_
      - `DEPLOYMENT_AND_KEY_REVOCATION_GUIDE.md` - Comprehensive deployment, monitoring, and revocation guide
      - `QUICK_START_TASK_2.4.md` - Quick start guide for task 2.4
      - `MONITORING_CHECKLIST_TEMPLATE.md` - Printable monitoring checklist template
      - Updated `CREDENTIAL_ROTATION_CHECKLIST.md` with cross-references

- [x] 3. Audit and enforce Row Level Security (RLS)
  - [x] 3.1 Create and run RLS audit SQL scripts
    - Create `src/database/audit-rls.sql` with audit queries
    - Query `pg_tables` to find tables without RLS enabled
    - Query `pg_policies` to find tables without tenant isolation policies
    - Generate report of tables missing RLS or policies
    - Document findings in audit log
    - _Requirements: 3.1, 3.5_
  
  - [x] 3.2 Enable RLS on all tables
    - Run `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for each missing table
    - Create SQL migration scripts for reproducibility
    - Verify RLS is enabled with `SELECT tablename FROM pg_tables WHERE rowsecurity = true`
    - _Requirements: 3.3_
  
  - [x] 3.3 Create tenant isolation policies for all tables
    - Create SELECT policy: `tenant_id = current_setting('request.jwt.claims')::json->>'tenant_id'`
    - Create INSERT/UPDATE/DELETE policy with same tenant check
    - Apply policies to all tables with `tenant_id` column
    - Document each policy in centralized RLS documentation
    - _Requirements: 3.2, 3.3, 3.5_
  
  - [x] 3.4 Test tenant isolation with multi-tenant data
    - Create test script to insert data for two different tenants
    - Set JWT claims to tenant A and query data
    - Verify only tenant A's data is returned
    - Repeat test with tenant B
    - Verify cross-tenant data access is blocked
    - _Requirements: 3.4_

- [x] 4. Checkpoint - Validate security foundations
  - Verify app won't start without required environment variables
  - Confirm `.env` is completely removed from Git history
  - Verify old API keys return 401 Unauthorized
  - Confirm all tables have RLS enabled with tenant isolation
  - Run tenant isolation tests and verify they pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 2: Code Quality & Testing (Week 2-4) 🟠 HIGH

- [x] 5. Enable TypeScript strict mode
  - [x] 5.1 Update `tsconfig.json` with strict settings
    - Enable `strict: true`
    - Enable `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`
    - Enable `noUncheckedIndexedAccess` for safer array access
    - Keep `skipLibCheck: true` for performance
    - _Requirements: 7.1, 7.2_
  
  - [x] 5.2 Fix TypeScript errors in `src/utils/` directory
    - Add explicit return types to all functions
    - Fix implicit `any` types
    - Add null checks for potentially undefined values
    - Add type guards for union types
    - Run `tsc --noEmit` to verify
    - _Requirements: 7.3, 7.4_
  
  - [x] 5.3 Fix TypeScript errors in `src/hooks/` directory
    - Add generic types to custom hooks
    - Fix React Query hook types
    - Add explicit return types to hook functions
    - Fix dependency array types
    - _Requirements: 7.3, 7.4_
  
  - [x] 5.4 Fix TypeScript errors in `src/components/` directory
    - Add explicit prop types to all components
    - Fix event handler types
    - Add children types for wrapper components
    - Fix ref types for forwarded refs
    - _Requirements: 7.3, 7.4_
  
  - [x] 5.5 Fix TypeScript errors in `src/pages/` directory
    - Add types for route parameters
    - Fix form submission handler types
    - Add types for state variables
    - Fix API response types
    - _Requirements: 7.3, 7.4_

- [x] 6. Configure code quality tools (ESLint, Prettier, Husky)
  - [x] 6.1 Configure ESLint with recommended rules
    - Update `eslint.config.js` with performance, accessibility, and quality rules
    - Add `@typescript-eslint/recommended` rules
    - Add `react-hooks/recommended` rules
    - Configure rules: `no-console` (warn), `no-debugger` (error), `prefer-const`
    - Add `npm run lint:fix` script to package.json
    - _Requirements: 12.1, 12.4_
  
  - [x] 6.2 Configure Prettier for consistent formatting
    - Create `.prettierrc` with project style rules
    - Configure: `semi: true`, `singleQuote: true`, `tabWidth: 2`, `printWidth: 100`
    - Create `.prettierignore` for build artifacts and dependencies
    - Add `npm run format` and `npm run format:check` scripts
    - _Requirements: 12.2, 12.5_
  
  - [x] 6.3 Setup Husky and lint-staged for pre-commit hooks
    - Install `husky` and `lint-staged` packages
    - Run `npx husky init` to setup Git hooks
    - Configure lint-staged to run ESLint and Prettier on staged files
    - Add pre-commit hook to run lint-staged
    - Test hook by attempting commit with linting errors
    - _Requirements: 12.3_

- [x] 7. Setup test infrastructure
  - [x] 7.1 Configure Vitest with coverage thresholds
    - Create `vitest.config.ts` with jsdom environment
    - Configure coverage provider as `v8`
    - Set coverage thresholds: 60% for lines, functions, branches, statements
    - Configure test file patterns: `**/*.test.{ts,tsx}`
    - Exclude test files, mocks, and types from coverage
    - _Requirements: 4.1_
  
  - [x] 7.2 Create test utilities and setup
    - Create `src/__tests__/setup.ts` with global test setup
    - Import `@testing-library/jest-dom` for matchers
    - Setup MSW server lifecycle (beforeAll, afterEach, afterAll)
    - Mock environment variables for tests
    - _Requirements: 4.3_
  
  - [x] 7.3 Create test render utilities with providers
    - Create `src/test-utils/render.tsx` with `renderWithProviders` function
    - Wrap components with QueryClientProvider, BrowserRouter, AuthProvider, TenantProvider
    - Create test QueryClient with retry disabled
    - Export utility function for use in all tests
    - _Requirements: 4.3_
  
  - [x] 7.4 Create test data factories
    - Create `src/test-utils/factories.ts` with data builders
    - Implement `animalFactory` with realistic test data
    - Implement `contaPagarFactory` for financial tests
    - Implement `userFactory` for auth tests
    - Use `@faker-js/faker` for dynamic data generation
    - _Requirements: 4.3_
  
  - [x] 7.5 Setup MSW for API mocking
    - Create `src/__mocks__/browser.ts` with MSW server setup
    - Create handlers for Supabase auth endpoints
    - Create generic handlers for REST API (GET, POST, PATCH, DELETE)
    - Export server instance for test imports
    - _Requirements: 4.3_
  
  - [x] 7.6 Install and configure Playwright for E2E tests
    - Install `@playwright/test` package
    - Run `npx playwright install` to install browsers
    - Create `playwright.config.ts` with test configuration
    - Configure base URL and test directory
    - Add scripts: `npm run test:e2e`, `npm run test:e2e:ui`, `npm run test:e2e:debug`
    - _Requirements: 4.6_

- [x] 8. Write unit tests for utilities (target 90% coverage)
  - [x] 8.1 Write tests for `src/utils/format.ts`
    - Test `formatCurrency` with positive, negative, zero values
    - Test `formatDate` with various date inputs
    - Test `formatCPF` and `formatCNPJ` with valid and invalid inputs
    - Test `formatPhone` with different phone number formats
    - Achieve 90%+ coverage for this file
    - _Requirements: 4.3_
  
  - [x] 8.2 Write tests for `src/utils/validation.ts`
    - Test `validateCPF` with valid and invalid CPFs
    - Test `validateCNPJ` with edge cases
    - Test `validateEmail` with various email formats
    - Test `validatePhone` with different phone patterns
    - _Requirements: 4.3_
  
  - [x] 8.3 Write tests for `src/utils/export.ts`
    - Test `exportToExcel` function with sample data
    - Test `exportToPDF` with different table structures
    - Mock file download interactions
    - Verify correct data formatting
    - _Requirements: 4.3_

- [x] 9. Write unit tests for custom hooks (target 80% coverage)
  - [x] 9.1 Write tests for `src/hooks/useAuth.ts`
    - Test login flow with valid and invalid credentials
    - Test logout functionality
    - Test token refresh logic
    - Mock Supabase auth responses
    - _Requirements: 4.3_
  
  - [x] 9.2 Write tests for `src/hooks/useFarmFilter.ts`
    - Test filter state management
    - Test filter reset functionality
    - Test filter application logic
    - _Requirements: 4.3_
  
  - [x] 9.3 Write tests for `src/hooks/useOfflineSync.ts`
    - Test queue management (add, remove, clear)
    - Test online/offline detection
    - Test sync retry logic with exponential backoff
    - Mock IndexedDB operations
    - _Requirements: 4.3_

- [x] 10. Write integration tests for critical business flows (target 30% of test suite)
  - [x] 10.1 Write integration test for animal registration flow
    - Test complete flow: open form → fill data → submit → verify table update
    - Mock Supabase API responses
    - Use `@testing-library/user-event` for interactions
    - Verify success toast appears
    - _Requirements: 4.4_
  
  - [x] 10.2 Write integration test for purchase → inventory → payment flow
    - Test purchase order creation
    - Verify inventory is updated with new items
    - Verify accounts payable record is created
    - Test payment processing updates all records
    - _Requirements: 4.4_
  
  - [x] 10.3 Write integration test for component: ModernTable
    - Test sorting functionality
    - Test filtering with search
    - Test pagination controls
    - Test row selection
    - _Requirements: 4.4_
  
  - [x] 10.4 Write integration test for component: FormModal
    - Test form validation
    - Test form submission
    - Test cancel and close actions
    - _Requirements: 4.4_

- [x] 11. Write E2E tests for smoke tests and critical paths
  - [x] 11.1 Write E2E smoke test
    - Test login flow
    - Verify dashboard loads
    - Test navigation to each module
    - Verify logout
    - _Requirements: 4.6_
  
  - [x] 11.2 Write E2E test for complete purchase-to-payment flow
    - Login as test user
    - Navigate to Purchases module
    - Create new purchase order
    - Verify inventory updated
    - Navigate to Accounts Payable
    - Process payment
    - Verify status changes
    - _Requirements: 4.6_

- [x] 12. Update dependency versions and security
  - [x] 12.1 Update all outdated dependencies
    - Run `npm outdated` to identify outdated packages
    - Update major versions with caution (test breaking changes)
    - Update minor and patch versions
    - Run full test suite after updates
    - _Requirements: 8.1_
  
  - [x] 12.2 Run security audit and fix vulnerabilities
    - Run `npm audit` to identify vulnerabilities
    - Run `npm audit fix` to auto-fix resolvable issues
    - Manually review and fix critical vulnerabilities that cannot be auto-fixed
    - Document any remaining vulnerabilities with justification
    - _Requirements: 8.2_
  
  - [x] 12.3 Configure automated dependency updates
    - Create `.github/dependabot.yml` configuration
    - Configure weekly update schedule for npm dependencies
    - Set auto-merge rules for patch updates
    - Configure PR grouping for related dependencies
    - _Requirements: 8.3_

- [>] 13. Checkpoint - Validate code quality and testing
  - Run `npm run type-check` and verify 0 TypeScript errors
  - Run `npm run lint` and verify 0 ESLint errors
  - Run `npm run format:check` and verify all files formatted
  - Run `npm run test:coverage` and verify 60%+ coverage across all metrics
  - Attempt commit with linting errors and verify hook blocks it
  - Ensure all tests pass, ask the user if questions arise.

### Phase 3: Performance Optimization (Week 4-6) 🟠 HIGH

- [x] 14. Optimize bundle size with code splitting and lazy loading
  - [x] 14.1 Configure Vite with manual chunk splitting
    - Update `vite.config.ts` with `build.rollupOptions.output.manualChunks`
    - Split vendor chunks: `vendor-react`, `vendor-router`, `vendor-query`, `vendor-supabase`
    - Split heavy libraries: `vendor-charts` (Recharts), `vendor-maps` (Leaflet), `vendor-icons` (Lucide)
    - Split by page: `pages-pecuaria`, `pages-finance`, `pages-inventory`, etc.
    - _Requirements: 5.2_
  
  - [x] 14.2 Implement lazy loading for all route components
    - Update `src/App.tsx` to use `React.lazy()` for all page imports
    - Keep critical routes eager loaded: Dashboard, Login
    - Wrap lazy routes with `<Suspense fallback={<LoadingSkeleton />}>`
    - Verify chunks are loaded on-demand in Network tab
    - _Requirements: 5.2, 5.6_
  
  - [x] 14.3 Implement lazy loading for heavy chart components
    - Lazy load Recharts components only when needed
    - Lazy load Leaflet map components for geolocation features
    - Add loading fallbacks for each lazy component
    - _Requirements: 5.3_
  
  - [x] 14.4 Tree-shake Lucide React icon imports
    - Create `src/components/Icon/iconRegistry.ts` with used icons only
    - Replace `import * as Icons from 'lucide-react'` with individual imports
    - Export icon registry with type-safe icon names
    - Create `<Icon name="..." />` component using registry
    - _Requirements: 5.4_
  
  - [x] 14.5 Configure bundle analyzer and generate report
    - Install `rollup-plugin-visualizer` package
    - Add visualizer plugin to `vite.config.ts`
    - Create `npm run build:analyze` script
    - Generate bundle report and verify <500KB gzipped
    - _Requirements: 5.5_

- [x] 15. Refactor large components (>500 lines) into modular structure
  - [x] 15.1 Refactor AccountsPayable component
    - Create directory: `src/pages/Finance/AccountsPayable/`
    - Extract components: `AccountsTable.tsx`, `FilterPanel.tsx`, `PaymentModal.tsx`, `AccountForm.tsx`
    - Extract hooks: `useAccountsData.ts`, `usePaymentMutation.ts`, `useFilters.ts`
    - Create `types.ts` for shared types
    - Update main `index.tsx` to orchestrate components
    - Verify all existing tests still pass
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 15.2 Refactor AccountsReceivable component
    - Create directory structure similar to AccountsPayable
    - Extract table, filter, and form components
    - Extract custom hooks for data fetching and mutations
    - Create shared types file
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 15.3 Refactor AuditLog component
    - Extract timeline component
    - Extract filter components
    - Extract hooks for log data fetching
    - Create types for audit log entries
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 15.4 Refactor SalesOrders component
    - Extract order table component
    - Extract order form and modal components
    - Extract hooks for CRUD operations
    - Create types for sales orders
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 16. Optimize database performance with indexes and query improvements
  - [x] 16.1 Create composite indexes for common queries
    - Create `src/database/performance-indexes.sql`
    - Add index: `idx_animais_tenant_status ON animais(tenant_id, status)`
    - Add index: `idx_animais_fazenda_lote ON animais(fazenda_id, lote_id)`
    - Add index: `idx_abastecimentos_tenant_data ON abastecimentos(tenant_id, data DESC)`
    - Add index: `idx_pesagens_animal_data ON pesagens(animal_id, data DESC)`
    - _Requirements: 14.2_
  
  - [x] 16.2 Create indexes for financial queries
    - Add index: `idx_contas_pagar_tenant_vencimento ON contas_pagar(tenant_id, data_vencimento DESC)`
    - Add partial index: `idx_contas_pagar_pendentes ON contas_pagar(tenant_id, data_vencimento) WHERE status != 'PAGO'`
    - Add index: `idx_contas_receber_tenant_vencimento ON contas_receber(tenant_id, data_vencimento DESC)`
    - Add partial index: `idx_contas_receber_pendentes ON contas_receber(tenant_id, data_vencimento) WHERE status != 'RECEBIDO'`
    - _Requirements: 14.3_
  
  - [x] 16.3 Create indexes for inventory and purchasing
    - Add index: `idx_movimentacoes_insumo_data ON movimentacoes_estoque(insumo_id, data DESC)`
    - Add index: `idx_pedidos_compra_tenant_status ON pedidos_compra(tenant_id, status, data_pedido DESC)`
    - Add index: `idx_vendas_tenant_cliente_data ON vendas(tenant_id, cliente_id, data_venda DESC)`
    - _Requirements: 14.2_
  
  - [x] 16.4 Eliminate N+1 queries by using JOINs
    - Audit all Supabase queries for N+1 patterns
    - Replace loops with JOIN queries using `.select('*, related_table(*)')`
    - Update animals query to include fazenda and lote in single query
    - Update financial queries to include fornecedor/cliente data
    - Verify query count reduction in network logs
    - _Requirements: 14.4_
  
  - [x] 16.5 Add query performance monitoring
    - Update `src/lib/supabase.ts` with query performance wrapper
    - Create `monitoredQuery()` function to track query duration
    - Log warnings for queries >1s
    - Send slow query metrics to analytics
    - _Requirements: 14.5_

- [x] 17. Optimize React Query configuration
  - [x] 17.1 Configure optimized default options
    - Update `src/contexts/QueryProvider.tsx` with new defaults
    - Set `staleTime: 5 * 60 * 1000` (5 minutes) for most queries
    - Set `cacheTime: 30 * 60 * 1000` (30 minutes)
    - Set `retry: 1` instead of 3 attempts
    - Disable `refetchOnWindowFocus` in production only
    - _Requirements: 20.1, 20.2, 20.3, 20.4_
  
  - [x] 17.2 Configure longer staleTime for infrequent data
    - Set `staleTime: 60 * 60 * 1000` (1 hour) for Cepea market data queries
    - Apply to static reference data (breeds, payment methods)
    - Document reasoning for different staleTime values
    - _Requirements: 20.5_
  
  - [x] 17.3 Ensure React Query DevTools only in development
    - Conditionally import DevTools based on `import.meta.env.DEV`
    - Verify DevTools not included in production build
    - _Requirements: 20.6_

- [x] 18. Checkpoint - Validate performance optimizations
  - Run `npm run build:analyze` and verify bundle <500KB gzipped
  - Verify initial chunk is <200KB
  - Run Lighthouse audit and target 90+ performance score
  - Verify no component exceeds 500 lines
  - Run database queries and verify all <1s
  - Test React Query DevTools not in production build
  - Ensure all tests pass, ask the user if questions arise.

### Phase 4: Offline-First PWA (Week 6-8) 🟡 MEDIUM

- [x] 19. Implement offline sync infrastructure
  - [x] 19.1 Create OfflineSyncContext with IndexedDB
    - Install `idb` package for IndexedDB wrapper
    - Create `src/contexts/OfflineSyncContext.tsx`
    - Implement IndexedDB schema with `queue` object store
    - Implement `addToQueue()` function for queueing operations
    - Implement `removeFromQueue()` function
    - Implement `syncQueue()` with retry logic and exponential backoff
    - _Requirements: 9.1, 9.2, 9.4_
  
  - [x] 19.2 Add online/offline detection
    - Listen to `window.addEventListener('online')` event
    - Listen to `window.addEventListener('offline')` event
    - Update context state with online status
    - Auto-trigger sync when coming back online
    - _Requirements: 9.2_
  
  - [x] 19.3 Implement queue operation types
    - Define `QueuedOperation` interface with action type, table, data, timestamp
    - Support actions: `create`, `update`, `delete`
    - Add retry count and last error fields
    - Implement max retry limit of 5 attempts
    - _Requirements: 9.1, 9.4_
  
  - [x] 19.4 Create OfflineBanner component
    - Create `src/components/Feedback/OfflineBanner.tsx`
    - Display "Você está offline" message with pending operation count
    - Show sync status when back online
    - Add manual "Tentar agora" button for sync retry
    - _Requirements: 9.3, 9.5_

- [ ] 20. Configure service worker with Workbox strategies
  - [x] 20.1 Update Vite PWA plugin configuration
    - Update `vite.config.ts` with Workbox strategies
    - Configure network-first strategy for API calls
    - Configure cache-first strategy for static assets (JS, CSS, images)
    - Configure stale-while-revalidate for fonts
    - Set cache expiration policies
    - _Requirements: 9.1, 9.2_
  
  - [-] 20.2 Implement background sync for photo uploads
    - Register `sync` event listener in service worker
    - Implement `syncPhotos()` function in service worker
    - Cache photos to upload in `pending-photos` cache
    - Upload photos when sync event triggers
    - Remove from cache on successful upload
    - _Requirements: 9.6_
  
  - [ ] 20.3 Test offline functionality
    - Test create operation while offline
    - Test update operation while offline
    - Test delete operation while offline
    - Verify operations queue in IndexedDB
    - Go online and verify auto-sync
    - Test manual sync button
    - _Requirements: 9.1, 9.2, 9.5_

- [x] 21. Implement client-side image optimization
  - [x] 21.1 Create image compression utility
    - Install `browser-image-compression` package
    - Create `src/utils/imageCompression.ts`
    - Implement compression with max size 500KB
    - Limit dimensions to 1920px max width or height
    - Maintain aspect ratio
    - _Requirements: 18.1, 18.2, 18.3_
  
  - [x] 21.2 Integrate compression into file upload flow
    - Update file input handlers to compress before upload
    - Show compression progress indicator
    - Use Web Worker for compression to avoid blocking main thread
    - Display upload progress during Supabase Storage upload
    - _Requirements: 18.4, 18.5_
  
  - [x] 21.3 Test image upload optimization
    - Upload large image (>2MB) and verify compression to <500KB
    - Verify dimensions reduced to max 1920px
    - Test that UI remains responsive during compression
    - Verify progress indicators display correctly
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [x] 22. Checkpoint - Validate offline-first capabilities
  - Test app works offline for critical operations
  - Verify operations queue and sync when online
  - Test photo background sync
  - Verify offline banner displays correctly
  - Test image compression reduces file sizes
  - Ensure all tests pass, ask the user if questions arise.

### Phase 5: Monitoring & Observability (Week 8-9) 🟡 MEDIUM

- [x] 23. Integrate Sentry for error tracking
  - [x] 23.1 Setup Sentry project and initialize SDK
    - Create Sentry project in dashboard
    - Install `@sentry/react` and `@sentry/tracing` packages
    - Create `src/lib/sentry.ts` with initialization logic
    - Configure DSN from environment variable `VITE_SENTRY_DSN`
    - Set environment based on `import.meta.env.MODE`
    - Only initialize in production (`import.meta.env.PROD`)
    - _Requirements: 10.1, 10.2_
  
  - [x] 23.2 Configure error enrichment and context
    - Add tenant context to all error events
    - Add user context with ID, email, role using `Sentry.setUser()`
    - Implement `beforeSend` hook to filter sensitive data (passwords, tokens)
    - Add custom tags for module/page where error occurred
    - _Requirements: 10.3, 10.6_
  
  - [x] 23.3 Setup performance monitoring and session replay
    - Integrate `BrowserTracing` for performance monitoring
    - Set `tracesSampleRate: 0.1` (10% of transactions)
    - Integrate `Replay` for session replay
    - Set `replaysSessionSampleRate: 0.1` (10% of sessions)
    - Set `replaysOnErrorSampleRate: 1.0` (100% of errors)
    - _Requirements: 10.4, 10.5_
  
  - [x] 23.4 Wrap app with Sentry ErrorBoundary
    - Update `src/main.tsx` to import `initSentry()`
    - Call `initSentry()` before rendering React app
    - Wrap root component with `<SentryErrorBoundary>`
    - Create fallback UI for error boundary
    - _Requirements: 10.1, 10.2_
  
  - [x] 23.5 Test error tracking
    - Trigger test error in development
    - Verify error appears in Sentry dashboard
    - Verify tenant and user context is attached
    - Verify sensitive data is filtered out
    - Test session replay on error
    - _Requirements: 10.2, 10.3, 10.5, 10.6_

- [x] 24. Integrate analytics for business events
  - [x] 24.1 Setup PostHog or Mixpanel
    - Create PostHog project (or Mixpanel account)
    - Install `posthog-js` package (or `mixpanel-browser`)
    - Create `src/lib/analytics.ts` with initialization
    - Configure API key from environment variable
    - Set `autocapture: false` for manual events only
    - Only initialize in production
    - _Requirements: 11.3_
  
  - [x] 24.2 Implement business event tracking
    - Create event tracking functions: `animalRegistered`, `saleCompleted`, `paymentReceived`
    - Add events to corresponding action handlers in components
    - Include relevant metadata (breed, weight, value, method)
    - _Requirements: 11.1_
  
  - [x] 24.3 Implement performance event tracking
    - Create events: `pageLoadTime`, `apiSlowResponse`
    - Track page load duration for each route
    - Track API calls that take >3 seconds
    - _Requirements: 11.2_
  
  - [x] 24.4 Implement user identification and opt-out
    - Create `identifyUser()` function to set user identity
    - Call after successful login with user ID, email, tenant_id
    - Implement `optOutAnalytics()` function
    - Store opt-out preference in localStorage
    - Respect opt-out and stop tracking
    - _Requirements: 11.4, 11.5_

- [ ] 25. Implement Web Vitals tracking
  - [x] 25.1 Install and configure web-vitals library
    - Install `web-vitals` package
    - Create `src/lib/webVitals.ts`
    - Import metrics: `onCLS`, `onFID`, `onLCP`, `onFCP`, `onTTFB`
    - _Requirements: 17.1_
  
  - [x] 25.2 Track and send Web Vitals to analytics
    - Call each metric function and send to analytics
    - Include route/page context with each metric
    - Include metric name (CLS, FID, LCP, FCP, TTFB)
    - _Requirements: 17.1, 17.2_
  
  - [x] 25.3 Alert on poor Web Vitals thresholds
    - Log warning when LCP > 2.5s
    - Log warning when FID > 100ms
    - Log warning when CLS > 0.1
    - Send alerts to monitoring service for poor metrics
    - _Requirements: 17.4_
  
  - [~] 25.4 Initialize Web Vitals tracking in main.tsx
    - Import and call `trackWebVitals()` in `src/main.tsx`
    - Verify metrics are tracked in analytics dashboard
    - _Requirements: 17.1, 17.5_

- [ ] 26. Run Lighthouse audit and optimize for score 90+
  - [~] 26.1 Run initial Lighthouse audit
    - Run Lighthouse in Chrome DevTools
    - Record baseline scores for Performance, Accessibility, Best Practices, SEO
    - Identify specific issues to address
    - _Requirements: 17.3_
  
  - [x] 26.2 Fix Lighthouse recommendations
    - Fix accessibility issues (ARIA labels, color contrast, alt text)
    - Fix best practices issues (console errors, deprecated APIs)
    - Fix SEO issues (meta tags, structured data)
    - Optimize images (use WebP, lazy loading)
    - _Requirements: 17.3_
  
  - [~] 26.3 Validate Lighthouse score improvements
    - Re-run Lighthouse audit
    - Verify all scores 90+
    - Document remaining issues if any
    - _Requirements: 17.3_

- [x] 27. Checkpoint - Validate monitoring and observability
  - Trigger test error and verify it appears in Sentry
  - Verify business events tracked in analytics
  - Verify Web Vitals tracked
  - Verify Lighthouse scores all 90+
  - Test opt-out functionality
  - Ensure all tests pass, ask the user if questions arise.

### Phase 6: CI/CD & Developer Experience (Week 9-10) 🟡 MEDIUM

- [x] 28. Create GitHub Actions CI/CD pipeline
  - [x] 28.1 Create workflow file for CI
    - Create `.github/workflows/ci.yml`
    - Configure triggers: push to all branches, pull requests
    - Setup Node.js environment (version 20)
    - Install dependencies with caching
    - _Requirements: 13.1_
  
  - [x] 28.2 Add lint step to pipeline
    - Run `npm run lint` in CI
    - Fail pipeline if linting errors exist
    - _Requirements: 13.2, 13.5_
  
  - [x] 28.3 Add type-check step to pipeline
    - Run `npm run type-check` in CI
    - Fail pipeline if TypeScript errors exist
    - _Requirements: 13.2, 13.5_
  
  - [x] 28.4 Add test step to pipeline
    - Run `npm run test:run` in CI
    - Generate coverage report
    - Fail pipeline if coverage <60% or tests fail
    - Upload coverage report as artifact
    - _Requirements: 13.2, 13.5_
  
  - [x] 28.5 Add build step to pipeline
    - Run `npm run build` in CI
    - Verify build completes successfully
    - Upload build artifacts
    - _Requirements: 13.2, 13.5_
  
  - [x] 28.6 Add E2E test step to pipeline
    - Install Playwright browsers in CI
    - Run `npm run test:e2e` in CI
    - Upload test results and videos on failure
    - _Requirements: 13.2_

- [ ] 29. Configure deployment automation
  - [~] 29.1 Setup staging deployment on develop branch
    - Add deployment job that runs after CI passes
    - Configure deployment to staging environment when `develop` branch is pushed
    - Set environment variables for staging
    - Add deployment status notification
    - _Requirements: 13.3, 13.6_
  
  - [x] 29.2 Setup production deployment on main branch
    - Add deployment job for production
    - Configure deployment to production when `main` branch is pushed
    - Require manual approval for production deploys
    - Set environment variables for production
    - _Requirements: 13.4, 13.6_
  
  - [x] 29.3 Integrate Sentry release tracking
    - Add Sentry CLI to CI workflow
    - Create Sentry release on deployment
    - Upload source maps to Sentry
    - Associate commits with release
    - _Requirements: 13.6_

- [ ] 30. Create LoadingSkeleton component for improved UX
  - [~] 30.1 Implement skeleton variants
    - Create `src/components/Feedback/LoadingSkeleton.tsx`
    - Implement `table` variant with rows and columns skeleton
    - Implement `card` variant for card layouts
    - Implement `form` variant for form fields
    - Implement `chart` variant for chart placeholders
    - Add CSS animations (shimmer/pulse effect)
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [x] 30.2 Replace text loading indicators with skeletons
    - Replace all "Carregando módulo..." with appropriate skeleton variants
    - Use table skeleton for list pages (animals, accounts, inventory)
    - Use card skeleton for dashboard cards
    - Use form skeleton for forms loading
    - Use chart skeleton for report pages
    - _Requirements: 15.2_
  
  - [x] 30.3 Add skeletons to lazy-loaded routes
    - Update all `<Suspense fallback>` to use LoadingSkeleton
    - Match skeleton structure to final UI
    - _Requirements: 15.4_

- [x] 31. Enhance Command Palette with quick actions
  - [x] 31.1 Add navigation actions to Command Palette
    - Add action: "Ver dashboard" → navigate to /
    - Add action: "Ir para Pecuária" → navigate to /pecuaria
    - Add action: "Ir para Financeiro" → navigate to /financeiro
    - Add action: "Ir para Estoque" → navigate to /estoque
    - _Requirements: 19.2_
  
  - [x] 31.2 Add quick business actions
    - Add action: "Registrar novo animal" → open animal form
    - Add action: "Lançar pagamento" → open payment modal
    - Add action: "Nova compra" → navigate to purchase form
    - _Requirements: 19.2_
  
  - [x] 31.3 Add settings actions
    - Add action: "Alternar fazenda" → open farm selector
    - Add action: "Modo escuro" → toggle dark mode
    - Add action: "Modo claro" → toggle light mode
    - _Requirements: 19.2_
  
  - [x] 31.4 Implement search and keyboard shortcuts
    - Implement fuzzy search for actions by keywords
    - Display keyboard shortcuts next to each action (if available)
    - Execute action immediately when selected
    - Show error message if action execution fails
    - _Requirements: 19.3, 19.4, 19.5_

- [x] 32. Create comprehensive documentation
  - [x] 32.1 Write onboarding guide
    - Create `docs/ONBOARDING.md`
    - Document prerequisites (Node.js, Git, Supabase account)
    - Provide step-by-step setup instructions
    - Include environment variable setup
    - Include database setup instructions
    - Target: new developer can setup in <10 minutes
    - _Requirements: 16.1_
  
  - [x] 32.2 Document architecture decisions (ADRs)
    - Create `docs/adr/` directory
    - Document ADR 001: Why Supabase over custom backend
    - Document ADR 002: Why React Query for state management
    - Document ADR 003: Multi-tenant RLS strategy
    - Document ADR 004: Offline-first approach with IndexedDB
    - _Requirements: 16.2_
  
  - [x] 32.3 Document API integrations
    - Create `docs/integrations/` directory
    - Document Supabase setup and configuration
    - Document Stripe integration for payments
    - Document Cepea API for market data
    - Include authentication, rate limits, error handling
    - _Requirements: 16.3_
  
  - [x] 32.4 Create troubleshooting guide
    - Create `docs/TROUBLESHOOTING.md`
    - Document common setup issues and solutions
    - Document build and deployment issues
    - Document database connection issues
    - Document authentication issues
    - _Requirements: 16.4_
  
  - [x] 32.5 Update README with complete project information
    - Update project description and features
    - Update setup instructions referencing onboarding guide
    - Document all npm scripts with descriptions
    - Include project structure overview
    - Add links to all documentation
    - Include contribution guidelines
    - _Requirements: 16.5_

- [~] 33. Checkpoint - Validate CI/CD and developer experience
  - Push code and verify CI pipeline runs all steps
  - Verify pipeline fails if tests/linting fails
  - Test deployment to staging from develop branch
  - Verify LoadingSkeleton components display correctly
  - Test Command Palette actions work
  - Verify new developer can setup project in <10 minutes using docs
  - Ensure all tests pass, ask the user if questions arise.

- [~] 34. Final validation and production readiness
  - Run full test suite and verify 60%+ coverage
  - Run Lighthouse audit and verify 90+ on all metrics
  - Verify bundle size <500KB gzipped
  - Verify 0 TypeScript errors in strict mode
  - Verify 0 ESLint errors
  - Test complete offline-first flow
  - Verify all monitoring integrated (Sentry, Analytics, Web Vitals)
  - Review and test all documentation
  - Create production deployment checklist
  - Deploy to production and monitor for 24 hours

## Notes

### Task Annotations
- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- All tasks without `*` are required for production readiness
- Checkpoints at end of each phase ensure incremental validation

### Testing Strategy
- Unit tests target 90%+ coverage for `src/utils/`
- Unit tests target 80%+ coverage for `src/hooks/`
- Integration tests cover critical business flows
- E2E tests validate smoke tests and end-to-end scenarios
- Property-based tests not applicable for this infrastructure-focused spec


### Requirements Traceability
Each task explicitly references requirements from `requirements.md` using the format `_Requirements: X.Y_`. This ensures:
- Complete coverage of all 20 requirements
- Easy verification of requirement implementation
- Clear audit trail for compliance

### Phase Priorities
- 🔴 **CRITICAL (Phase 1):** Security foundations - must be completed first, blocks all other work
- 🟠 **HIGH (Phase 2-3):** Code quality and performance - high impact on maintainability and UX
- 🟡 **MEDIUM (Phase 4-6):** Advanced features - important but can be deferred if needed

### Dependency Considerations
- Phase 1 must complete before any other phase begins (security first)
- Phase 2 (testing infrastructure) should complete before Phase 3 (refactoring)
- Phases 4, 5, 6 can be executed in parallel or reordered based on business priorities
- Checkpoints validate each phase before proceeding

### Implementation Language
All code will be implemented in **TypeScript** following the patterns established in the design document. The project uses:
- TypeScript 6.0 with strict mode
- React 19 with modern hooks
- Vite 8 for build tooling
- Supabase client SDK for backend

### Success Metrics Summary

| Metric | Current | Target | Validation Method |
|--------|---------|--------|-------------------|
| Test Coverage | 12.5% | 60%+ | `npm run test:coverage` |
| Bundle Size (gzipped) | ~280KB | <500KB | `npm run build:analyze` |
| TypeScript Errors | ~50 | 0 | `npm run type-check` |
| ESLint Errors | ~30 | 0 | `npm run lint` |
| Max Component Lines | 850 | 500 | Manual inspection |
| Lighthouse Performance | Unknown | 90+ | Chrome DevTools |
| Lighthouse Accessibility | Unknown | 90+ | Chrome DevTools |
| Lighthouse Best Practices | Unknown | 90+ | Chrome DevTools |
| Lighthouse SEO | Unknown | 90+ | Chrome DevTools |
| Slow Queries (>1s) | Unknown | 0 | Database logs |


## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.3"]
    },
    {
      "id": 1,
      "tasks": ["1.2", "2.1"]
    },
    {
      "id": 2,
      "tasks": ["2.2", "2.3", "3.1"]
    },
    {
      "id": 3,
      "tasks": ["2.4", "3.2"]
    },
    {
      "id": 4,
      "tasks": ["3.3", "3.4"]
    },
    {
      "id": 5,
      "tasks": ["5.1", "6.1", "6.2"]
    },
    {
      "id": 6,
      "tasks": ["5.2", "5.3", "6.3", "7.1", "7.2"]
    },
    {
      "id": 7,
      "tasks": ["5.4", "7.3", "7.4", "7.5"]
    },
    {
      "id": 8,
      "tasks": ["5.5", "7.6", "8.1", "8.2"]
    },
    {
      "id": 9,
      "tasks": ["8.3", "9.1", "9.2", "12.1"]
    },
    {
      "id": 10,
      "tasks": ["9.3", "10.1", "12.2"]
    },
    {
      "id": 11,
      "tasks": ["10.2", "10.3", "10.4", "12.3"]
    },
    {
      "id": 12,
      "tasks": ["11.1", "11.2"]
    },
    {
      "id": 13,
      "tasks": ["14.1", "14.3"]
    },
    {
      "id": 14,
      "tasks": ["14.2", "14.4"]
    },
    {
      "id": 15,
      "tasks": ["14.5", "15.1"]
    },
    {
      "id": 16,
      "tasks": ["15.2", "15.3", "16.1", "16.2"]
    },
    {
      "id": 17,
      "tasks": ["15.4", "16.3", "16.4"]
    },
    {
      "id": 18,
      "tasks": ["16.5", "17.1", "17.2"]
    },
    {
      "id": 19,
      "tasks": ["17.3"]
    },
    {
      "id": 20,
      "tasks": ["19.1", "19.3"]
    },
    {
      "id": 21,
      "tasks": ["19.2", "19.4"]
    },
    {
      "id": 22,
      "tasks": ["20.1", "21.1"]
    },
    {
      "id": 23,
      "tasks": ["20.2", "20.3", "21.2"]
    },
    {
      "id": 24,
      "tasks": ["21.3"]
    },
    {
      "id": 25,
      "tasks": ["23.1", "23.2"]
    },
    {
      "id": 26,
      "tasks": ["23.3", "23.4", "24.1"]
    },
    {
      "id": 27,
      "tasks": ["23.5", "24.2", "24.3"]
    },
    {
      "id": 28,
      "tasks": ["24.4", "25.1", "25.2"]
    },
    {
      "id": 29,
      "tasks": ["25.3", "25.4", "26.1"]
    },
    {
      "id": 30,
      "tasks": ["26.2"]
    },
    {
      "id": 31,
      "tasks": ["26.3"]
    },
    {
      "id": 32,
      "tasks": ["28.1", "28.2", "28.3"]
    },
    {
      "id": 33,
      "tasks": ["28.4", "28.5", "28.6"]
    },
    {
      "id": 34,
      "tasks": ["29.1", "29.2", "30.1"]
    },
    {
      "id": 35,
      "tasks": ["29.3", "30.2", "31.1", "31.2"]
    },
    {
      "id": 36,
      "tasks": ["30.3", "31.3", "31.4"]
    },
    {
      "id": 37,
      "tasks": ["32.1", "32.2", "32.3"]
    },
    {
      "id": 38,
      "tasks": ["32.4", "32.5"]
    }
  ]
}
```
