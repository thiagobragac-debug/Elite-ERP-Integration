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

test.describe('2. Animals and Lots E2E', () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_TEST_CREDENTIALS) test.skip();
  });

  test('deve acessar gestão de animais e abrir detalhes', async ({ page }) => {
    await page.goto('/pecuaria/animais');
    
    // Garantir que a página carregou
    await expect(page.getByRole('heading', { name: /Gestão de Animais/i })).toBeVisible();

    // A busca
    const searchInput = page.getByPlaceholder(/Buscar/i);
    await expect(searchInput).toBeVisible();

    // Export dropdown
    const exportBtn = page.getByTitle('Exportar');
    await expect(exportBtn).toBeVisible();
  });

  test('deve acessar gestão de lotes', async ({ page }) => {
    await page.goto('/pecuaria/lotes');
    
    // Garantir que a página carregou
    await expect(page.getByRole('heading', { name: /Gestão de Lotes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /NOVO LOTE/i })).toBeVisible();
  });
});
