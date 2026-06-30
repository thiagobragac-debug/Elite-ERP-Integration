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

test.describe('3. Health and Protocols E2E', () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_TEST_CREDENTIALS) test.skip();
  });

  test('deve acessar histórico sanitário (HealthManagement)', async ({ page }) => {
    await page.goto('/pecuaria/sanidade');
    await expect(page.getByRole('heading', { name: /Sanidade/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /NOVO REGISTRO/i })).toBeVisible();
  });

  test('deve acessar protocolos sanitários', async ({ page }) => {
    await page.goto('/pecuaria/protocolos');
    await expect(page.getByRole('heading', { name: /Protocolos/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /CRIAR PROTOCOLO/i })).toBeVisible();
  });
});
