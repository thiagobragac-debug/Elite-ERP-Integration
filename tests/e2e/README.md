# E2E Tests - Purchase-to-Payment Flow

## Overview

This directory contains end-to-end tests for the Tauze ERP system, focusing on critical business flows. The **purchase-to-payment** test validates the complete workflow from creating a purchase order to processing payment, ensuring data consistency across all modules.

## Test Coverage

### Main Flow Test (`purchase-to-payment.spec.ts`)

**Validates: Requirements 4.6**

The complete purchase-to-payment flow test covers:

1. **Login & Authentication**
   - Test user authentication
   - Dashboard navigation

2. **Purchase Order Creation**
   - Navigate to Purchases module
   - Create test supplier
   - Create test product/inventory item
   - Create purchase order with items
   - Verify purchase order appears in list

3. **Inventory Validation**
   - Navigate to Inventory → Movements
   - Verify ENTRADA (incoming) movement created
   - Verify quantity matches purchase order
   - Verify inventory balance updated correctly

4. **Accounts Payable Verification**
   - Navigate to Financeiro → Contas a Pagar
   - Verify payable account created for supplier
   - Verify amount matches purchase order
   - Verify initial status is PENDENTE (pending)

5. **Payment Processing**
   - Process payment for the account
   - Fill payment form (date, method)
   - Submit payment

6. **Status Verification**
   - Verify account status changed to PAGO (paid)
   - Verify payment appears in history/paid tab

7. **Data Consistency**
   - Verify purchase order still exists
   - Verify inventory movement persists
   - Verify all data linked correctly

### Edge Case Tests

The test suite also includes edge case validation:

- **Form Validation**: Required fields, error messages
- **Double Payment Prevention**: Cannot pay already paid accounts
- **Status Filtering**: Filter accounts by status (pending/paid)
- **Tab Navigation**: Navigate between pending and paid tabs
- **Partial Payments**: Handle partial payment amounts (placeholder)
- **Referential Integrity**: Verify purchase-payable linkage (placeholder)

## Running the Tests

### Prerequisites

1. **Install Playwright browsers** (if not already installed):
   ```powershell
   npx playwright install
   ```

2. **Configure test credentials**:
   
   Set environment variables for test user credentials:
   ```powershell
   # PowerShell
   $env:E2E_TEST_EMAIL = "your-test-user@tauze.com"
   $env:E2E_TEST_PASSWORD = "your-test-password"
   ```
   
   Or create a `.env.test` file:
   ```env
   E2E_TEST_EMAIL=your-test-user@tauze.com
   E2E_TEST_PASSWORD=your-test-password
   ```

3. **Ensure dev server is running**:
   ```powershell
   npm run dev
   ```

### Run Commands

#### Run all E2E tests:
```powershell
npm run test:e2e
```

#### Run only purchase-to-payment tests:
```powershell
npm run test:e2e -- purchase-to-payment.spec.ts
```

#### Run with UI mode (interactive debugging):
```powershell
npm run test:e2e:ui
```

#### Run in debug mode (step through tests):
```powershell
npm run test:e2e:debug
```

#### Run specific test by name:
```powershell
npx playwright test --grep "should complete full purchase-to-payment"
```

#### Generate test report:
```powershell
npx playwright show-report
```

## Test Architecture

### Authentication Pattern

Tests use a **fixture-based authentication** pattern to optimize performance:

```typescript
// Extend test with authenticated context
const test = base.extend<{ authenticatedPage: typeof base }>({
  authenticatedPage: async ({ page }, use) => {
    // Perform login once
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/(painel)?$/, { timeout: 10000 });
    
    await use(page);
  },
});
```

**Benefits:**
- Login happens once per test
- Faster test execution
- Shared authentication state
- Automatic test skipping if credentials missing

### Test Data Generation

Each test run generates **unique test data** to avoid conflicts:

```typescript
testTimestamp = Date.now();
testSupplierName = `E2E Supplier ${testTimestamp}`;
testProductName = `E2E Product ${testTimestamp}`;
testOrderNumber = `PO-${testTimestamp}`;
```

This ensures:
- No data collisions between parallel test runs
- Clean test isolation
- Repeatable test execution

### Helper Functions

The test includes reusable helper functions:

- `createTestSupplier(page, supplierName)` - Creates a test supplier
- `createTestProduct(page, productName)` - Creates a test product
- `getInventoryQuantity(page, productName)` - Retrieves current inventory quantity

These helpers encapsulate common operations and make tests more maintainable.

## Test Structure

### Test Steps

Each major test uses `test.step()` for better reporting:

```typescript
await test.step('1. Create test supplier', async () => {
  await createTestSupplier(page, testSupplierName);
  console.log(`✓ Supplier created: ${testSupplierName}`);
});
```

**Benefits:**
- Clear test progress in reports
- Easier debugging
- Better failure isolation

