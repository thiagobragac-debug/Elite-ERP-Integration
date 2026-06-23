# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Smoke Test - Navegação Sem Autenticação >> deve redirecionar rotas protegidas para login
- Location: tests\e2e\smoke.spec.ts:176:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 5000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/login" until "load"
============================================================
```

# Test source

```ts
  81  | 
  82  |   test('deve navegar para módulo Financeiro', async ({ authenticatedPage: page }) => {
  83  |     // Navegar para Financeiro
  84  |     await page.goto('/financeiro/fluxo');
  85  |     
  86  |     // Verificar que a página carregou
  87  |     await expect(page).toHaveURL(/\/financeiro\/fluxo/);
  88  |     await expect(page.locator('body')).not.toContainText('404');
  89  |   });
  90  | 
  91  |   test('deve navegar para módulo de Estoque', async ({ authenticatedPage: page }) => {
  92  |     // Navegar para Estoque
  93  |     await page.goto('/estoque/dashboard');
  94  |     
  95  |     // Verificar que a página carregou
  96  |     await expect(page).toHaveURL(/\/estoque\/dashboard/);
  97  |     await expect(page.locator('body')).not.toContainText('404');
  98  |   });
  99  | 
  100 |   test('deve navegar para módulo de Compras', async ({ authenticatedPage: page }) => {
  101 |     // Navegar para Compras
  102 |     await page.goto('/compras/dashboard');
  103 |     
  104 |     // Verificar que a página carregou
  105 |     await expect(page).toHaveURL(/\/compras\/dashboard/);
  106 |     await expect(page.locator('body')).not.toContainText('404');
  107 |   });
  108 | 
  109 |   test('deve navegar para módulo de Vendas', async ({ authenticatedPage: page }) => {
  110 |     // Navegar para Vendas
  111 |     await page.goto('/vendas/dashboard');
  112 |     
  113 |     // Verificar que a página carregou
  114 |     await expect(page).toHaveURL(/\/vendas\/dashboard/);
  115 |     await expect(page.locator('body')).not.toContainText('404');
  116 |   });
  117 | 
  118 |   test('deve navegar para módulo de Frota', async ({ authenticatedPage: page }) => {
  119 |     // Navegar para Frota
  120 |     await page.goto('/frota/dashboard');
  121 |     
  122 |     // Verificar que a página carregou
  123 |     await expect(page).toHaveURL(/\/frota\/dashboard/);
  124 |     await expect(page.locator('body')).not.toContainText('404');
  125 |   });
  126 | 
  127 |   test('deve navegar para módulo de Mercado', async ({ authenticatedPage: page }) => {
  128 |     // Navegar para Mercado
  129 |     await page.goto('/mercado/indicadores');
  130 |     
  131 |     // Verificar que a página carregou
  132 |     await expect(page).toHaveURL(/\/mercado\/indicadores/);
  133 |     await expect(page.locator('body')).not.toContainText('404');
  134 |   });
  135 | 
  136 |   test('deve navegar para módulo de Administração', async ({ authenticatedPage: page }) => {
  137 |     // Navegar para Admin
  138 |     await page.goto('/admin/perfil');
  139 |     
  140 |     // Verificar que a página carregou (pode redirecionar se não tiver permissão)
  141 |     await expect(page.locator('body')).not.toContainText('404');
  142 |   });
  143 | 
  144 |   test('deve realizar logout com sucesso', async ({ authenticatedPage: page }) => {
  145 |     // Verificar que está autenticado
  146 |     await expect(page).not.toHaveURL(/login/);
  147 |     
  148 |     // Procurar e clicar no botão/menu de logout
  149 |     // O logout pode estar no header (dropdown) ou em um menu de perfil
  150 |     
  151 |     // Opção 1: Tentar abrir dropdown do usuário no header
  152 |     const userButton = page.locator('button').filter({ hasText: TEST_EMAIL.split('@')[0] }).first();
  153 |     const hasUserButton = await userButton.count() > 0;
  154 |     
  155 |     if (hasUserButton) {
  156 |       await userButton.click();
  157 |       await page.waitForTimeout(500); // Aguardar dropdown abrir
  158 |     }
  159 |     
  160 |     // Procurar botão de logout (pode ter texto "Sair", "Logout", "Sair do Sistema", "Encerrar Sessão")
  161 |     const logoutButton = page.getByRole('button', { name: /sair|logout|encerrar/i }).first();
  162 |     await logoutButton.click();
  163 |     
  164 |     // Verificar que foi redirecionado para login
  165 |     await page.waitForURL('**/login', { timeout: 10000 });
  166 |     await expect(page).toHaveURL(/login/);
  167 |     
  168 |     // Tentar acessar rota protegida e verificar que ainda está deslogado
  169 |     await page.goto('/painel');
  170 |     await page.waitForURL('**/login', { timeout: 5000 });
  171 |     await expect(page).toHaveURL(/login/);
  172 |   });
  173 | });
  174 | 
  175 | test.describe('Smoke Test - Navegação Sem Autenticação', () => {
  176 |   test('deve redirecionar rotas protegidas para login', async ({ page }) => {
  177 |     // Tentar acessar rota protegida sem autenticação
  178 |     await page.goto('/painel');
  179 |     
  180 |     // Deve redirecionar para login
> 181 |     await page.waitForURL('**/login', { timeout: 5000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 5000ms exceeded.
  182 |     await expect(page).toHaveURL(/login/);
  183 |   });
  184 | 
  185 |   test('landing page deve carregar sem erros', async ({ page }) => {
  186 |     await page.goto('/');
  187 |     
  188 |     // Verificar que não há erro 404
  189 |     await expect(page.locator('body')).not.toContainText('404');
  190 |     
  191 |     // Verificar título
  192 |     await expect(page).toHaveTitle(/Tauze/);
  193 |   });
  194 | });
  195 | 
```