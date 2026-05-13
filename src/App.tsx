import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { TenantProvider } from './contexts/TenantContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { CompanyManagement } from './pages/Admin/CompanyManagement';
import { UserManagement } from './pages/Admin/UserManagement';
import { AdminSettings } from './pages/Admin/AdminSettings';
import { AdminIntelligenceHub } from './pages/Admin/AdminIntelligenceHub';
import { ProfilePage } from './pages/Admin/ProfilePage';
import { AuditLog } from './pages/Admin/AuditLog';
import { SaaSAdminPanel } from './pages/Admin/SaaSAdminPanel';
import { SaaSLayout } from './components/SaaSLayout/SaaSLayout';
import { SuperAdminGuard } from './components/Guards/SuperAdminGuard';
import { AnimalManagement } from './pages/Pecuaria/AnimalManagement';
import { LotManagement } from './pages/Pecuaria/LotManagement';
import { PastureManagement } from './pages/Pecuaria/PastureManagement';
import { WeightManagement } from './pages/Pecuaria/WeightManagement';
import { HealthManagement } from './pages/Pecuaria/HealthManagement';
import { NutritionManagement } from './pages/Pecuaria/NutritionManagement';
import { ReproductionManagement } from './pages/Pecuaria/ReproductionManagement';
import { ConfinementManagement } from './pages/Pecuaria/ConfinementManagement';
import { AnimalDetail } from './pages/Pecuaria/AnimalDetail';
import { LivestockDashboard } from './pages/Pecuaria/LivestockDashboard';
import { InventoryDashboard } from './pages/Inventory/InventoryDashboard';
import { InventoryManagement } from './pages/Inventory/InventoryManagement';
import { WarehouseManagement } from './pages/Inventory/WarehouseManagement';
import { MovementManagement } from './pages/Inventory/MovementManagement';
import { AuditManagement } from './pages/Inventory/AuditManagement';
import { CashFlow } from './pages/Finance/CashFlow';
import { AccountsPayable } from './pages/Finance/AccountsPayable';
import { AccountsReceivable } from './pages/Finance/AccountsReceivable';
import { BankAccounts } from './pages/Finance/BankAccounts';
import { BankReconciliation } from './pages/Finance/BankReconciliation';
import { FinanceIntelligenceHub } from './pages/Finance/FinanceIntelligenceHub';
import { FleetDashboard } from './pages/Fleet/FleetDashboard';
import { FleetManagement } from './pages/Fleet/FleetManagement';
import { MaintenanceManagement } from './pages/Fleet/MaintenanceManagement';
import { FuelManagement } from './pages/Fleet/FuelManagement';
import { PurchaseRequest } from './pages/Purchasing/PurchaseRequest';
import { QuotationMap } from './pages/Purchasing/QuotationMap';
import { PurchaseOrder } from './pages/Purchasing/PurchaseOrder';
import { EntryInvoice } from './pages/Purchasing/EntryInvoice';
import { SupplierManagement } from './pages/Purchasing/SupplierManagement';
import { PriceAnalysis } from './pages/Purchasing/PriceAnalysis';
import { PurchasingDashboard } from './pages/Purchasing/PurchasingDashboard';
import { ExecutiveDashboard } from './pages/Dashboard/ExecutiveDashboard';
import { ClientManagement } from './pages/Sales/ClientManagement';
import { SalesOrders } from './pages/Sales/SalesOrders';
import { Contracts } from './pages/Sales/Contracts';
import { Invoices } from './pages/Sales/Invoices';
import { SalesDashboard } from './pages/Sales/SalesDashboard';
import { Reports } from './pages/Reports/Reports';
import { Login } from './pages/Auth/Login';
import { LandingPage } from './pages/LandingPage';

