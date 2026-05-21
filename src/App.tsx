import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout/Layout';
import { LandingPage } from './pages/LandingPage';
import { SaaSLayout } from './components/SaaSLayout/SaaSLayout';
import { SuperAdminGuard } from './components/Guards/SuperAdminGuard';
import { Login } from './pages/Auth/Login';
import { MFAEnroll } from './pages/Auth/MFAEnroll';
import { useAuth } from './contexts/AuthContext';
import { MFAGuard } from './components/Guards/MFAGuard';
import { CommandPalette } from './components/Navigation/CommandPalette';

import PastureManagement from './pages/Pecuaria/PastureManagement';

// Lazy Loads
const AnimalManagement = React.lazy(() => import('./pages/Pecuaria/AnimalManagement'));
const LotManagement = React.lazy(() => import('./pages/Pecuaria/LotManagement'));
const WeightManagement = React.lazy(() => import('./pages/Pecuaria/WeightManagement').then(m => ({ default: m.WeightManagement })));
const HealthManagement = React.lazy(() => import('./pages/Pecuaria/HealthManagement').then(m => ({ default: m.HealthManagement })));
const NutritionManagement = React.lazy(() => import('./pages/Pecuaria/NutritionManagement').then(m => ({ default: m.NutritionManagement })));
const ReproductionManagement = React.lazy(() => import('./pages/Pecuaria/ReproductionManagement').then(m => ({ default: m.ReproductionManagement })));
const ConfinementManagement = React.lazy(() => import('./pages/Pecuaria/ConfinementManagement').then(m => ({ default: m.ConfinementManagement })));
const AnimalDetail = React.lazy(() => import('./pages/Pecuaria/AnimalDetail').then(m => ({ default: m.AnimalDetail })));
const LivestockDashboard = React.lazy(() => import('./pages/Pecuaria/LivestockDashboard').then(m => ({ default: m.LivestockDashboard })));
const InventoryDashboard = React.lazy(() => import('./pages/Inventory/InventoryDashboard').then(m => ({ default: m.InventoryDashboard })));
const InventoryManagement = React.lazy(() => import('./pages/Inventory/InventoryManagement').then(m => ({ default: m.InventoryManagement })));
const WarehouseManagement = React.lazy(() => import('./pages/Inventory/WarehouseManagement').then(m => ({ default: m.WarehouseManagement })));
const MovementManagement = React.lazy(() => import('./pages/Inventory/MovementManagement').then(m => ({ default: m.MovementManagement })));
const AuditManagement = React.lazy(() => import('./pages/Inventory/AuditManagement').then(m => ({ default: m.AuditManagement })));
const CashFlow = React.lazy(() => import('./pages/Finance/CashFlow').then(m => ({ default: m.CashFlow })));
const AccountsPayable = React.lazy(() => import('./pages/Finance/AccountsPayable').then(m => ({ default: m.AccountsPayable })));
const AccountsReceivable = React.lazy(() => import('./pages/Finance/AccountsReceivable').then(m => ({ default: m.AccountsReceivable })));
const BankAccounts = React.lazy(() => import('./pages/Finance/BankAccounts').then(m => ({ default: m.BankAccounts })));
const BankReconciliation = React.lazy(() => import('./pages/Finance/BankReconciliation').then(m => ({ default: m.BankReconciliation })));
const FinanceIntelligenceHub = React.lazy(() => import('./pages/Finance/FinanceIntelligenceHub').then(m => ({ default: m.FinanceIntelligenceHub })));
const LCDPRPage = React.lazy(() => import('./pages/Finance/LCDPR/LCDPRPage').then(m => ({ default: m.LCDPRPage })));
const FleetDashboard = React.lazy(() => import('./pages/Fleet/FleetDashboard').then(m => ({ default: m.FleetDashboard })));
const FleetManagement = React.lazy(() => import('./pages/Fleet/FleetManagement').then(m => ({ default: m.FleetManagement })));
const MaintenanceManagement = React.lazy(() => import('./pages/Fleet/MaintenanceManagement').then(m => ({ default: m.MaintenanceManagement })));
const FuelManagement = React.lazy(() => import('./pages/Fleet/FuelManagement').then(m => ({ default: m.FuelManagement })));
const PurchaseRequest = React.lazy(() => import('./pages/Purchasing/PurchaseRequest').then(m => ({ default: m.PurchaseRequest })));
const QuotationMap = React.lazy(() => import('./pages/Purchasing/QuotationMap').then(m => ({ default: m.QuotationMap })));
const PurchaseOrder = React.lazy(() => import('./pages/Purchasing/PurchaseOrder').then(m => ({ default: m.PurchaseOrder })));
const EntryInvoice = React.lazy(() => import('./pages/Purchasing/EntryInvoice').then(m => ({ default: m.EntryInvoice })));
const SupplierManagement = React.lazy(() => import('./pages/Purchasing/SupplierManagement').then(m => ({ default: m.SupplierManagement })));
const PriceAnalysis = React.lazy(() => import('./pages/Purchasing/PriceAnalysis').then(m => ({ default: m.PriceAnalysis })));
const PurchasingDashboard = React.lazy(() => import('./pages/Purchasing/PurchasingDashboard').then(m => ({ default: m.PurchasingDashboard })));
const ExecutiveDashboard = React.lazy(() => import('./pages/Dashboard/ExecutiveDashboard').then(m => ({ default: m.ExecutiveDashboard })));
const ClientManagement = React.lazy(() => import('./pages/Sales/ClientManagement').then(m => ({ default: m.ClientManagement })));
const SalesOrders = React.lazy(() => import('./pages/Sales/SalesOrders').then(m => ({ default: m.SalesOrders })));
const Contracts = React.lazy(() => import('./pages/Sales/Contracts').then(m => ({ default: m.Contracts })));
const Invoices = React.lazy(() => import('./pages/Sales/Invoices').then(m => ({ default: m.Invoices })));
const SalesDashboard = React.lazy(() => import('./pages/Sales/SalesDashboard').then(m => ({ default: m.SalesDashboard })));
const Reports = React.lazy(() => import('./pages/Reports/Reports').then(m => ({ default: m.Reports })));
const UserManagement = React.lazy(() => import('./pages/Admin/UserManagement').then(m => ({ default: m.UserManagement })));
const ProfilePage = React.lazy(() => import('./pages/Admin/ProfilePage').then(m => ({ default: m.ProfilePage })));
const CompanyManagement = React.lazy(() => import('./pages/Admin/CompanyManagement').then(m => ({ default: m.CompanyManagement })));
const AdminIntelligenceHub = React.lazy(() => import('./pages/Admin/AdminIntelligenceHub').then(m => ({ default: m.AdminIntelligenceHub })));
const AdminSettings = React.lazy(() => import('./pages/Admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const TenantBilling = React.lazy(() => import('./pages/Admin/TenantBilling').then(m => ({ default: m.TenantBilling })));
const AuditLog = React.lazy(() => import('./pages/Admin/AuditLog').then(m => ({ default: m.AuditLog })));
const SaaSAdminPanel = React.lazy(() => import('./pages/Admin/SaaSAdminPanel').then(m => ({ default: m.SaaSAdminPanel })));
const MarketIntelligenceDashboard = React.lazy(() => import('./pages/Market/MarketIntelligenceDashboard').then(m => ({ default: m.MarketIntelligenceDashboard })));
const MarketAdvancedAnalytics = React.lazy(() => import('./pages/Market/MarketAdvancedAnalytics').then(m => ({ default: m.MarketAdvancedAnalytics })));
const MarketSeasonality = React.lazy(() => import('./pages/Market/MarketSeasonality').then(m => ({ default: m.MarketSeasonality })));
const MarketB3Calculator = React.lazy(() => import('./pages/Market/MarketB3Calculator').then(m => ({ default: m.MarketB3Calculator })));
function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [isPaletteOpen, setIsPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };

    const handleDocumentClick = (e: MouseEvent) => {
      const activeMenus = document.querySelectorAll('.export-menu.active');
      if (activeMenus.length === 0) return;

      activeMenus.forEach(menu => {
        const container = menu.closest('.export-dropdown-container');
        if (container && container.contains(e.target as Node)) {
          return;
        }
        menu.classList.remove('active');
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleDocumentClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        flexDirection: 'column',
        gap: '24px',
        color: '#6366f1'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #1e293b',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Sincronizando Sessão Segura...
        </span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Router>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
      <React.Suspense fallback={<div style={{padding: '2rem'}}>Carregando módulo Tauze...</div>}>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/mfa-enroll" element={isAuthenticated ? <MFAEnroll /> : <Navigate to="/login" replace />} />
          
          <Route path="/saas/*" element={
            isAuthenticated ? (
              <MFAGuard>
                <SuperAdminGuard>
                  <SaaSLayout>
                    <React.Suspense fallback={<div>Carregando SaaS...</div>}>
                      <SaaSAdminPanel />
                    </React.Suspense>
                  </SaaSLayout>
                </SuperAdminGuard>
              </MFAGuard>
            ) : <Navigate to="/login" replace />
          } />

          <Route path="/" element={isAuthenticated ? <MFAGuard><Layout /></MFAGuard> : <Navigate to="/login" replace />}>
            <Route index element={<ExecutiveDashboard />} />
            <Route path="admin/usuarios" element={<UserManagement />} />
            <Route path="admin/perfil" element={<ProfilePage />} />
            <Route path="admin/config" element={<CompanyManagement />} />
            <Route path="admin/intelligence" element={<AdminIntelligenceHub />} />
            <Route path="admin/configuracoes" element={<AdminSettings />} />
            <Route path="admin/assinatura" element={<TenantBilling />} />
            <Route path="admin/auditoria" element={<AuditLog />} />
            
            <Route path="mercado/indicadores" element={<MarketIntelligenceDashboard />} />
            <Route path="mercado/analise" element={<MarketAdvancedAnalytics />} />
            <Route path="mercado/sazonalidade" element={<MarketSeasonality />} />
            <Route path="mercado/b3" element={<MarketB3Calculator />} />
            
            <Route path="pecuaria/dashboard" element={<LivestockDashboard />} />
            <Route path="pecuaria/animal" element={<AnimalManagement />} />
            <Route path="pecuaria/animal/:id" element={<AnimalDetail />} />
            <Route path="pecuaria/lote" element={<LotManagement />} />
            <Route path="pecuaria/pasto" element={<PastureManagement />} />
            <Route path="pecuaria/pesagem" element={<WeightManagement />} />
            <Route path="pecuaria/reproducao" element={<ReproductionManagement />} />
            <Route path="pecuaria/nutricao" element={<NutritionManagement />} />
            <Route path="pecuaria/sanidade" element={<HealthManagement />} />
            <Route path="pecuaria/confinamento" element={<ConfinementManagement />} />

            <Route path="financeiro/intelligence" element={<FinanceIntelligenceHub />} />
            <Route path="financeiro/contas" element={<BankAccounts />} />
            <Route path="financeiro/fluxo" element={<CashFlow />} />
            <Route path="financeiro/pagar" element={<AccountsPayable />} />
            <Route path="financeiro/receber" element={<AccountsReceivable />} />
            <Route path="financeiro/conciliacao" element={<BankReconciliation />} />
            <Route path="financeiro/lcdpr" element={<LCDPRPage />} />
            
            <Route path="frota/dashboard" element={<FleetDashboard />} />
            <Route path="frota/maquina" element={<FleetManagement />} />
            <Route path="frota/abastecimento" element={<FuelManagement />} />
            <Route path="frota/manutencao" element={<MaintenanceManagement />} />

            <Route path="estoque/dashboard" element={<InventoryDashboard />} />
            <Route path="estoque/insumo" element={<InventoryManagement />} />
            <Route path="estoque/deposito" element={<WarehouseManagement />} />
            <Route path="estoque/movimentacao" element={<MovementManagement />} />
            <Route path="estoque/inventario" element={<AuditManagement />} />
            
            <Route path="compras/dashboard" element={<PurchasingDashboard />} />
            <Route path="compras/solicitacao" element={<PurchaseRequest />} />
            <Route path="compras/cotacao" element={<QuotationMap />} />
            <Route path="compras/pedido" element={<PurchaseOrder />} />
            <Route path="compras/nota" element={<EntryInvoice />} />
            <Route path="compras/fornecedores" element={<SupplierManagement />} />
            
            <Route path="vendas/dashboard" element={<SalesDashboard />} />
            <Route path="vendas/clientes" element={<ClientManagement />} />
            <Route path="vendas/pedido" element={<SalesOrders />} />
            <Route path="vendas/contrato" element={<Contracts />} />
            <Route path="vendas/notas" element={<Invoices />} />
            <Route path="relatorios" element={<Reports />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
        </Routes>
      </React.Suspense>
    </Router>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TenantProvider>
          <AppContent />
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
