import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { CepeaProvider } from './contexts/CepeaContext';
import { OfflineSyncProvider } from './contexts/OfflineSyncContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { SystemSettingsProvider } from './contexts/SystemSettingsContext';
import { ScaleProvider } from './contexts/ScaleContext';

// Feedback
import { ErrorBoundary } from './components/Feedback/ErrorBoundary';
import { LoadingSkeleton } from './components/Feedback/LoadingSkeleton';

// Guards
import { MFAGuard } from './components/Guards/MFAGuard';
import { SuperAdminGuard } from './components/Guards/SuperAdminGuard';
import { TrialExpirationGuard } from './components/Guards/TrialExpirationGuard';
import { OnboardingGuard } from './components/Guards/OnboardingGuard';

// Navigation
import { CommandPalette } from './components/Navigation/CommandPalette';

// Hooks & Utils
import { useSuperAdmin } from './hooks/useSuperAdmin';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';

// Route modules
import { adminRoutes } from './routes/AdminRoutes';
import { bovinoculturaRoutes } from './routes/BovinoculturaRoutes';
import { financeiroRoutes } from './routes/FinanceiroRoutes';
import { frotaRoutes } from './routes/FrotaRoutes';
import { estoqueRoutes } from './routes/EstoqueRoutes';
import { comprasRoutes } from './routes/ComprasRoutes';
import { vendasRoutes } from './routes/VendasRoutes';
import { mercadoRoutes } from './routes/MercadoRoutes';

// ── Eager loaded (Critical) ───────────────────────────────────────────────────
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Auth/Login';

// ── Lazy loaded (Auth & SaaS) ─────────────────────────────────────────────────
const LandingPage = React.lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const TenantRegistration = React.lazy(() => import('./pages/Auth/TenantRegistration').then((m) => ({ default: m.TenantRegistration })));
const OnboardingWizard = React.lazy(() => import('./pages/Onboarding/OnboardingWizard').then((m) => ({ default: m.OnboardingWizard })));
const RoleSelector = React.lazy(() => import('./pages/Auth/RoleSelector').then((m) => ({ default: m.RoleSelector })));
const MFAEnroll = React.lazy(() => import('./pages/Auth/MFAEnroll').then((m) => ({ default: m.MFAEnroll })));
const Reports = React.lazy(() => import('./pages/Reports/Reports').then((m) => ({ default: m.Reports })));
const SaaSLayout = React.lazy(() => import('./components/SaaSLayout/SaaSLayout').then((m) => ({ default: m.SaaSLayout })));
const SaaSAdminPanel = React.lazy(() => import('./pages/Admin/SaaSAdminPanel').then((m) => ({ default: m.SaaSAdminPanel })));
const ExecutiveDashboard = React.lazy(() => import('./pages/Dashboard/ExecutiveDashboard').then((m) => ({ default: m.ExecutiveDashboard })));

// ── Root Index ────────────────────────────────────────────────────────────────

