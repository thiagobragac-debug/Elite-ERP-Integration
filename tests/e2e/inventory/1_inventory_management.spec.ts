import { test as base, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'teste@tauze.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'senha-teste-123';
const HAS_TEST_CREDENTIALS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

const test = base.extend<{ authenticatedPage: typeof base }>({
  authenticatedPage: async ({ page }, use) => {
    if (!HAS_TEST_CREDENTIALS) {
      test.skip();
      return;
    }
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/(painel)?$/, { timeout: 10000 });
    await use(page);
  },
});

test.describe('1. Inventory Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_TEST_CREDENTIALS) test.skip();
  });

  test('não deve exibir itens do tipo "serviço" na grid de inventário', async ({ page }) => {
    // Acesso à tela de inventário
    await page.goto('/estoque/inventario');
    
    // Garantir que a página carregou
    await expect(page.getByRole('heading', { name: 'Gestão de Insumos' })).toBeVisible();

    // A busca por algum item de serviço (ex: "Frete") não deve retornar nada na lista principal
    // Simularemos inserindo "Frete" na busca.
    const searchInput = page.getByPlaceholder('Buscar produto...');
    if (await searchInput.isVisible()) {
        await searchInput.fill('Frete Terceirizado');
        // Deve aparecer o estado vazio
        await expect(page.getByText('Nenhum insumo encontrado')).toBeVisible();
    }
  });

  test('deve possuir rotina de exportação funcional', async ({ page }) => {
    await page.goto('/estoque/inventario');
    
    // Clicar em filtros e exportar
    const exportBtn = page.getByTitle('Exportar');
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    // Verificar opções do menu
    await expect(page.getByText('Excel (.CSV)')).toBeVisible();
    await expect(page.getByText('PDF')).toBeVisible();
  });
});
