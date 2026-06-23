# Smoke Test Guide

## Overview

Smoke tests are fast, critical-path validation tests that verify the application's core functionality works correctly. They should complete in **under 30 seconds** to provide rapid feedback.

## What Smoke Tests Cover

### ✅ Core Functionality
- **Authentication**: Login with valid credentials
- **Dashboard**: Main dashboard loads without errors
- **Module Navigation**: All major modules are accessible
  - Pecuária (Livestock)
  - Financeiro (Finance)
  - Estoque (Inventory)
  - Compras (Purchases)
  - Vendas (Sales)
  - Frota (Fleet)
  - Mercado (Market)
  - Administração (Admin)
- **Logout**: Users can logout successfully
- **Auth Guards**: Protected routes redirect to login when not authenticated

### ❌ What Smoke Tests DON'T Cover
- Detailed business logic validation (use integration tests)
- Form submissions and data creation (use E2E flow tests)
- Edge cases and error handling (use unit/integration tests)
- Performance benchmarking (use performance tests)

## Running Smoke Tests

### Quick Run (Production Mode)
```bash
npm run test:e2e -- smoke.spec.ts
```

### With UI (Debug Mode)
```bash
npm run test:e2e:ui smoke.spec.ts
```

### Watch Mode (Development)
```bash
npx playwright test smoke.spec.ts --ui
```

## Test Architecture

### Shared Authentication Fixture

To keep tests fast, we use a shared authentication fixture that logs in once and reuses the session:

```typescript
const test = base.extend<{ authenticatedPage: typeof base }>({
  authenticatedPage: async ({ page }, use) => {
    // Login performed once per test
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/(painel)?$/, { timeout: 10000 });
    
    await use(page);
  },
});
```

### Test Structure

```typescript
test.describe('Smoke Test - Fluxos Críticos', () => {
  test.setTimeout(30000); // 30 second timeout
  
  test('deve realizar login', async ({ page }) => {
    // Tests login flow
  });
  
  test('deve navegar para módulo X', async ({ authenticatedPage: page }) => {
    // Uses pre-authenticated session
    await page.goto('/module-x');
    await expect(page).toHaveURL(/\/module-x/);
  });
});
```

## Performance Optimizations

### 1. Shared Authentication
- ✅ Login once per test (not 10+ times)
- ✅ Parallel execution where possible
- ✅ Reduces total test time by ~70%

### 2. Direct Navigation
- ✅ `page.goto('/module')` instead of UI clicks
- ✅ Faster and more reliable
- ✅ Reduces test flakiness

### 3. Minimal Assertions
- ✅ Check URL matches expected pattern
- ✅ Verify page loads (no 404)
- ❌ Don't check data loading or complex UI states

### 4. Reduced Timeouts
- ✅ 30s per test (default is 60s)
- ✅ Fast failure on issues
- ✅ Quick feedback loop

## Test Results Interpretation

### All Tests Pass ✅
System is healthy and ready for deployment.

### Some Tests Fail ❌
Critical path is broken. Investigate immediately:
1. Check which module failed
2. Review recent changes to that module
3. Run test in UI mode for visual debugging
4. Fix and re-run

### All Tests Skip ⏭️
No test credentials provided. Set environment variables:
```bash
E2E_TEST_EMAIL=test@tauze.com
E2E_TEST_PASSWORD=test123
```

## Best Practices

### DO ✅
- Keep tests focused on "happy path" scenarios
- Use direct navigation (`goto`) for speed
- Assert on critical elements only
- Run smoke tests before every deployment
- Run smoke tests in CI/CD pipeline

### DON'T ❌
- Test complex business logic (use integration tests)
- Create/modify data (use isolated E2E tests)
- Add long waits or timeouts
- Test edge cases (use unit tests)
- Skip smoke tests "because they're slow" (they should be fast!)

## Integration with CI/CD

Smoke tests run automatically on:
- Every pull request
- Every push to main/develop
- Before deployment to staging/production

Configuration: `.github/workflows/ci.yml`

```yaml
- name: Run Smoke Tests
  run: npm run test:e2e -- smoke.spec.ts
  env:
    E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
    E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
```

## Troubleshooting

### Tests timing out
- Check dev server is running
- Verify network is stable
- Reduce parallelization: `--workers=1`

### Tests flaky (pass/fail randomly)
- Increase specific timeout: `test.setTimeout(45000)`
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Check for race conditions in UI

### Tests skip with credentials set
- Verify env variables are actually loaded
- Check `.env` file exists and is formatted correctly
- Try hardcoding credentials temporarily to debug

## Maintenance

### When to Update Smoke Tests

1. **New major module added**: Add navigation test
2. **Routes change**: Update URL patterns
3. **Login flow changes**: Update authentication fixture
4. **Critical features added**: Consider if smoke test needed

### Review Frequency
- Weekly: Check test execution time (should be <30s)
- Monthly: Review coverage vs critical paths
- Per release: Verify all tests pass before deploying

## Related Documentation

- [E2E Tests README](./README.md) - Complete E2E testing guide
- [Playwright Config](../../playwright.config.ts) - Test configuration
- [CI/CD Pipeline](../../.github/workflows/ci.yml) - Automated testing setup