### Assertions

Tests use Playwright's built-in assertions:

```typescript
// Wait for element to be visible
await expect(page.locator(`text=${testSupplierName}`)).toBeVisible({ timeout: 5000 });

// Verify URL
await expect(page).toHaveURL(/\/financeiro\/contas-pagar/);

// Verify text content
await expect(accountRow).toContainText(/pendente|aberto|pending/i);
```

### Locator Strategies

Tests use multiple locator strategies for robustness:

1. **Role-based locators** (preferred):
   ```typescript
   page.getByRole('button', { name: /novo|adicionar|criar/i })
   ```

2. **Text-based locators**:
   ```typescript
   page.locator(`text=${testSupplierName}`)
   ```

3. **Attribute-based locators**:
   ```typescript
   page.locator('input[name="valor_total"]')
   ```

4. **CSS selectors** (fallback):
   ```typescript
   page.locator('h1, h2, [class*="title"]')
   ```

## Timeouts

Different timeout configurations for different test types:

- **Smoke tests**: 30 seconds (fast, simple checks)
- **Edge case tests**: 60 seconds (moderate complexity)
- **Complex flow tests**: 120 seconds (multiple steps, data setup)

Timeouts can be customized per test:

```typescript
test.setTimeout(120000); // 2 minutes
```

## Debugging

### View Test Execution

Run tests with headed browser to see what's happening:

```powershell
npx playwright test --headed purchase-to-payment.spec.ts
```

### Slow Motion

Add delays between actions for easier observation:

```powershell
npx playwright test --headed --slow-mo=1000
```

### Screenshot and Video on Failure

Configured automatically in `playwright.config.ts`:

- Screenshots saved on failure
- Videos saved on failure
- Traces captured on first retry

Find artifacts in `test-results/` directory.

### Debug Mode

Use Playwright Inspector for step-by-step debugging:

```powershell
npm run test:e2e:debug -- purchase-to-payment.spec.ts
```

## CI/CD Integration

### GitHub Actions

The tests are configured to run in CI with:

- Retry on failure (2 retries)
- Single worker (sequential execution)
- GitHub reporter for inline annotations
- Artifact upload for failed tests

### Environment Variables in CI

Set secrets in GitHub Actions:

```yaml
env:
  E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
  E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
```

## Troubleshooting

### Tests Skip Automatically

**Issue**: Tests show as "skipped"

**Solution**: Set `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` environment variables

### Login Fails

**Issue**: Cannot find login input fields

**Solutions**:
1. Verify dev server is running (`npm run dev`)
2. Check baseURL in `playwright.config.ts` matches dev server
3. Verify test credentials are valid

### Timeout Errors

**Issue**: Tests timeout waiting for elements

**Solutions**:
1. Increase timeout: `test.setTimeout(180000)` // 3 minutes
2. Verify selectors match current UI
3. Check for loading states that block interactions

### Element Not Found

**Issue**: Locator cannot find element

**Solutions**:
1. Run with headed mode to see UI: `--headed`
2. Use Playwright Inspector: `npm run test:e2e:debug`
3. Check if element uses different text/attributes
4. Add wait for visibility: `await element.waitFor({ state: 'visible' })`

### Data Already Exists

**Issue**: Supplier/product already exists from previous run

**Solution**: Test data is timestamped and should be unique. If issue persists, clear test data or use different test database.

## Best Practices

1. **Keep tests independent**: Each test should work in isolation
2. **Use meaningful test data**: Names like `E2E Supplier {timestamp}` are clear
3. **Add console logs**: Help with debugging failed CI runs
4. **Handle async properly**: Always await async operations
5. **Use appropriate locators**: Prefer role-based over CSS selectors
6. **Set reasonable timeouts**: Balance between flakiness and speed
7. **Clean up test data**: Consider cleanup in afterEach if needed
8. **Document edge cases**: Explain why edge case tests exist

## Future Enhancements

Potential improvements for the test suite:

- [ ] Add cleanup hook to remove test data after each run
- [ ] Implement test data seeding for consistent baseline
- [ ] Add visual regression testing with Percy or similar
- [ ] Expand partial payment test implementation
- [ ] Add performance metrics collection
- [ ] Implement parallel test execution strategies
- [ ] Add API-level data setup to speed up tests
- [ ] Create shared fixture for common test setup

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Design Document](../../.kiro/specs/system-improvements/design.md)
- [Requirements Document](../../.kiro/specs/system-improvements/requirements.md)
- [Task Plan](../../.kiro/specs/system-improvements/tasks.md)

## Support

For issues or questions:
1. Check this README first
2. Review Playwright documentation
3. Check test failures in `test-results/` directory
4. Review console logs in test output
5. Use debug mode to step through test execution

---

**Last Updated**: Task 11.2 - E2E Test for Complete Purchase-to-Payment Flow
**Validates**: Requirements 4.6
