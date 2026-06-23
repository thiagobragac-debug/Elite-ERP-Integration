# Requirements Document - System Improvements

## Introduction

Este documento especifica os requisitos para um conjunto abrangente de melhorias no Tauze ERP v5.0, um sistema SaaS multi-tenant para gestão agropecuária. As melhorias abrangem segurança crítica, qualidade de código, performance, testes, monitoramento e developer experience. O objetivo é transformar o sistema em uma plataforma mais segura, testável, performática e manutenível.

**Contexto do Sistema:**
- Stack: React 19, TypeScript, Vite 8, Supabase (PostgreSQL + Auth + Storage)
- Arquitetura: Multi-tenant com Row Level Security (RLS)
- Módulos: Pecuária, Financeiro, Estoque, Frota, Compras, Vendas, Mercado, Admin
- Estado Atual: 257 arquivos React/TypeScript, 32 testes (12.5% cobertura), bundle ~850KB

## Glossary

- **System**: O Tauze ERP v5.0 completo (frontend + backend + infraestrutura)
- **Security_Module**: Módulo responsável por segurança (autenticação, autorização, RLS, secrets)
- **Test_Suite**: Conjunto de testes automatizados (unit, integration, e2e)
- **Bundle**: Artefato JavaScript gerado pelo build (dist/)
- **CI_Pipeline**: Pipeline de integração contínua (GitHub Actions ou similar)
- **RLS_Policy**: Política de Row Level Security no PostgreSQL/Supabase
- **Developer**: Desenvolvedor que trabalha no codebase
- **Environment_Variable**: Variável de ambiente sensível (.env)
- **Tenant**: Empresa/organização cliente do sistema multi-tenant
- **Monitoring_Service**: Serviço de monitoramento (Sentry, Analytics, etc.)
- **PWA**: Progressive Web App (aplicação web offline-first)
- **Code_Quality_Tool**: Ferramenta de qualidade de código (ESLint, Prettier, TypeScript)

## Requirements

### Requirement 1: Segurança de Credenciais

**User Story:** Como administrador da plataforma, quero que credenciais sensíveis nunca sejam expostas no controle de versão, para que o sistema esteja protegido contra acessos não autorizados.

#### Acceptance Criteria

1. THE System SHALL remove the `.env` file from Git history permanently
2. THE System SHALL add `.env`, `.env.local`, and `.env.*.local` to `.gitignore`
3. WHEN the application starts, THE System SHALL validate all required environment variables before initialization
4. IF any required environment variable is missing, THEN THE System SHALL throw a descriptive error and halt execution
5. IF the validation step is skipped or bypassed, THEN THE System SHALL allow startup to proceed
6. THE Security_Module SHALL document all required environment variables in `.env.example`
7. THE System SHALL NOT log or expose environment variable values in error messages or logs

### Requirement 2: Rotação de Chaves Comprometidas

**User Story:** Como administrador de segurança, quero rotacionar todas as chaves expostas no Git, para que credenciais antigas não possam ser usadas maliciosamente.

#### Acceptance Criteria

1. THE Security_Module SHALL provide a checklist for rotating Supabase API keys
2. THE Security_Module SHALL provide a checklist for rotating Stripe API keys
3. THE Security_Module SHALL provide a checklist for rotating any other third-party API credentials
4. WHEN keys are rotated, THE System SHALL update the new keys in a secure secrets management system
5. THE System SHALL allow both old and new keys to work simultaneously for a grace period
6. IF the secrets management system update fails, THEN THE System SHALL allow rotation to complete
7. THE System SHALL verify that old keys are revoked after the grace period

### Requirement 3: Row Level Security Audit

**User Story:** Como arquiteto de segurança, quero garantir que todas as tabelas do banco tenham políticas RLS ativas, para que haja isolamento de dados entre tenants.

#### Acceptance Criteria

