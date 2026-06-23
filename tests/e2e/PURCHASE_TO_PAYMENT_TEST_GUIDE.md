# Quick Guide: Purchase-to-Payment E2E Test

## Overview

This E2E test validates the complete business flow from purchase order creation through payment processing, ensuring data consistency across Purchases, Inventory, and Accounts Payable modules.

## Quick Start (3 Steps)

### 1. Start Dev Server
```bash
npm run dev
```
Wait for server to be ready at `http://localhost:5173`

### 2. Set Test Credentials
```bash
# Windows CMD
set E2E_TEST_EMAIL=test@tauze.com
set E2E_TEST_PASSWORD=test123

# Windows PowerShell
$env:E2E_TEST_EMAIL="test@tauze.com"
$env:E2E_TEST_PASSWORD="test123"

# Linux/Mac
export E2E_TEST_EMAIL=test@tauze.com
export E2E_TEST_PASSWORD=test123
```

### 3. Run Test
```bash
npm run test:e2e -- tests/e2e/purchase-to-payment.spec.ts
```

## What Gets Tested

### Main Flow (175:3)
**Test**: `should complete full purchase-to-payment business flow`

```
1. Login → 2. Create Supplier → 3. Create Product → 4. Create Purchase Order
                                                                ↓
                                                    5. Verify Inventory Movement
                                                                ↓
6. Navigate to Accounts Payable → 7. Verify Account Created → 8. Process Payment
                                                                ↓
                                              9. Verify Status = PAGO
                                                                ↓
                                        10. Verify Data Consistency
```

**Expected Duration**: ~2.5 minutes

**Validates**:
- ✅ Purchase order creation
- ✅ Inventory automatic update (ENTRADA movement)
- ✅ Accounts payable generation
- ✅ Payment processing
- ✅ Status transition (PENDENTE → PAGO)
- ✅ Cross-module data consistency

### Edge Cases Suite

1. **Form Validation** (566:3)
   - Tests required field validation in purchase order form

2. **Double Payment Prevention** (587:3)
   - Ensures paid accounts cannot be paid again

3. **Status Filtering** (619:3)
   - Tests filtering payables by status

4. **Tab Navigation** (650:3)
   - Tests navigation between pending and paid tabs

## Test Data

Each test run creates unique data:
```typescript
Timestamp: 1737123456789
Supplier: "E2E Supplier 1737123456789"
Product: "E2E Product 1737123456789"
Order Number: "PO-1737123456789"
Amount: R$ 5.000,00
Quantity: 100 units
```

## Run Options

### Standard Run (headless)
```bash
npm run test:e2e -- tests/e2e/purchase-to-payment.spec.ts
```

### UI Mode (recommended for debugging)
```bash
npm run test:e2e:ui -- tests/e2e/purchase-to-payment.spec.ts
```
Opens interactive UI to:
- Watch tests execute
- See step-by-step progress
- Inspect failures
- Re-run specific tests

### Debug Mode (step-through)
```bash
npm run test:e2e:debug -- tests/e2e/purchase-to-payment.spec.ts
```
Opens browser and pauses at each step.

### Headed Mode (see browser)
```bash
npm run test:e2e -- tests/e2e/purchase-to-payment.spec.ts --headed
```

### Run Specific Test
```bash
# Main flow only
npm run test:e2e -- tests/e2e/purchase-to-payment.spec.ts -g "should complete full"

# Edge cases only
npm run test:e2e -- tests/e2e/purchase-to-payment.spec.ts -g "Edge Cases"

# Specific edge case
npm run test:e2e -- tests/e2e/purchase-to-payment.spec.ts -g "form validation"
```

## Troubleshooting

### ❌ Test Timeout: "waiting for locator('input[type=\"email\"]')"

**Cause**: Dev server not running or not accessible

