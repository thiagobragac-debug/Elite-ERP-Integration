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

test.describe('6. Confinement and Romaneio E2E', () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_TEST_CREDENTIALS) test.skip();
  });

  test('deve acessar confinamento (ConfinementManagement)', async ({ page }) => {
    await page.goto('/pecuaria/confinamento');
    await expect(page.getByRole('heading', { name: /Confinamento/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /NOVO CICLO/i })).toBeVisible();
  });

  test('deve acessar romaneio de embarque (RomaneioManagement)', async ({ page }) => {
    await page.goto('/pecuaria/romaneio');
    await expect(page.getByRole('heading', { name: /Romaneio de Embarque/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /NOVO EMBARQUE/i })).toBeVisible();
  });
});
