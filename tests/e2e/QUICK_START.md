# E2E Smoke Tests - Quick Start Guide

## 🚀 Run Tests in 3 Steps

### Step 1: Set Test Credentials
Create or update your `.env` file:
```bash
E2E_TEST_EMAIL=your-test-email@example.com
E2E_TEST_PASSWORD=your-test-password
```

**Important:** Use test database credentials, NOT production!

### Step 2: Run Smoke Tests
```bash
npm run test:e2e -- smoke.spec.ts
```

### Step 3: View Results
- ✅ All tests pass? You're good to go!
- ❌ Tests fail? Check the HTML report:
  ```bash
  npx playwright show-report
  ```

## 🎯 What Gets Tested

The smoke tests verify:
- ✅ Login works
- ✅ Dashboard loads
- ✅ All 8 modules are accessible (Pecuária, Financeiro, Estoque, etc.)
- ✅ Logout works
- ✅ Auth guards protect routes

**Time:** < 30 seconds total ⚡

## 🔧 Common Commands

```bash
# Run only smoke tests
npm run test:e2e -- smoke.spec.ts

# Run with visual UI (great for debugging)
npm run test:e2e:ui smoke.spec.ts

# Debug mode (step through tests)
npm run test:e2e:debug smoke.spec.ts

# Run specific test
npm run test:e2e -- smoke.spec.ts -g "login"

# List all tests without running
npm run test:e2e -- smoke.spec.ts --list
```

## ❓ Troubleshooting

### Tests skip immediately
**Problem:** No credentials provided  
**Solution:** Set `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` in `.env`

### "Server not ready" error
**Problem:** Dev server not starting  
**Solution:** 
1. Check port 5173 is available
2. Verify `npm run dev` works manually
3. Check `.env` has Supabase credentials

### Tests timeout
**Problem:** Application loading slowly  
**Solution:**
1. Check network connection
2. Verify database is accessible
3. Run with `--workers=1` for slower machines

### Need more help?
- 📖 [Complete E2E Guide](./README.md)
- 📖 [Smoke Test Guide](./SMOKE_TEST_GUIDE.md)
- 📖 [Task Completion Summary](../../TASK_11.1_COMPLETION_SUMMARY.md)

## 🎓 For CI/CD

Tests automatically run in GitHub Actions. No manual setup needed!

To run locally like CI:
```bash
CI=true npm run test:e2e -- smoke.spec.ts
```

This enables:
- Retry on failure (2x)
- Single worker (sequential execution)
- Video/screenshot on failure

## 📊 Expected Output

```
Running 12 tests using 1 worker

  ✓  1 smoke.spec.ts:48:3 › deve realizar login (3.2s)
  ✓  2 smoke.spec.ts:73:3 › deve navegar para Pecuária (1.8s)
  ✓  3 smoke.spec.ts:82:3 › deve navegar para Financeiro (1.6s)
  ✓  4 smoke.spec.ts:91:3 › deve navegar para Estoque (1.7s)
  ✓  5 smoke.spec.ts:100:3 › deve navegar para Compras (1.5s)
  ✓  6 smoke.spec.ts:109:3 › deve navegar para Vendas (1.6s)
  ✓  7 smoke.spec.ts:118:3 › deve navegar para Frota (1.7s)
  ✓  8 smoke.spec.ts:127:3 › deve navegar para Mercado (1.8s)
  ✓  9 smoke.spec.ts:136:3 › deve navegar para Admin (1.5s)
  ✓ 10 smoke.spec.ts:144:3 › deve realizar logout (2.8s)
  ✓ 11 smoke.spec.ts:176:3 › deve redirecionar login (1.2s)
  ✓ 12 smoke.spec.ts:185:3 › landing page (1.1s)

  12 passed (23.5s)
```

Total time: ~25 seconds ✅ (under 30s target)
