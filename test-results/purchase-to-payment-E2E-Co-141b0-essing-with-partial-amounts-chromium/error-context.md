# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: purchase-to-payment.spec.ts >> E2E: Complete Purchase-to-Payment Flow >> should handle payment processing with partial amounts
- Location: tests\e2e\purchase-to-payment.spec.ts:517:3

# Error details

```
Test timeout of 120000ms exceeded while running "beforeEach" hook.
```

```
Error: page.fill: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * E2E Test - Complete Purchase-to-Payment Flow
  5   |  * 
  6   |  * **Validates: Requirements 4.6**
  7   |  * 
  8   |  * This test validates the complete business flow from purchase creation
  9   |  * through payment processing, ensuring data consistency across modules:
  10  |  * 
  11  |  * Flow:
  12  |  * 1. Login as test user
  13  |  * 2. Navigate to Purchases module
  14  |  * 3. Create new purchase order
  15  |  * 4. Verify inventory updated (Stock movement created)
  16  |  * 5. Navigate to Accounts Payable
  17  |  * 6. Process payment for the purchase
  18  |  * 7. Verify status changes (PENDENTE → PAGO)
  19  |  * 8. Verify data consistency across all modules
  20  |  * 
  21  |  * Critical Validations:
  22  |  * - Purchase order creation triggers inventory movement
  23  |  * - Purchase order creates corresponding payable account
  24  |  * - Payment processing updates account status
  25  |  * - All data remains consistent and linked across modules
  26  |  */
  27  | 
  28  | test.describe('E2E: Complete Purchase-to-Payment Flow', () => {
  29  |   // Test data with unique identifiers
  30  |   let testTimestamp: number;
  31  |   let testSupplierName: string;
  32  |   let testProductName: string;
  33  |   let testOrderNumber: string;
  34  |   let testPurchaseAmount: number;
  35  |   let testQuantity: number;
  36  | 
  37  |   test.beforeEach(async ({ page }) => {
  38  |     // Set longer timeout for complex flow setup
  39  |     test.setTimeout(120000); // 2 minutes for complex E2E flows
  40  |     
  41  |     // Generate unique test data for each run
  42  |     testTimestamp = Date.now();
  43  |     testSupplierName = `E2E Supplier ${testTimestamp}`;
  44  |     testProductName = `E2E Product ${testTimestamp}`;
  45  |     testOrderNumber = `PO-${testTimestamp}`;
  46  |     testPurchaseAmount = 5000.00;
  47  |     testQuantity = 100;
  48  | 
  49  |     // Navigate to login page
  50  |     await page.goto('/login');
  51  |     
  52  |     // Use test credentials from environment variables
  53  |     const testEmail = process.env.E2E_TEST_EMAIL || 'test@tauze.com';
  54  |     const testPassword = process.env.E2E_TEST_PASSWORD || 'test123';
  55  |     
  56  |     // Login
> 57  |     await page.fill('input[type="email"]', testEmail);
      |                ^ Error: page.fill: Test timeout of 120000ms exceeded.
  58  |     await page.fill('input[type="password"]', testPassword);
  59  |     await page.getByRole('button', { name: /entrar/i }).click();
  60  |     
  61  |     // Wait for successful login and dashboard load
  62  |     await page.waitForURL(/\/(painel|dashboard)?/, { timeout: 15000 });
  63  |     await page.waitForLoadState('networkidle');
  64  |   });
  65  | 
  66  |   /**
  67  |    * Helper: Create test supplier
  68  |    */
  69  |   async function createTestSupplier(page: Page, supplierName: string): Promise<void> {
  70  |     // Navigate to Purchases → Suppliers
  71  |     await page.click('text=Compras');
  72  |     await page.waitForTimeout(500);
  73  |     await page.click('text=Fornecedores');
  74  |     await page.waitForLoadState('networkidle');
  75  |     
  76  |     // Verify suppliers page loaded
  77  |     await expect(page.locator('h1, h2, [class*="title"]')).toContainText(/fornecedor/i);
  78  |     
  79  |     // Click new supplier button
  80  |     const newSupplierBtn = page.getByRole('button', { name: /novo|adicionar|criar/i }).first();
  81  |     await newSupplierBtn.click();
  82  |     await page.waitForTimeout(500);
  83  |     
  84  |     // Fill supplier form
  85  |     await page.fill('input[name="nome"]', supplierName);
  86  |     
  87  |     // Fill CNPJ if field exists
  88  |     const cnpjInput = page.locator('input[name="cnpj"]');
  89  |     if (await cnpjInput.isVisible().catch(() => false)) {
  90  |       await cnpjInput.fill('12.345.678/0001-90');
  91  |     }
  92  |     
  93  |     // Fill email if field exists
  94  |     const emailInput = page.locator('input[name="email"]');
  95  |     if (await emailInput.isVisible().catch(() => false)) {
  96  |       await emailInput.fill(`supplier${testTimestamp}@test.com`);
  97  |     }
  98  |     
  99  |     // Save supplier
  100 |     await page.getByRole('button', { name: /salvar|confirmar/i }).click();
  101 |     await page.waitForTimeout(1500);
  102 |     
  103 |     // Verify supplier appears in list
  104 |     await expect(page.locator(`text=${supplierName}`)).toBeVisible({ timeout: 5000 });
  105 |   }
  106 | 
  107 |   /**
  108 |    * Helper: Create test product/inventory item
  109 |    */
  110 |   async function createTestProduct(page: Page, productName: string): Promise<void> {
  111 |     // Navigate to Inventory → Products/Items
  112 |     await page.click('text=Estoque');
  113 |     await page.waitForTimeout(500);
  114 |     await page.click('text=Insumo');
  115 |     await page.waitForLoadState('networkidle');
  116 |     
  117 |     // Verify inventory page loaded
  118 |     await expect(page.locator('h1, h2, [class*="title"]')).toContainText(/insumo|produto/i);
  119 |     
  120 |     // Click new product button
  121 |     const newProductBtn = page.getByRole('button', { name: /novo|adicionar|criar/i }).first();
  122 |     await newProductBtn.click();
  123 |     await page.waitForTimeout(500);
  124 |     
  125 |     // Fill product form
  126 |     await page.fill('input[name="nome"]', productName);
  127 |     
  128 |     // Select product type if field exists
  129 |     const typeSelect = page.locator('select[name="tipo"]');
  130 |     if (await typeSelect.isVisible().catch(() => false)) {
  131 |       await typeSelect.selectOption({ index: 0 });
  132 |     }
  133 |     
  134 |     // Fill unit if field exists
  135 |     const unitInput = page.locator('input[name="unidade"]');
  136 |     if (await unitInput.isVisible().catch(() => false)) {
  137 |       await unitInput.fill('KG');
  138 |     }
  139 |     
  140 |     // Save product
  141 |     await page.getByRole('button', { name: /salvar|confirmar/i }).click();
  142 |     await page.waitForTimeout(1500);
  143 |     
  144 |     // Verify product appears in list
  145 |     await expect(page.locator(`text=${productName}`)).toBeVisible({ timeout: 5000 });
  146 |   }
  147 | 
  148 |   /**
  149 |    * Helper: Get initial inventory quantity for a product
  150 |    */
  151 |   async function getInventoryQuantity(page: Page, productName: string): Promise<number> {
  152 |     // Navigate to Inventory → Items
  153 |     await page.click('text=Estoque');
  154 |     await page.waitForTimeout(500);
  155 |     await page.click('text=Insumo');
  156 |     await page.waitForLoadState('networkidle');
  157 |     
```