1. THE Security_Module SHALL identify all tables in the public schema without RLS enabled and report successful identification even when zero tables lack RLS
2. THE Security_Module SHALL verify that every query filters by `tenant_id`
3. THE Security_Module SHALL provide SQL scripts to enable RLS on tables without policies
4. THE System SHALL test tenant isolation by creating a test tenant and verifying data cannot be accessed by another tenant
5. THE Security_Module SHALL document all RLS policies in a centralized location

### Requirement 4: Test Coverage

**User Story:** Como desenvolvedor, quero aumentar a cobertura de testes de 12.5% para 60%, para que regressões sejam detectadas automaticamente.

#### Acceptance Criteria

1. THE Test_Suite SHALL achieve 60% or higher code coverage across all modules
2. THE Test_Suite SHALL prioritize coverage of critical modules: Financeiro, Pecuária, Estoque
3. THE Test_Suite SHALL include unit tests for all utility functions in `src/utils/` and fail the build IF any utility function lacks coverage
4. THE Test_Suite SHALL include integration tests for critical business flows (purchase → inventory → payment)
5. THE System SHALL fail the build IF test coverage drops below 60% OR IF any tests are failing
6. THE CI_Pipeline SHALL run tests on every pull request and block merge IF tests fail

### Requirement 5: Bundle Size Optimization

**User Story:** Como usuário em área rural com internet lenta, quero que a aplicação carregue rapidamente, para que eu possa trabalhar sem frustrações.

#### Acceptance Criteria

1. THE Bundle SHALL be smaller than 500KB when gzipped
2. THE System SHALL implement code splitting for all module pages (Pecuária, Financeiro, Estoque, etc.)
3. THE System SHALL lazy load all heavy libraries (Recharts, Leaflet) only when needed
4. THE System SHALL tree-shake lucide-react to import only used icons
5. THE System SHALL provide a bundle analysis report via `npm run build:analyze`
6. WHEN a user first loads the application, THE System SHALL load only the essential chunk (<200KB)

### Requirement 6: Component Refactoring

**User Story:** Como desenvolvedor, quero dividir componentes grandes (>500 linhas) em módulos menores, para que o código seja mais legível e testável.

#### Acceptance Criteria

1. THE System SHALL refactor all components with more than 500 lines into smaller modules
2. WHEN a component is refactored, THE System SHALL create a directory structure with `components/`, `hooks/`, and `types.ts`
3. THE System SHALL extract reusable logic into custom hooks
4. THE System SHALL prioritize refactoring: AccountsPayable, AccountsReceivable, AuditLog, SalesOrders
5. FOR ALL refactored components, THE Test_Suite SHALL maintain or improve existing test coverage

### Requirement 7: TypeScript Strict Mode

**User Story:** Como desenvolvedor, quero habilitar TypeScript strict mode, para que erros de tipo sejam detectados em tempo de compilação.

#### Acceptance Criteria

