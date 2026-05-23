import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout/Layout';
import { LandingPage } from './pages/LandingPage';
import { SaaSLayout } from './components/SaaSLayout/SaaSLayout';
import { SuperAdminGuard } from './components/Guards/SuperAdminGuard';
import { Login } from './pages/Auth/Login';
import { MFAEnroll } from './pages/Auth/MFAEnroll';
import { MFAGuard } from './components/Guards/MFAGuard';
import { PermissionGuard } from './components/Guards/PermissionGuard';
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
const ApprovalCenter = React.lazy(() => import('./pages/Admin/ApprovalCenter').then(m => ({ default: m.ApprovalCenter })));
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
        <React.Suspense fallback={<div className="loading-overlay" style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--primary)"}}>Carregando módulo...</div>}><React.Suspense fallback={<div className="loading-overlay" style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "var(--primary)"}}>Carregando módulo...</div>}><Routes>
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

          <Route path="/" element={isAuthenticated ? <MFAGuard><Layout /></MFAGuard> : <Outlet />}>
            <Route index element={isAuthenticated ? <ExecutiveDashboard /> : <LandingPage />} />
            
            <Route element={isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />}>
              <Route path="admin" element={<PermissionGuard permission="admin"><Outlet/></PermissionGuard>}>
                <Route path="usuarios" element={<UserManagement />} />
                <Route path="perfil" element={<ProfilePage />} />
                <Route path="config" element={<CompanyManagement />} />
                <Route path="intelligence" element={<AdminIntelligenceHub />} />
                <Route path="configuracoes" element={<AdminSettings />} />
                <Route path="assinatura" element={<TenantBilling />} />
                <Route path="auditoria" element={<AuditLog />} />
                <Route path="aprovacoes" element={<ApprovalCenter />} />
              </Route>
              
              <Route path="mercado" element={<PermissionGuard permission="mercado"><Outlet/></PermissionGuard>}>
                <Route path="indicadores" element={<MarketIntelligenceDashboard />} />
                <Route path="analise" element={<MarketAdvancedAnalytics />} />
                <Route path="sazonalidade" element={<MarketSeasonality />} />
                <Route path="b3" element={<MarketB3Calculator />} />
              </Route>
              
              <Route path="pecuaria" element={<PermissionGuard permission="pecuaria"><Outlet/></PermissionGuard>}>
                <Route path="dashboard" element={<PermissionGuard permission="pecuaria_dashboard"><LivestockDashboard /></PermissionGuard>} />
                <Route path="animal" element={<PermissionGuard permission="pecuaria_animais"><AnimalManagement /></PermissionGuard>} />
                <Route path="animal/:id" element={<PermissionGuard permission="pecuaria_animais"><AnimalDetail /></PermissionGuard>} />
                <Route path="lote" element={<PermissionGuard permission="pecuaria_animais"><LotManagement /></PermissionGuard>} />
                <Route path="pasto" element={<PermissionGuard permission="pecuaria_animais"><PastureManagement /></PermissionGuard>} />
                <Route path="pesagem" element={<PermissionGuard permission="pecuaria_animais"><WeightManagement /></PermissionGuard>} />
                <Route path="reproducao" element={<PermissionGuard permission="pecuaria_saude"><ReproductionManagement /></PermissionGuard>} />
                <Route path="nutricao" element={<PermissionGuard permission="pecuaria_saude"><NutritionManagement /></PermissionGuard>} />
                <Route path="sanidade" element={<PermissionGuard permission="pecuaria_saude"><HealthManagement /></PermissionGuard>} />
                <Route path="confinamento" element={<PermissionGuard permission="pecuaria_animais"><ConfinementManagement /></PermissionGuard>} />
              </Route>

              <Route path="financeiro" element={<PermissionGuard permission="financeiro"><Outlet/></PermissionGuard>}>
                <Route path="intelligence" element={<PermissionGuard permission="financeiro_dashboard"><FinanceIntelligenceHub /></PermissionGuard>} />
                <Route path="contas" element={<PermissionGuard permission="financeiro_bancos"><BankAccounts /></PermissionGuard>} />
                <Route path="fluxo" element={<CashFlow />} />
                <Route path="pagar" element={<PermissionGuard permission="financeiro_operacoes"><AccountsPayable /></PermissionGuard>} />
                <Route path="receber" element={<PermissionGuard permission="financeiro_operacoes"><AccountsReceivable /></PermissionGuard>} />
                <Route path="conciliacao" element={<PermissionGuard permission="financeiro_bancos"><BankReconciliation /></PermissionGuard>} />
                <Route path="lcdpr" element={<LCDPRPage />} />
              </Route>
              
              <Route path="frota" element={<PermissionGuard permission="frota"><Outlet/></PermissionGuard>}>
                <Route path="dashboard" element={<FleetDashboard />} />
                <Route path="maquina" element={<FleetManagement />} />
                <Route path="abastecimento" element={<PermissionGuard permission="frota_abastecimento"><FuelManagement /></PermissionGuard>} />
                <Route path="manutencao" element={<PermissionGuard permission="frota_manutencao"><MaintenanceManagement /></PermissionGuard>} />
              </Route>

              <Route path="estoque" element={<PermissionGuard permission="logistica"><Outlet/></PermissionGuard>}>
                <Route path="dashboard" element={<InventoryDashboard />} />
                <Route path="insumo" element={<PermissionGuard permission="logistica_armazens"><InventoryManagement /></PermissionGuard>} />
                <Route path="deposito" element={<PermissionGuard permission="logistica_armazens"><WarehouseManagement /></PermissionGuard>} />
                <Route path="movimentacao" element={<MovementManagement />} />
                <Route path="inventario" element={<AuditManagement />} />
              </Route>
              
              <Route path="compras" element={<PermissionGuard permission="compras"><Outlet/></PermissionGuard>}>
                <Route path="dashboard" element={<PurchasingDashboard />} />
                <Route path="solicitacao" element={<PermissionGuard permission="compras_pedidos"><PurchaseRequest /></PermissionGuard>} />
                <Route path="cotacao" element={<PermissionGuard permission="compras_pedidos"><QuotationMap /></PermissionGuard>} />
                <Route path="pedido" element={<PermissionGuard permission="compras_pedidos"><PurchaseOrder /></PermissionGuard>} />
                <Route path="nota" element={<EntryInvoice />} />
                <Route path="parceiroes" element={<PermissionGuard permission="compras_fornecedores"><SupplierManagement /></PermissionGuard>} />
              </Route>
              
              <Route path="vendas" element={<PermissionGuard permission="comercial"><Outlet/></PermissionGuard>}>
                <Route path="dashboard" element={<SalesDashboard />} />
                <Route path="parceiros" element={<PermissionGuard permission="comercial_clientes"><ClientManagement /></PermissionGuard>} />
                <Route path="pedido" element={<PermissionGuard permission="comercial_pedidos"><SalesOrders /></PermissionGuard>} />
                <Route path="contrato" element={<PermissionGuard permission="comercial_pedidos"><Contracts /></PermissionGuard>} />
                <Route path="notas" element={<Invoices />} />
              </Route>
              
              <Route path="relatorios" element={<Reports />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes></React.Suspense></React.Suspense>
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