import { CommandPalette } from './components/Navigation/CommandPalette';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: 'white' }}>
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />

        <Route path="/saas/*" element={
          <SuperAdminGuard>
            <SaaSLayout>
              <Routes>
                <Route path="/" element={<SaaSAdminPanel />} />
                <Route path="/tenants" element={<SaaSAdminPanel />} />
                <Route path="/plans" element={<SaaSAdminPanel />} />
                <Route path="/billing" element={<SaaSAdminPanel />} />
                <Route path="/health" element={<SaaSAdminPanel />} />
                <Route path="/settings" element={<SaaSAdminPanel />} />
                <Route path="*" element={<Navigate to="/saas" replace />} />
              </Routes>
            </SaaSLayout>
          </SuperAdminGuard>
        } />

        <Route path="/*" element={
          isAuthenticated ? (
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<ExecutiveDashboard />} />
                <Route path="/admin/usuarios" element={<UserManagement />} />
                <Route path="/admin/perfil" element={<ProfilePage />} />
                <Route path="/admin/config" element={<CompanyManagement />} />
                <Route path="/admin/intelligence" element={<AdminIntelligenceHub />} />
                <Route path="/admin/configuracoes" element={<AdminSettings />} />
                <Route path="/admin/auditoria" element={<AuditLog />} />
                
                <Route path="/pecuaria/dashboard" element={<LivestockDashboard />} />
                <Route path="/pecuaria/animal" element={<AnimalManagement />} />
                <Route path="/pecuaria/animal/:id" element={<AnimalDetail />} />
                <Route path="/pecuaria/lote" element={<LotManagement />} />
                <Route path="/pecuaria/pasto" element={<PastureManagement />} />
                <Route path="/pecuaria/pesagem" element={<WeightManagement />} />
                <Route path="/pecuaria/confinamento" element={<ConfinementManagement />} />
                <Route path="/pecuaria/reproducao" element={<ReproductionManagement />} />
                <Route path="/pecuaria/nutricao" element={<NutritionManagement />} />
                <Route path="/pecuaria/sanidade" element={<HealthManagement />} />
                
                <Route path="/frota/dashboard" element={<FleetDashboard />} />
                <Route path="/frota/maquina" element={<FleetManagement />} />
                <Route path="/frota/manutencao" element={<MaintenanceManagement />} />
                <Route path="/frota/abastecimento" element={<FuelManagement />} />
                
                <Route path="/compras/dashboard" element={<PurchasingDashboard />} />
                <Route path="/compras/fornecedores" element={<SupplierManagement />} />
                <Route path="/compras/solicitacao" element={<PurchaseRequest />} />
                <Route path="/compras/cotacao" element={<QuotationMap />} />
                <Route path="/compras/pedido" element={<PurchaseOrder />} />
                <Route path="/compras/nota" element={<EntryInvoice />} />
                
                <Route path="/vendas/dashboard" element={<SalesDashboard />} />
                <Route path="/vendas/clientes" element={<ClientManagement />} />
                <Route path="/vendas/pedido" element={<SalesOrders />} />
                <Route path="/vendas/contrato" element={<Contracts />} />
                <Route path="/vendas/notas" element={<Invoices />} />
                
                <Route path="/estoque/dashboard" element={<InventoryDashboard />} />
                <Route path="/estoque/insumo" element={<InventoryManagement />} />
                <Route path="/estoque/deposito" element={<WarehouseManagement />} />
                <Route path="/estoque/movimentacao" element={<MovementManagement />} />
                <Route path="/estoque/inventario" element={<AuditManagement />} />
                
                <Route path="/financeiro/contas" element={<BankAccounts />} />
                <Route path="/financeiro/fluxo" element={<CashFlow />} />
                <Route path="/financeiro/pagar" element={<AccountsPayable />} />
                <Route path="/financeiro/receber" element={<AccountsReceivable />} />
                <Route path="/financeiro/conciliacao" element={<BankReconciliation />} />
                <Route path="/financeiro/intelligence" element={<FinanceIntelligenceHub />} />
                
                <Route path="/relatorios" element={<Reports />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <TenantProvider>
            <AppContent />
          </TenantProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
