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

test.describe('1. Livestock Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_TEST_CREDENTIALS) test.skip();
  });

  test('deve renderizar o dashboard de pecuária com os KPIs principais', async ({ page }) => {
    await page.goto('/pecuaria/dashboard');
    
    // Garantir que a página carregou
    await expect(page.getByRole('heading', { name: /Dashboard Pecuária/i })).toBeVisible();

    // Validar se o grid de KPIs renderizou corretamente
    const kpiGrid = page.locator('.next-gen-kpi-grid');
    await expect(kpiGrid).toBeVisible();
  });
});
