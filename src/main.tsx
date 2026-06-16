import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryProvider } from './contexts/QueryProvider'
import { validateEnv } from './lib/validateEnv'
import { initWebVitals } from './lib/webVitals'

// Validar variáveis de ambiente antes de iniciar o app
validateEnv();

// Inicializar monitoramento de Web Vitals (apenas produção)
initWebVitals();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>,
)
