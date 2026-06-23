import { test as base, expect } from '@playwright/test';

/**
 * Testes E2E - Smoke Test
 * 
 * Valida fluxos críticos da aplicação:
 * - Login e autenticação
 * - Dashboard principal carrega corretamente
 * - Navegação para módulos principais
 * - Visibilidade básica de dados em cada módulo
 * 
 * Tempo esperado: <30s
 * 
 * OTIMIZAÇÕES:
 * - Usa autenticação compartilhada para evitar login repetido
 * - Navegação direta via URL (mais rápido que clicks)
 * - Timeouts reduzidos para smoke tests
 */

// Configuração de credenciais de teste
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'teste@tauze.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'senha-teste-123';
const HAS_TEST_CREDENTIALS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

// Extend test with authenticated context
const test = base.extend<{ authenticatedPage: typeof base }>({
  authenticatedPage: async ({ page }, use) => {
    if (!HAS_TEST_CREDENTIALS) {
      test.skip();
      return;
    }

    // Perform login once
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/(painel)?$/, { timeout: 10000 });

    await use(page);
  },
});

test.describe('Smoke Test - Fluxos Críticos', () => {
  // Reduce timeout for smoke tests (should be fast)
  test.setTimeout(30000);

  test('deve realizar login e acessar dashboard executivo', async ({ page }) => {
    if (!HAS_TEST_CREDENTIALS) {
      test.skip();
    }

    // Ir para login
    await page.goto('/login');
    
    // Preencher credenciais
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    // Clicar em entrar
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Aguardar redirecionamento (pode ir para / ou /painel)
    await page.waitForURL(/\/(painel)?$/, { timeout: 10000 });
    
    // Verificar que não está mais na tela de login
    await expect(page).not.toHaveURL(/login/);
    
    // Verificar elementos básicos do dashboard
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('deve navegar para módulo de Pecuária', async ({ authenticatedPage: page }) => {
    // Navegar para Pecuária (navegação direta é mais rápida)
    await page.goto('/pecuaria/dashboard');
    
    // Verificar que a página carregou
    await expect(page).toHaveURL(/\/pecuaria\/dashboard/);
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('deve navegar para módulo Financeiro', async ({ authenticatedPage: page }) => {
    // Navegar para Financeiro
    await page.goto('/financeiro/fluxo');
    
    // Verificar que a página carregou
    await expect(page).toHaveURL(/\/financeiro\/fluxo/);
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('deve navegar para módulo de Estoque', async ({ authenticatedPage: page }) => {
    // Navegar para Estoque
    await page.goto('/estoque/dashboard');
    
    // Verificar que a página carregou
    await expect(page).toHaveURL(/\/estoque\/dashboard/);
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('deve navegar para módulo de Compras', async ({ authenticatedPage: page }) => {
    // Navegar para Compras
    await page.goto('/compras/dashboard');
    
    // Verificar que a página carregou
    await expect(page).toHaveURL(/\/compras\/dashboard/);
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('deve navegar para módulo de Vendas', async ({ authenticatedPage: page }) => {
    // Navegar para Vendas
    await page.goto('/vendas/dashboard');
    
    // Verificar que a página carregou
    await expect(page).toHaveURL(/\/vendas\/dashboard/);
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('deve navegar para módulo de Frota', async ({ authenticatedPage: page }) => {
    // Navegar para Frota
    await page.goto('/frota/dashboard');
    
    // Verificar que a página carregou
    await expect(page).toHaveURL(/\/frota\/dashboard/);
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('deve navegar para módulo de Mercado', async ({ authenticatedPage: page }) => {
    // Navegar para Mercado
    await page.goto('/mercado/indicadores');
    
    // Verificar que a página carregou
    await expect(page).toHaveURL(/\/mercado\/indicadores/);
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('deve navegar para módulo de Administração', async ({ authenticatedPage: page }) => {
    // Navegar para Admin
    await page.goto('/admin/perfil');
    
    // Verificar que a página carregou (pode redirecionar se não tiver permissão)
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('deve realizar logout com sucesso', async ({ authenticatedPage: page }) => {
    // Verificar que está autenticado
    await expect(page).not.toHaveURL(/login/);
    
    // Procurar e clicar no botão/menu de logout
    // O logout pode estar no header (dropdown) ou em um menu de perfil
    
    // Opção 1: Tentar abrir dropdown do usuário no header
    const userButton = page.locator('button').filter({ hasText: TEST_EMAIL.split('@')[0] }).first();
    const hasUserButton = await userButton.count() > 0;
    
    if (hasUserButton) {
      await userButton.click();
      await page.waitForTimeout(500); // Aguardar dropdown abrir
    }
    
    // Procurar botão de logout (pode ter texto "Sair", "Logout", "Sair do Sistema", "Encerrar Sessão")
    const logoutButton = page.getByRole('button', { name: /sair|logout|encerrar/i }).first();
    await logoutButton.click();
    
    // Verificar que foi redirecionado para login
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/login/);
    
    // Tentar acessar rota protegida e verificar que ainda está deslogado
    await page.goto('/painel');
    await page.waitForURL('**/login', { timeout: 5000 });
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Smoke Test - Navegação Sem Autenticação', () => {
  test('deve redirecionar rotas protegidas para login', async ({ page }) => {
    // Tentar acessar rota protegida sem autenticação
    await page.goto('/painel');
    
    // Deve redirecionar para login
    await page.waitForURL('**/login', { timeout: 5000 });
    await expect(page).toHaveURL(/login/);
  });

  test('landing page deve carregar sem erros', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que não há erro 404
    await expect(page.locator('body')).not.toContainText('404');
    
    // Verificar título
    await expect(page).toHaveTitle(/Tauze/);
  });
});