1. THE System SHALL enable `strict: true` in `tsconfig.json`
2. THE System SHALL enable `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, and `noUnusedParameters`
3. THE System SHALL fix all TypeScript errors before enabling strict mode
4. THE Code_Quality_Tool SHALL fail the build IF TypeScript errors exist
5. IF the code quality tool fails to run or is not configured, THEN THE System SHALL allow the build to proceed
6. THE CI_Pipeline SHALL run `tsc --noEmit` to validate types on every pull request

### Requirement 8: Dependency Management

**User Story:** Como administrador de segurança, quero atualizar todas as dependências vulneráveis, para que o sistema esteja protegido contra exploits conhecidos.

#### Acceptance Criteria

1. THE System SHALL update all outdated dependencies to their latest stable versions
2. THE System SHALL run `npm audit fix` to resolve security vulnerabilities and allow the process to continue IF some vulnerabilities remain unresolved
3. THE System SHALL configure Dependabot or Renovate for automated dependency updates
4. THE System SHALL establish a monthly dependency review policy
5. THE CI_Pipeline SHALL run `npm audit` and fail only IF critical vulnerabilities are found

### Requirement 9: PWA Offline Sync

**User Story:** Como usuário em área rural, quero registrar pesagens e abastecimentos offline, para que meu trabalho não seja interrompido por falta de conectividade.

#### Acceptance Criteria

1. WHEN the user is offline, THE PWA SHALL queue all create/update/delete operations in IndexedDB
2. WHEN the user comes back online, THE PWA SHALL automatically sync queued operations with the backend
3. THE PWA SHALL display a banner showing "Você está offline" with the number of pending operations
4. WHEN a sync operation fails, THE PWA SHALL retry with exponential backoff
5. WHEN the operations list is visible, THE PWA SHALL allow the user to manually retry or discard individual queued operations
6. THE PWA SHALL implement background sync for uploading animal photos

### Requirement 10: Error Monitoring

**User Story:** Como desenvolvedor, quero rastrear erros em produção automaticamente, para que bugs sejam identificados e corrigidos rapidamente.

#### Acceptance Criteria

1. THE Monitoring_Service SHALL integrate Sentry for error tracking
2. WHEN an error occurs in production, THE Monitoring_Service SHALL capture the error with full stack trace
3. THE Monitoring_Service SHALL enrich errors with context: tenant_id, user_id, user_role
4. THE Monitoring_Service SHALL capture 10% of all transactions for performance monitoring
5. THE Monitoring_Service SHALL capture 100% of errors with session replay
6. THE Monitoring_Service SHALL NOT capture obviously sensitive data fields such as passwords and tokens in error reports

### Requirement 11: Business Analytics

**User Story:** Como product manager, quero rastrear eventos de negócio, para que decisões de produto sejam baseadas em dados reais.

#### Acceptance Criteria

1. THE Monitoring_Service SHALL track critical business events: animal_registered, sale_completed, payment_received
2. THE Monitoring_Service SHALL track performance events: page_load_time, api_slow_response
3. THE Monitoring_Service SHALL integrate PostHog, Mixpanel, or Google Analytics 4
4. WHEN a user opts out of analytics tracking, THE System SHALL stop sending user data while maintaining the analytics platform integration
5. THE Monitoring_Service SHALL NOT track personally identifiable information without user consent

### Requirement 12: Code Quality Tools

**User Story:** Como desenvolvedor, quero ferramentas automatizadas de qualidade de código, para que o codebase mantenha padrões consistentes.

#### Acceptance Criteria

1. THE Code_Quality_Tool SHALL configure ESLint with rules for performance, accessibility, and code quality
2. THE Code_Quality_Tool SHALL configure Prettier for consistent code formatting independently of ESLint
3. THE Code_Quality_Tool SHALL add pre-commit hooks (Husky + lint-staged) to run linting and formatting
4. THE System SHALL provide `npm run lint:fix` to automatically fix linting errors
5. THE System SHALL provide `npm run format` to format all code files
6. THE CI_Pipeline SHALL fail IF linting or formatting violations exist in code files

### Requirement 13: CI/CD Pipeline

**User Story:** Como DevOps engineer, quero um pipeline automatizado, para que deploys sejam rápidos, seguros e consistentes.

#### Acceptance Criteria

1. THE CI_Pipeline SHALL run on every push and pull request
2. THE CI_Pipeline SHALL execute the following steps in order: lint, type-check, test, build
3. THE CI_Pipeline SHALL deploy to staging when code is merged to the `develop` branch
4. THE CI_Pipeline SHALL deploy to production when code is merged to the `main` branch
5. THE CI_Pipeline SHALL block deployment IF any step fails
6. THE CI_Pipeline SHALL notify the team of deployment success or failure

### Requirement 14: Database Performance

**User Story:** Como usuário, quero que consultas ao banco sejam rápidas, para que relatórios e listagens carreguem instantaneamente.

#### Acceptance Criteria

1. THE System SHALL add composite indexes for all slow queries identified via `EXPLAIN ANALYZE`
2. THE System SHALL create indexes on: `animais(tenant_id, status)`, `animais(fazenda_id, lote_id)`, `abastecimentos(tenant_id, data DESC)`
3. THE System SHALL create a partial index on `contas_pagar(tenant_id, data_vencimento) WHERE status != 'PAGO'`
4. THE System SHALL eliminate N+1 queries by using JOINs or batch loading
5. WHEN a query takes more than 1 second, THE System SHALL log a warning for investigation

### Requirement 15: Loading States

**User Story:** Como usuário, quero ver estados de carregamento informativos, para que eu saiba que a aplicação está funcionando.

#### Acceptance Criteria

1. THE System SHALL replace all text-based loading indicators ("Carregando módulo...") with skeleton loaders
2. THE System SHALL create a reusable `LoadingSkeleton` component
3. THE System SHALL use skeleton loaders that reflect the final UI structure
4. THE System SHALL display skeleton loaders for all lazy-loaded routes
5. THE System SHALL display loading spinners for all async operations (form submissions, data fetching)

### Requirement 16: Documentation

**User Story:** Como novo desenvolvedor, quero documentação clara, para que eu possa contribuir para o projeto rapidamente.

#### Acceptance Criteria

1. THE System SHALL provide an onboarding guide that allows new developers to set up the project in under 10 minutes
2. THE System SHALL document all architecture decisions in ADRs (Architecture Decision Records)
3. THE System SHALL document all API integrations (Supabase, Stripe, Cepea)
4. THE System SHALL provide a troubleshooting guide for common issues
5. THE System SHALL maintain an up-to-date README with setup instructions, scripts, and project structure

### Requirement 17: Web Vitals Monitoring

**User Story:** Como product manager, quero monitorar Core Web Vitals, para que a experiência do usuário seja otimizada.

#### Acceptance Criteria

1. THE Monitoring_Service SHALL track Core Web Vitals: LCP, FID, CLS
2. THE Monitoring_Service SHALL send Web Vitals data to analytics service
3. THE System SHALL achieve a Lighthouse score of 90+ for Performance, Accessibility, Best Practices, and SEO
4. WHEN current Web Vitals values exceed their thresholds, THE Monitoring_Service SHALL alert the team
5. THE System SHALL provide a dashboard showing Web Vitals trends over time

### Requirement 18: Image Optimization

**User Story:** Como usuário em área rural, quero fazer upload de fotos de animais rapidamente, para que não gaste muito tempo esperando.

#### Acceptance Criteria

1. WHEN a user uploads an image, THE System SHALL compress it client-side before upload
2. THE System SHALL limit image size to 0.5MB maximum after compression
3. THE System SHALL limit image dimensions to 1920px maximum width or height
4. THE System SHALL use a Web Worker for compression to avoid blocking the main thread
5. THE System SHALL show upload progress during compression and upload

### Requirement 19: Command Palette Enhancements

**User Story:** Como usuário avançado, quero executar ações rápidas via teclado, para que meu fluxo de trabalho seja mais eficiente.

#### Acceptance Criteria

1. THE System SHALL expand the Command Palette (Cmd+K) with additional actions
2. THE System SHALL support actions: "Registrar novo animal", "Lançar pagamento", "Ver dashboard", "Alternar fazenda", "Modo escuro/claro"
3. THE System SHALL allow searching for any action by keywords
4. THE System SHALL display keyboard shortcuts for each action
5. WHEN an action is chosen and execution succeeds, THE System SHALL execute it immediately; IF execution fails, THE System SHALL show an error message to the user

### Requirement 20: React Query Optimization

**User Story:** Como desenvolvedor, quero otimizar configurações do React Query, para que refetches desnecessários sejam evitados.

#### Acceptance Criteria

1. THE System SHALL configure React Query with `staleTime: 5 minutes` by default
2. THE System SHALL configure React Query with `cacheTime: 30 minutes` by default
3. THE System SHALL disable `refetchOnWindowFocus` in production only
4. THE System SHALL limit retries to 1 attempt instead of 3
5. THE System SHALL configure longer `staleTime` (1 hour) for market data (Cepea) that changes infrequently
6. THE System SHALL display React Query DevTools only in development mode

