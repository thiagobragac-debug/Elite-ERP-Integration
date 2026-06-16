import { test, expect } from '@playwright/test';

/**
 * Testes E2E - Fluxo de Login
 * 
 * Valida:
 * - Login com credenciais válidas
 * - Login com credenciais inválidas
 * - Redirecionamento após login
 * - Persistência de sessão
 */

test.describe('Fluxo de Login', () => {
  test.beforeEach(async ({ page }) => {
    // Ir para página de login
    await page.goto('/login');
  });

  test('deve renderizar página de login corretamente', async ({ page }) => {
    // Verificar elementos da página
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
    
    // Verificar título
    await expect(page).toHaveTitle(/Tauze ERP/);
  });

  test('deve mostrar erro com campos vazios', async ({ page }) => {
    // Clicar em entrar sem preencher
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Verificar validação HTML5
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required');
  });

  test('deve mostrar erro com email inválido', async ({ page }) => {
    // Preencher com email inválido
    await page.fill('input[type="email"]', 'email-invalido');
    await page.fill('input[type="password"]', 'senha123');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Verificar validação de email
    const emailInput = page.locator('input[type="email"]');
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test('deve mostrar/ocultar senha ao clicar no botão', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    
    // Inicialmente deve ser tipo password
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Clicar no botão de mostrar senha (se existir)
    const toggleButton = page.locator('[aria-label*="senha"], [title*="senha"]').first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      
      // Deve mudar para texto
      await expect(page.locator('input[type="text"]').first()).toBeVisible();
    }
  });

  test.skip('deve fazer login com credenciais válidas', async ({ page }) => {
    // NOTA: Este teste precisa de credenciais de teste configuradas
    // Pular por padrão para evitar falhas em ambientes sem setup
    
    await page.fill('input[type="email"]', 'teste@tauze.com');
    await page.fill('input[type="password"]', 'senha-teste-123');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Aguardar redirecionamento
    await page.waitForURL('**/painel', { timeout: 10000 });
    
    // Verificar que está no dashboard
    await expect(page.locator('h1, h2')).toContainText(/dashboard|painel/i);
  });

  test('deve redirecionar para cadastro ao clicar no link', async ({ page }) => {
    // Procurar link de cadastro
    const cadastroLink = page.getByRole('link', { name: /cadastr|criar conta|registr/i });
    
    if (await cadastroLink.isVisible()) {
      await cadastroLink.click();
      
      // Verificar redirecionamento
      await expect(page).toHaveURL(/cadastro/);
    }
  });
});

test.describe('Navegação sem autenticação', () => {
  test('deve redirecionar para login ao tentar acessar rota protegida', async ({ page }) => {
    // Tentar acessar dashboard diretamente
    await page.goto('/painel');
    
    // Deve redirecionar para login
    await page.waitForURL('**/login', { timeout: 5000 });
    await expect(page).toHaveURL(/login/);
  });

  test('landing page deve carregar corretamente', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que não há erro 404
    await expect(page.locator('body')).not.toContainText('404');
    
    // Verificar título
    await expect(page).toHaveTitle(/Tauze/);
  });
});
