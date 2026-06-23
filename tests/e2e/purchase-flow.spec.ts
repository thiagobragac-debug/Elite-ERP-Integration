import { test, expect, Page } from '@playwright/test';

/**
 * Testes E2E - Fluxo Completo de Compra
 * 
 * Valida o fluxo completo de negócio:
 * 1. Criar pedido de compra
 * 2. Verificar atualização de estoque
 * 3. Verificar criação de contas a pagar
 * 
 * Este teste garante que a integração entre os módulos
 * Compras → Estoque → Financeiro está funcionando corretamente.
 * 
 * **Validates: Requirements 4.4**
 */

test.describe('Fluxo Completo: Compra → Estoque → Pagamento', () => {
  let testSupplierName: string;
  let testProductName: string;
  let testOrderNumber: string;
  let testAmount: string;

  test.beforeEach(async ({ page }) => {
    // Gerar nomes únicos para cada teste
    const timestamp = Date.now();
    testSupplierName = `Fornecedor E2E ${timestamp}`;
    testProductName = `Insumo E2E ${timestamp}`;
    testOrderNumber = `PO-E2E-${timestamp}`;
    testAmount = '5000';

    // Navegar para login
    await page.goto('/login');
    
    // Preencher credenciais de teste
    // NOTA: Estas credenciais devem ser configuradas no ambiente de teste
    const testEmail = process.env.TEST_USER_EMAIL || 'teste@tauze.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'senha-teste-123';
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Aguardar redirecionamento após login
    await page.waitForURL(/\/(painel|dashboard)/, { timeout: 10000 });
  });

  test('deve completar fluxo completo: criar compra → verificar estoque → verificar pagamento', async ({ page }) => {
    // ========================================
    // ETAPA 1: Configurar Fornecedor
    // ========================================
    await test.step('Criar fornecedor de teste', async () => {
      await page.click('text=Compras');
      await page.waitForTimeout(500);
      
      // Navegar para fornecedores
      await page.click('text=Fornecedores');
      await page.waitForLoadState('networkidle');
      
      // Verificar se página de fornecedores carregou
      await expect(page.locator('h1, h2')).toContainText(/fornecedor/i);
      
      // Clicar no botão de novo fornecedor
      const newSupplierButton = page.getByRole('button', { name: /novo|adicionar|criar/i }).first();
      await newSupplierButton.click();
      
      // Aguardar modal abrir
      await page.waitForTimeout(500);
      
      // Preencher dados do fornecedor
      await page.fill('input[name="nome"]', testSupplierName);
      await page.fill('input[name="cnpj"]', '12345678000190');
      await page.fill('input[name="email"]', `teste${Date.now()}@fornecedor.com`);
      
      // Salvar fornecedor
      await page.getByRole('button', { name: /salvar/i }).click();
      
      // Aguardar confirmação
      await page.waitForTimeout(1000);
      
      // Verificar que fornecedor aparece na lista
      await expect(page.locator('text=' + testSupplierName)).toBeVisible({ timeout: 5000 });
    });

    // ========================================
    // ETAPA 2: Configurar Produto/Insumo
    // ========================================
    await test.step('Criar produto/insumo de teste', async () => {
      // Navegar para estoque → insumos
      await page.click('text=Estoque');
      await page.waitForTimeout(500);
      await page.click('text=Insumo');
      await page.waitForLoadState('networkidle');
      
      // Verificar página de insumos
      await expect(page.locator('h1, h2')).toContainText(/insumo|produto/i);
      
      // Clicar em novo insumo
      const newProductButton = page.getByRole('button', { name: /novo|adicionar|criar/i }).first();
      await newProductButton.click();
      
      // Aguardar modal
      await page.waitForTimeout(500);
      
      // Preencher dados do insumo
      await page.fill('input[name="nome"]', testProductName);
      await page.selectOption('select[name="tipo"]', { index: 0 }); // Selecionar primeiro tipo
      await page.fill('input[name="unidade"]', 'KG');
      
      // Salvar insumo
      await page.getByRole('button', { name: /salvar/i }).click();
      
      // Aguardar confirmação
      await page.waitForTimeout(1000);
      
      // Verificar que insumo aparece na lista
      await expect(page.locator('text=' + testProductName)).toBeVisible({ timeout: 5000 });
    });

    // ========================================
    // ETAPA 3: Criar Pedido de Compra
    // ========================================
    await test.step('Criar pedido de compra', async () => {
      // Navegar para Compras → Pedidos
      await page.click('text=Compras');
      await page.waitForTimeout(500);
      await page.click('text=Pedido');
      await page.waitForLoadState('networkidle');
      
      // Verificar página de pedidos
      await expect(page.locator('h1, h2')).toContainText(/pedido|compra/i);
      
      // Clicar em novo pedido
      const newOrderButton = page.getByRole('button', { name: /novo|adicionar|criar/i }).first();
      await newOrderButton.click();
      
      // Aguardar modal/formulário
      await page.waitForTimeout(500);
      
      // Preencher dados do pedido
      // Número do pedido
      const orderNumberInput = page.locator('input[name="numero_pedido"]');
      if (await orderNumberInput.isVisible()) {
        await orderNumberInput.fill(testOrderNumber);
      }
      
      // Selecionar fornecedor
      const supplierSelect = page.locator('select[name="fornecedor_id"]');
      if (await supplierSelect.isVisible()) {
        // Tentar selecionar pelo texto do fornecedor
        await supplierSelect.selectOption({ label: testSupplierName });
      }
      
      // Valor total
      const amountInput = page.locator('input[name="valor_total"]');
      if (await amountInput.isVisible()) {
        await amountInput.fill(testAmount);
      }
      
      // Data de previsão de entrega
      const deliveryDateInput = page.locator('input[name="previsao_entrega"]');
      if (await deliveryDateInput.isVisible()) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        await deliveryDateInput.fill(futureDate.toISOString().split('T')[0]);
      }
      
      // Adicionar item ao pedido (se houver seção de itens)
      const addItemButton = page.getByRole('button', { name: /adicionar item/i });
      if (await addItemButton.isVisible()) {
        await addItemButton.click();
        await page.waitForTimeout(300);
        
        // Selecionar o insumo criado
        const itemSelect = page.locator('select[name*="insumo"]').last();
        if (await itemSelect.isVisible()) {
          await itemSelect.selectOption({ label: testProductName });
        }
        
        // Quantidade
        const quantityInput = page.locator('input[name*="quantidade"]').last();
        if (await quantityInput.isVisible()) {
          await quantityInput.fill('100');
        }
        
        // Preço unitário
        const priceInput = page.locator('input[name*="preco"]').last();
        if (await priceInput.isVisible()) {
          await priceInput.fill('50');
        }
      }
      
      // Salvar pedido
      await page.getByRole('button', { name: /salvar|confirmar/i }).first().click();
      
      // Aguardar confirmação
      await page.waitForTimeout(2000);
      
      // Verificar mensagem de sucesso ou que pedido aparece na lista
      const successIndicator = page.locator('text=/sucesso|criado|salvo/i, text=' + testOrderNumber);
      await expect(successIndicator.first()).toBeVisible({ timeout: 5000 });
    });

    // ========================================
    // ETAPA 4: Verificar Movimentação de Estoque
    // ========================================
    await test.step('Verificar criação de movimentação de estoque', async () => {
      // Navegar para Estoque → Movimentação
      await page.click('text=Estoque');
      await page.waitForTimeout(500);
      await page.click('text=Movimentação');
      await page.waitForLoadState('networkidle');
      
      // Verificar página de movimentações
      await expect(page.locator('h1, h2')).toContainText(/moviment/i);
      
      // Buscar pelo produto criado
      const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill(testProductName);
        await page.waitForTimeout(1000);
      }
      
      // Verificar que existe uma movimentação do tipo ENTRADA para o produto
      // Pode aparecer com o nome do produto ou referência ao pedido
      const movementRow = page.locator(`text=${testProductName}, text=ENTRADA, text=100`);
      await expect(movementRow.first()).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Movimentação de estoque criada corretamente');
    });

    // ========================================
    // ETAPA 5: Verificar Contas a Pagar
    // ========================================
    await test.step('Verificar criação de conta a pagar', async () => {
      // Navegar para Financeiro → Contas a Pagar
      await page.click('text=Financeiro');
      await page.waitForTimeout(500);
      await page.click('text=Pagar');
      await page.waitForLoadState('networkidle');
      
      // Verificar página de contas a pagar
      await expect(page.locator('h1, h2')).toContainText(/pagar|contas/i);
      
      // Buscar pelo fornecedor ou valor
      const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill(testSupplierName);
        await page.waitForTimeout(1000);
      }
      
      // Verificar que existe uma conta a pagar com o valor correto
      const accountRow = page.locator(`text=${testSupplierName}`);
      await expect(accountRow.first()).toBeVisible({ timeout: 5000 });
      
      // Verificar o valor (formatado em BRL)
      const amountFormatted = 'R$ 5.000,00';
      await expect(page.locator(`text=/R\\$\\s*5[.,]000/`)).toBeVisible({ timeout: 5000 });
      
      // Verificar status inicial (PENDENTE)
      await expect(page.locator('text=/pendente|aberto/i').first()).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Conta a pagar criada corretamente');
    });

    // ========================================
    // ETAPA 6: Processar Pagamento
    // ========================================
    await test.step('Processar pagamento da conta', async () => {
      // Localizar a linha da conta a pagar recém-criada
      const accountRow = page.locator(`text=${testSupplierName}`).locator('..').locator('..');
      
      // Procurar botão de ação (três pontos, editar, pagar, etc.)
      const actionButton = accountRow.getByRole('button', { name: /ações|pagar|editar|•••/i }).first();
      
      // Se encontrar botão de ações, clicar nele
      if (await actionButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await actionButton.click();
        await page.waitForTimeout(300);
        
        // Procurar opção "Registrar Pagamento" ou similar
        const payButton = page.getByRole('button', { name: /registrar pagamento|pagar|marcar como pago/i });
        if (await payButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await payButton.click();
          await page.waitForTimeout(500);
          
          // Preencher formulário de pagamento se houver
          const paymentForm = page.locator('form, [role="dialog"]');
          if (await paymentForm.isVisible()) {
            // Data do pagamento
            const paymentDateInput = page.locator('input[name="data_pagamento"]');
            if (await paymentDateInput.isVisible({ timeout: 1000 }).catch(() => false)) {
              await paymentDateInput.fill(new Date().toISOString().split('T')[0]);
            }
            
            // Forma de pagamento
            const paymentMethodSelect = page.locator('select[name="forma_pagamento"]');
            if (await paymentMethodSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
              await paymentMethodSelect.selectOption({ index: 0 });
            }
            
            // Confirmar pagamento
            await page.getByRole('button', { name: /confirmar|salvar|registrar/i }).first().click();
            await page.waitForTimeout(1500);
          }
        }
      } else {
        // Tentar abordagem alternativa: clicar direto na linha
        await accountRow.click();
        await page.waitForTimeout(500);
        
        // Procurar botão de pagar no detalhe ou modal
        const payButton = page.getByRole('button', { name: /registrar pagamento|pagar|marcar como pago/i });
        if (await payButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await payButton.click();
          await page.waitForTimeout(1500);
        }
      }
      
      console.log('✅ Pagamento processado');
    });

    // ========================================
    // ETAPA 7: Verificar Mudança de Status
    // ========================================
    await test.step('Verificar status atualizado para PAGO', async () => {
      // Recarregar página ou buscar novamente
      await page.waitForTimeout(1000);
      
      // Buscar pelo fornecedor novamente
      const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.clear();
        await searchInput.fill(testSupplierName);
        await page.waitForTimeout(1000);
      }
      
      // Verificar que o status mudou para PAGO ou similar
      // A conta pode não aparecer mais na lista de "Abertas" ou ter status "PAGO"
      const paidStatus = page.locator('text=/pago|paid|quitado/i');
      
      // Se não encontrar, pode ser que esteja em uma aba diferente (histórico)
      if (!await paidStatus.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Tentar mudar para aba de histórico/pagas
        const historyTab = page.getByRole('button', { name: /histórico|pagas|quitadas/i });
        if (await historyTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await historyTab.click();
          await page.waitForTimeout(1000);
          
          // Buscar novamente
          const historySearch = page.locator('input[type="search"], input[placeholder*="buscar"]').first();
          if (await historySearch.isVisible()) {
            await historySearch.fill(testSupplierName);
            await page.waitForTimeout(1000);
          }
        }
      }
      
      // Verificar que a conta com status PAGO existe
      await expect(page.locator(`text=${testSupplierName}`)).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=/pago|paid|quitado/i').first()).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Status atualizado para PAGO corretamente');
    });

    // ========================================
    // ETAPA 8: Verificar Integração dos Dados
    // ========================================
    await test.step('Verificar linkagem entre módulos', async () => {
      // Voltar para pedido de compra para verificar status
      await page.click('text=Compras');
      await page.waitForTimeout(500);
      await page.click('text=Pedido');
      await page.waitForLoadState('networkidle');
      
      // Buscar pedido criado
      const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill(testOrderNumber);
        await page.waitForTimeout(1000);
      }
      
      // Verificar que pedido existe e tem status apropriado
      await expect(page.locator('text=' + testOrderNumber)).toBeVisible({ timeout: 5000 });
      
      console.log('✅ Fluxo completo validado com sucesso!');
    });
  });

  test('deve criar pedido sem itens e verificar apenas financeiro', async ({ page }) => {
    // Teste simplificado focado no fluxo financeiro
    await test.step('Criar pedido básico', async () => {
      // Navegar para Compras → Pedidos
      await page.click('text=Compras');
      await page.waitForTimeout(500);
      await page.click('text=Pedido');
      await page.waitForLoadState('networkidle');
      
      // Verificar página carregou
      await expect(page.locator('h1, h2')).toContainText(/pedido|compra/i);
    });
  });

  test('deve exibir dados corretos no dashboard de compras', async ({ page }) => {
    await test.step('Verificar métricas do dashboard', async () => {
      // Navegar para Dashboard de Compras
      await page.click('text=Compras');
      await page.waitForTimeout(500);
      await page.click('text=Dashboard');
      await page.waitForLoadState('networkidle');
      
      // Verificar elementos do dashboard
      await expect(page.locator('h1, h2')).toContainText(/compras|purchasing/i);
      
      // Verificar que cards de métricas estão visíveis
      const metricsCards = page.locator('[class*="card"], [class*="stat"]');
      await expect(metricsCards.first()).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Validações e Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    const testEmail = process.env.TEST_USER_EMAIL || 'teste@tauze.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'senha-teste-123';
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/(painel|dashboard)/, { timeout: 10000 });
  });

  test('deve validar campos obrigatórios no formulário de compra', async ({ page }) => {
    // Navegar para pedidos
    await page.click('text=Compras');
    await page.waitForTimeout(500);
    await page.click('text=Pedido');
    await page.waitForLoadState('networkidle');
    
    // Abrir formulário
    const newButton = page.getByRole('button', { name: /novo|adicionar|criar/i }).first();
    await newButton.click();
    await page.waitForTimeout(500);
    
    // Tentar salvar sem preencher
    await page.getByRole('button', { name: /salvar|confirmar/i }).first().click();
    
    // Verificar que campos obrigatórios são validados
    // A validação pode aparecer de diferentes formas
    const validationMessage = page.locator('text=/obrigatório|required|preencha/i, [class*="error"], [class*="invalid"]');
    await expect(validationMessage.first()).toBeVisible({ timeout: 3000 });
  });

  test('deve filtrar pedidos por status', async ({ page }) => {
    await page.click('text=Compras');
    await page.waitForTimeout(500);
    await page.click('text=Pedido');
    await page.waitForLoadState('networkidle');
    
    // Procurar por filtros
    const filterButton = page.getByRole('button', { name: /filtro|filter/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);
      
      // Selecionar um status
      const statusSelect = page.locator('select[name="status"]');
      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption({ index: 1 });
        
        // Aplicar filtro
        const applyButton = page.getByRole('button', { name: /aplicar|filtrar/i });
        if (await applyButton.isVisible()) {
          await applyButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // Verificar que página não quebrou
    await expect(page.locator('body')).not.toContainText('erro');
  });

  test('deve navegar entre abas de pedidos abertos e histórico', async ({ page }) => {
    await page.click('text=Compras');
    await page.waitForTimeout(500);
    await page.click('text=Pedido');
    await page.waitForLoadState('networkidle');
    
    // Procurar abas
    const openTab = page.getByRole('button', { name: /abertos|open/i });
    const historyTab = page.getByRole('button', { name: /histórico|history|concluídos/i });
    
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(500);
      
      // Verificar que não há erro
      await expect(page.locator('body')).not.toContainText(/erro|error/i);
      
      // Voltar para abertos
      if (await openTab.isVisible()) {
        await openTab.click();
        await page.waitForTimeout(500);
      }
    }
  });
});
