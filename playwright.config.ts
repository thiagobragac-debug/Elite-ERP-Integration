import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração Playwright E2E Tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Timeout por teste */
  timeout: 30 * 1000,
  
  /* Executar testes em paralelo */
  fullyParallel: true,
  
  /* Fail build no CI se houver testes esquecidos */
  forbidOnly: !!process.env.CI,
  
  /* Retry apenas no CI */
  retries: process.env.CI ? 2 : 0,
  
  /* Limitar workers no CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter */
  reporter: [
    ['html'],
    ['list'],
    process.env.CI ? ['github'] : ['line']
  ],
  
  /* Configurações compartilhadas */
  use: {
    /* Base URL */
    baseURL: 'http://localhost:5173',
    
    /* Trace em retry */
    trace: 'on-first-retry',
    
    /* Screenshot apenas em falhas */
    screenshot: 'only-on-failure',
    
    /* Video apenas em falhas */
    video: 'retain-on-failure',
  },

  /* Configurar projetos para diferentes browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    /* Descomentar para testar em outros browsers
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    */

    /* Testes mobile
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    */
  ],

  /* Iniciar servidor dev antes dos testes */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
