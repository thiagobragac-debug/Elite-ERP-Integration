# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: purchase-to-payment.spec.ts >> Purchase-to-Payment Flow - Edge Cases >> should filter payables by status
- Location: tests\e2e\purchase-to-payment.spec.ts:619:3

# Error details

```
Test timeout of 60000ms exceeded while running "beforeEach" hook.
```

```
Error: page.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

```

# Test source

```ts
  460 |           statusFound = await paidStatus.isVisible({ timeout: 2000 }).catch(() => false);
  461 |         }
  462 |       }
  463 |       
  464 |       // Verify account exists with PAGO status
  465 |       await expect(page.locator(`text=${testSupplierName}`)).toBeVisible({ timeout: 5000 });
  466 |       await expect(page.locator('text=/pago|paid|quitado/i').first()).toBeVisible({ timeout: 5000 });
  467 |       
  468 |       console.log('✓ Status changed: PENDENTE → PAGO');
  469 |     });
  470 | 
  471 |     // ========================================
  472 |     // STEP 11: Verify Data Consistency Across Modules
  473 |     // ========================================
  474 |     await test.step('11. Verify data consistency and linkage', async () => {
  475 |       // Go back to purchase orders to verify status
  476 |       await page.click('text=Compras');
  477 |       await page.waitForTimeout(500);
  478 |       await page.click('text=Pedido');
  479 |       await page.waitForLoadState('networkidle');
  480 |       
  481 |       // Search for the created purchase order
  482 |       const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"]').first();
  483 |       if (await searchInput.isVisible().catch(() => false)) {
  484 |         await searchInput.clear();
  485 |         await searchInput.fill(testOrderNumber);
  486 |         await page.waitForTimeout(1500);
  487 |       }
  488 |       
  489 |       // Verify purchase order still exists
  490 |       await expect(page.locator(`text=${testOrderNumber}`)).toBeVisible({ timeout: 5000 });
  491 |       await expect(page.locator(`text=${testSupplierName}`)).toBeVisible({ timeout: 5000 });
  492 |       
  493 |       console.log('✓ Purchase order data consistent');
  494 |       
  495 |       // Verify inventory still shows the movement
  496 |       await page.click('text=Estoque');
  497 |       await page.waitForTimeout(500);
  498 |       await page.click('text=Movimentação');
  499 |       await page.waitForLoadState('networkidle');
  500 |       
  501 |       const invSearch = page.locator('input[type="search"], input[placeholder*="buscar"]').first();
  502 |       if (await invSearch.isVisible().catch(() => false)) {
  503 |         await invSearch.clear();
  504 |         await invSearch.fill(testProductName);
  505 |         await page.waitForTimeout(1500);
  506 |       }
  507 |       
  508 |       // Movement should still exist
  509 |       await expect(page.locator(`text=${testProductName}`)).toBeVisible({ timeout: 5000 });
  510 |       await expect(page.locator('text=/entrada|in/i')).toBeVisible({ timeout: 5000 });
  511 |       
  512 |       console.log('✓ Inventory movement data consistent');
  513 |       console.log('✅ COMPLETE FLOW VALIDATED SUCCESSFULLY!');
  514 |     });
  515 |   });
  516 | 
  517 |   test('should handle payment processing with partial amounts', async ({ page }) => {
  518 |     // This test validates partial payment scenarios
  519 |     await test.step('Create minimal purchase for partial payment test', async () => {
  520 |       // Create a simple purchase order
  521 |       await page.click('text=Compras');
  522 |       await page.waitForTimeout(500);
  523 |       await page.click('text=Pedido');
  524 |       await page.waitForLoadState('networkidle');
  525 |       
  526 |       // Verify page loaded
  527 |       await expect(page.locator('h1, h2')).toContainText(/pedido|compra/i);
  528 |       console.log('✓ Partial payment test setup complete');
  529 |     });
  530 |   });
  531 | 
  532 |   test('should validate purchase order links to correct payable account', async ({ page }) => {
  533 |     // This test validates referential integrity between purchase and payable
  534 |     await test.step('Verify purchase-payable linkage', async () => {
  535 |       // Navigate to purchases
  536 |       await page.click('text=Compras');
  537 |       await page.waitForTimeout(500);
  538 |       await page.click('text=Pedido');
  539 |       await page.waitForLoadState('networkidle');
  540 |       
  541 |       // Verify page loaded
  542 |       await expect(page.locator('h1, h2')).toContainText(/pedido|compra/i);
  543 |       console.log('✓ Purchase-payable linkage test setup complete');
  544 |     });
  545 |   });
  546 | });
  547 | 
  548 | /**
  549 |  * Edge Cases and Error Handling
  550 |  */
  551 | test.describe('Purchase-to-Payment Flow - Edge Cases', () => {
  552 |   test.beforeEach(async ({ page }) => {
  553 |     // Set longer timeout
  554 |     test.setTimeout(60000); // 1 minute for edge case tests
  555 |     
  556 |     // Login
  557 |     await page.goto('/login');
  558 |     const testEmail = process.env.E2E_TEST_EMAIL || 'test@tauze.com';
  559 |     const testPassword = process.env.E2E_TEST_PASSWORD || 'test123';
> 560 |     await page.fill('input[type="email"]', testEmail);
      |                ^ Error: page.fill: Test timeout of 60000ms exceeded.
  561 |     await page.fill('input[type="password"]', testPassword);
  562 |     await page.getByRole('button', { name: /entrar/i }).click();
  563 |     await page.waitForURL(/\/(painel|dashboard)?/, { timeout: 15000 });
  564 |   });
  565 | 
  566 |   test('should validate required fields in purchase order form', async ({ page }) => {
  567 |     await page.click('text=Compras');
  568 |     await page.waitForTimeout(500);
  569 |     await page.click('text=Pedido');
  570 |     await page.waitForLoadState('networkidle');
  571 |     
  572 |     // Open new purchase form
  573 |     const newBtn = page.getByRole('button', { name: /novo|adicionar|criar/i }).first();
  574 |     await newBtn.click();
  575 |     await page.waitForTimeout(500);
  576 |     
  577 |     // Try to save without filling required fields
  578 |     await page.getByRole('button', { name: /salvar|confirmar/i }).first().click();
  579 |     
  580 |     // Verify validation messages appear
  581 |     const validationMsg = page.locator('text=/obrigatório|required|preencha/i, [class*="error"], [class*="invalid"]');
  582 |     await expect(validationMsg.first()).toBeVisible({ timeout: 3000 });
  583 |     
  584 |     console.log('✓ Form validation working correctly');
  585 |   });
  586 | 
  587 |   test('should handle double payment prevention', async ({ page }) => {
  588 |     // Navigate to accounts payable
  589 |     await page.click('text=Financeiro');
  590 |     await page.waitForTimeout(500);
  591 |     await page.click('text=Pagar');
  592 |     await page.waitForLoadState('networkidle');
  593 |     
  594 |     // Look for any paid account
  595 |     const paidTab = page.getByRole('button', { name: /pago|quitado|paid/i });
  596 |     if (await paidTab.isVisible({ timeout: 2000 }).catch(() => false)) {
  597 |       await paidTab.click();
  598 |       await page.waitForTimeout(1000);
  599 |       
  600 |       // Try to find a paid account
  601 |       const paidAccount = page.locator('text=/pago|paid/i').first();
  602 |       if (await paidAccount.isVisible().catch(() => false)) {
  603 |         // Paid accounts should not have a "Pay" button available
  604 |         const accountRow = paidAccount.locator('..').locator('..');
  605 |         const payButton = accountRow.getByRole('button', { name: /pagar|pay/i });
  606 |         
  607 |         // Button should not exist or be disabled
  608 |         const buttonExists = await payButton.isVisible({ timeout: 1000 }).catch(() => false);
  609 |         if (buttonExists) {
  610 |           const isDisabled = await payButton.isDisabled();
  611 |           expect(isDisabled).toBeTruthy();
  612 |         }
  613 |         
  614 |         console.log('✓ Double payment prevention working');
  615 |       }
  616 |     }
  617 |   });
  618 | 
  619 |   test('should filter payables by status', async ({ page }) => {
  620 |     await page.click('text=Financeiro');
  621 |     await page.waitForTimeout(500);
  622 |     await page.click('text=Pagar');
  623 |     await page.waitForLoadState('networkidle');
  624 |     
  625 |     // Look for filter button
  626 |     const filterBtn = page.getByRole('button', { name: /filtro|filter/i });
  627 |     if (await filterBtn.isVisible().catch(() => false)) {
  628 |       await filterBtn.click();
  629 |       await page.waitForTimeout(500);
  630 |       
  631 |       // Select a status filter
  632 |       const statusSelect = page.locator('select[name="status"]');
  633 |       if (await statusSelect.isVisible().catch(() => false)) {
  634 |         await statusSelect.selectOption({ index: 1 });
  635 |         
  636 |         // Apply filter
  637 |         const applyBtn = page.getByRole('button', { name: /aplicar|filtrar|apply/i });
  638 |         if (await applyBtn.isVisible().catch(() => false)) {
  639 |           await applyBtn.click();
  640 |           await page.waitForTimeout(1000);
  641 |         }
  642 |       }
  643 |     }
  644 |     
  645 |     // Verify no errors
  646 |     await expect(page.locator('body')).not.toContainText(/erro|error/i);
  647 |     console.log('✓ Status filtering working');
  648 |   });
  649 | 
  650 |   test('should navigate between pending and paid tabs', async ({ page }) => {
  651 |     await page.click('text=Financeiro');
  652 |     await page.waitForTimeout(500);
  653 |     await page.click('text=Pagar');
  654 |     await page.waitForLoadState('networkidle');
  655 |     
  656 |     // Find tabs
  657 |     const pendingTab = page.getByRole('button', { name: /pendente|aberto|pending|open/i });
  658 |     const paidTab = page.getByRole('button', { name: /pago|quitado|paid|history/i });
  659 |     
  660 |     // Try switching tabs
```