function RootIndex() {
  const { isAuthenticated } = useAuth();
  const { isSuperAdmin, loading } = useSuperAdmin();

  if (!isAuthenticated) {
    return (
      <React.Suspense fallback={<LoadingSkeleton variant="card" fullScreen={true} message="Carregando página inicial..." />}>
        <LandingPage />
      </React.Suspense>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#080d14' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(0,184,101,0.2)', borderTopColor: '#00b865', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isSuperAdmin) return <Navigate to="/select-role" replace />;
  return <Navigate to="/painel" replace />;
}

// ── AppContent ────────────────────────────────────────────────────────────────

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a', flexDirection: 'column', gap: '24px', color: '#6366f1' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #1e293b', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Sincronizando Sessão Segura...
        </span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

// ── AppRoutes (inside Router — can use useNavigate) ───────────────────────────

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const { toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isPaletteOpen, setIsPaletteOpen] = React.useState(false);

  // Listen for open-command-palette event dispatched by the Header search bar
  React.useEffect(() => {
    const handleOpenPalette = () => setIsPaletteOpen(true);
    window.addEventListener('open-command-palette', handleOpenPalette);
    return () => window.removeEventListener('open-command-palette', handleOpenPalette);
  }, []);

  // Global keyboard shortcuts
  useGlobalShortcuts(
    [
      { key: 'k', action: () => setIsPaletteOpen((prev) => !prev), requireModifier: true },
      { key: '1', action: () => navigate('/painel'), requireModifier: true },
      { key: '2', action: () => navigate('/bovinocultura/dashboard'), requireModifier: true },
      { key: '3', action: () => navigate('/financeiro/intelligence'), requireModifier: true },
      { key: '4', action: () => navigate('/estoque/dashboard'), requireModifier: true },
      { key: '5', action: () => navigate('/frota/dashboard'), requireModifier: true },
      { key: '6', action: () => navigate('/compras/dashboard'), requireModifier: true },
      { key: '7', action: () => navigate('/vendas/dashboard'), requireModifier: true },
      { key: '8', action: () => navigate('/mercado/indicadores'), requireModifier: true },
      { key: '9', action: () => navigate('/admin/intelligence'), requireModifier: true },
      { key: 'n', action: () => navigate('/bovinocultura/animal'), requireModifier: true },
      { key: 'p', action: () => navigate('/financeiro/pagar'), requireModifier: true },
      { key: 'f', action: () => setIsPaletteOpen(true), requireModifier: true },
      { key: 't', action: () => toggleTheme(), requireModifier: true },
    ],
    isAuthenticated
  );

  // Document click listener to close export dropdown menus
  React.useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      document.querySelectorAll('.export-menu.active').forEach((menu) => {
        const container = menu.closest('.export-dropdown-container');
        if (!container?.contains(e.target as Node)) {
          menu.classList.remove('active');
        }
      });
    };

    window.addEventListener('click', handleDocumentClick);
    return () => {
      window.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  return (
    <>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
      <React.Suspense fallback={<LoadingSkeleton />}>
        <Routes>
          {/* ── Auth routes ────────────────────────────────────────────── */}
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/cadastro" element={<React.Suspense fallback={<LoadingSkeleton variant="form" fullScreen={true} message="Carregando cadastro..." />}><TenantRegistration /></React.Suspense>} />
          <Route path="/onboarding" element={isAuthenticated ? (<React.Suspense fallback={<LoadingSkeleton variant="form" fullScreen={true} message="Preparando onboarding..." />}><OnboardingWizard /></React.Suspense>) : (<Navigate to="/login" replace />)} />
          <Route path="/mfa-enroll" element={isAuthenticated ? (<React.Suspense fallback={<LoadingSkeleton variant="form" fullScreen={true} message="Carregando MFA..." />}><MFAEnroll /></React.Suspense>) : (<Navigate to="/login" replace />)} />
          <Route path="/select-role" element={isAuthenticated ? (<MFAGuard><React.Suspense fallback={<LoadingSkeleton variant="card" fullScreen={true} message="Carregando seleção de perfil..." />}><RoleSelector /></React.Suspense></MFAGuard>) : (<Navigate to="/login" replace />)} />

          {/* ── SaaS Admin ─────────────────────────────────────────────── */}
          <Route path="/saas/*" element={isAuthenticated ? (<MFAGuard><SuperAdminGuard><React.Suspense fallback={<LoadingSkeleton variant="table" fullScreen={true} message="Carregando painel SaaS..." />}><SaaSLayout><SaaSAdminPanel /></SaaSLayout></React.Suspense></SuperAdminGuard></MFAGuard>) : (<Navigate to="/login" replace />)} />

          {/* ── Main app (with Layout) ──────────────────────────────────── */}
          <Route path="/" element={isAuthenticated ? (<MFAGuard><OnboardingGuard><TrialExpirationGuard><Layout /></TrialExpirationGuard></OnboardingGuard></MFAGuard>) : (<Outlet />)}>
            <Route index element={<RootIndex />} />

            <Route element={isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />}>
              {/* Domain route modules */}
              {adminRoutes}
              {mercadoRoutes}
              {bovinoculturaRoutes}
              {financeiroRoutes}
              {frotaRoutes}
              {estoqueRoutes}
              {comprasRoutes}
              {vendasRoutes}

              {/* Reports */}
              <Route path="relatorios" element={<React.Suspense fallback={<LoadingSkeleton variant="chart" fullScreen={true} message="Carregando relatórios..." />}><Reports /></React.Suspense>} />

              {/* Executive Dashboard */}
              <Route path="painel" element={<React.Suspense fallback={<LoadingSkeleton variant="chart" fullScreen={true} message="Carregando painel..." />}><ExecutiveDashboard /></React.Suspense>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

        </Routes>
      </React.Suspense>
    </>
  );
}

import { createPortal } from 'react-dom';

// ── App root ──────────────────────────────────────────────────────────────────

export function App() {
  return (
    <ThemeProvider>
      <OfflineSyncProvider>
        <AuthProvider>
          <TenantProvider>
            <CepeaProvider>
              <ConfirmProvider>
                <ScaleProvider>
                  <SystemSettingsProvider>
                    <ErrorBoundary>
                      {createPortal(
                        <Toaster
                          position="bottom-left"
                          containerStyle={{ zIndex: 2147483647, left: 20, bottom: 20 }}
                          toastOptions={{
                            duration: 4000,
                            style: {
                              background: '#ffffff',
                              color: '#0f172a',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: 600,
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
                            },
                            success: {
                              iconTheme: { primary: '#10b981', secondary: 'white' },
                              style: { borderLeft: '4px solid #10b981' },
                            },
                            error: {
                              iconTheme: { primary: '#ef4444', secondary: 'white' },
                              style: { borderLeft: '4px solid #ef4444' },
                            },
                          }}
                        />,
                        document.body
                      )}
                      <AppContent />
                    </ErrorBoundary>
                  </SystemSettingsProvider>
                </ScaleProvider>
              </ConfirmProvider>
            </CepeaProvider>
          </TenantProvider>
        </AuthProvider>
      </OfflineSyncProvider>
    </ThemeProvider>
  );
}

export default App;