**Solution**:
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Wait for "Local: http://localhost:5173" message, then run tests
npm run test:e2e -- tests/e2e/purchase-to-payment.spec.ts
```

### ❌ Test Timeout: "page.fill: Test timeout exceeded"

**Cause**: Test user doesn't exist or wrong credentials

**Solution**:
1. Create test user in Supabase Auth
2. Assign user to a tenant
3. Grant necessary permissions (Purchases, Inventory, Financial modules)
4. Update credentials:
   ```bash
   set E2E_TEST_EMAIL=your-test-user@example.com
   set E2E_TEST_PASSWORD=your-password
   ```

### ❌ "Cannot find supplier in list"

**Cause**: Supplier creation failed or search not working

**Solution**:
1. Run test with UI mode to see what's happening:
   ```bash
   npm run test:e2e:ui -- tests/e2e/purchase-to-payment.spec.ts
   ```
2. Check if supplier form fields match test expectations
3. Verify user has permission to create suppliers

### ❌ "Cannot find product in inventory"

**Cause**: Product creation failed or inventory not updating

**Solution**:
1. Check if user has permission to create products
2. Verify inventory movement is triggered by purchase
3. Check database constraints (RLS policies, foreign keys)

### ❌ "Payable account not found"

**Cause**: Purchase order didn't create payable account

**Solution**:
1. Check business logic: Does purchase order creation trigger payable?
2. Verify database triggers or application code
3. Check RLS policies on `contas_pagar` table

## Viewing Test Results

### After test completes:
```bash
npx playwright show-report
```

Opens HTML report with:
- Test execution timeline
- Screenshots of failures
- Video recordings
- Error traces
- Network activity

### Artifacts location:
```
test-results/
├── purchase-to-payment-{hash}/
│   ├── test-failed-1.png      # Screenshot at failure
│   ├── video.webm             # Full test video
│   └── error-context.md       # Error details
└── ...
```

## Performance Benchmarks

| Test | Expected Duration | Status |
|------|-------------------|--------|
| Main flow | ~2.5 minutes | ✅ Normal |
| Form validation | ~1 minute | ✅ Normal |
| Double payment | ~1 minute | ✅ Normal |
| Status filtering | ~1 minute | ✅ Normal |
| Tab navigation | ~1 minute | ✅ Normal |

**Total Suite**: ~7-8 minutes

Slower than expected? Check:
- Network latency
- Database query performance
- Server response times

## Integration with CI

### GitHub Actions Example
```yaml
- name: Run Purchase-to-Payment E2E Test
  run: npm run test:e2e -- tests/e2e/purchase-to-payment.spec.ts
  env:
    E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
    E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
```

## Test Maintenance

### When to update this test:

1. **UI Changes**: If purchase form, inventory UI, or payables UI changes
2. **Business Logic**: If purchase→inventory→payable flow changes
3. **Status Values**: If status names change (PENDENTE, PAGO)
4. **Navigation**: If module routes change
5. **Permissions**: If access control changes

### Key test files:
- `tests/e2e/purchase-to-payment.spec.ts` - Main test file
- `playwright.config.ts` - Playwright configuration
- `.env` or environment variables - Test credentials

## Success Criteria

Test passes when:
✅ All test steps complete without timeout  
✅ Purchase order created successfully  
✅ Inventory movement appears with correct quantity  
✅ Payable account created with correct amount  
✅ Payment processed successfully  
✅ Status changed to PAGO  
✅ Data consistent across all modules  

## Need Help?

1. **Check logs**: Console output shows step-by-step progress
2. **Use UI mode**: See what's happening visually
3. **Check artifacts**: Screenshots and videos show failure point
4. **Review code**: Test file has detailed comments
5. **Check database**: Verify data was actually created

## Related Tests

- `tests/e2e/smoke.spec.ts` - Basic smoke tests (faster, simpler)
- `tests/e2e/login.spec.ts` - Authentication tests
- `tests/e2e/purchase-flow.spec.ts` - Purchase-only flow tests

---

**Quick Command Reference**:
```bash
# Start server
npm run dev

# Set credentials
set E2E_TEST_EMAIL=test@tauze.com
set E2E_TEST_PASSWORD=test123

# Run test
npm run test:e2e -- tests/e2e/purchase-to-payment.spec.ts

# Debug
npm run test:e2e:ui -- tests/e2e/purchase-to-payment.spec.ts
```

That's it! 🎉
