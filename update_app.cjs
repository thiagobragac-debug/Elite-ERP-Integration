const fs = require('fs');

let content = fs.readFileSync('C:/Saas/src/App.tsx', 'utf8');

if (!content.includes("import { PermissionGuard }")) {
  content = content.replace("import { MFAGuard }", "import { MFAGuard } from './components/Guards/MFAGuard';\nimport { PermissionGuard } from './components/Guards/PermissionGuard';\nimport { Outlet } from 'react-router-dom';");
}

const routesChunk = `            <Route index element={<ExecutiveDashboard />} />
            
            <Route path="admin" element={<PermissionGuard permission="admin"><Outlet/></PermissionGuard>}>
              <Route path="usuarios" element={<UserManagement />} />
              <Route path="perfil" element={<ProfilePage />} />
              <Route path="config" element={<CompanyManagement />} />
              <Route path="intelligence" element={<AdminIntelligenceHub />} />
              <Route path="configuracoes" element={<AdminSettings />} />
              <Route path="assinatura" element={<TenantBilling />} />
              <Route path="auditoria" element={<AuditLog />} />
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
            
            <Route path="relatorios" element={<Reports />} />`;

// Let's replace everything from `<Route index element={<ExecutiveDashboard />} />` to `<Route path="relatorios" element={<Reports />} />`
const startIdx = content.indexOf('<Route index element={<ExecutiveDashboard />} />');
const endMarker = '<Route path="relatorios" element={<Reports />} />';
const endIdx = content.indexOf(endMarker) + endMarker.length;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + routesChunk + content.substring(endIdx);
  fs.writeFileSync('C:/Saas/src/App.tsx', content, 'utf8');
  console.log("App.tsx updated!");
} else {
  console.log("Failed to find boundaries in App.tsx");
}