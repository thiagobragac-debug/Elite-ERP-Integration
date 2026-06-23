import React from 'react';
import { Route, Outlet } from 'react-router-dom';
import { LoadingSkeleton } from '../components/Feedback/LoadingSkeleton';
import { PermissionGuard } from '../components/Guards/PermissionGuard';
import { ModuleErrorBoundary } from '../components/Feedback/ModuleErrorBoundary';

const InventoryDashboard = React.lazy(() => import('../pages/Inventory/InventoryDashboard').then((m) => ({ default: m.InventoryDashboard })));
const InventoryManagement = React.lazy(() => import('../pages/Inventory/InventoryManagement').then((m) => ({ default: m.InventoryManagement })));
const WarehouseManagement = React.lazy(() => import('../pages/Inventory/WarehouseManagement').then((m) => ({ default: m.WarehouseManagement })));
const WarehouseDetails = React.lazy(() => import('../pages/Inventory/WarehouseDetails').then((m) => ({ default: m.WarehouseDetails })));
const MovementManagement = React.lazy(() => import('../pages/Inventory/MovementManagement').then((m) => ({ default: m.MovementManagement })));
const AuditManagement = React.lazy(() => import('../pages/Inventory/AuditManagement').then((m) => ({ default: m.AuditManagement })));

const S = (msg: string, variant: 'card' | 'table' | 'form' | 'chart' = 'table') => (
  <LoadingSkeleton variant={variant} fullScreen={true} message={msg} />
);

export const estoqueRoutes = (
  <Route path="estoque" element={<PermissionGuard permission="logistica"><ModuleErrorBoundary moduleName="Estoque"><Outlet /></ModuleErrorBoundary></PermissionGuard>}>
    <Route path="dashboard" element={<React.Suspense fallback={S('Carregando dashboard de estoque...', 'card')}><InventoryDashboard /></React.Suspense>} />
    <Route path="insumo" element={<PermissionGuard permission="logistica_armazens"><React.Suspense fallback={S('Carregando insumos...')}><InventoryManagement /></React.Suspense></PermissionGuard>} />
    <Route path="deposito" element={<PermissionGuard permission="logistica_armazens"><React.Suspense fallback={S('Carregando depósitos...')}><WarehouseManagement /></React.Suspense></PermissionGuard>} />
    <Route path="deposito/:id" element={<PermissionGuard permission="logistica_armazens"><React.Suspense fallback={S('Carregando depósito...', 'card')}><WarehouseDetails /></React.Suspense></PermissionGuard>} />
    <Route path="movimentacao" element={<React.Suspense fallback={S('Carregando movimentações...')}><MovementManagement /></React.Suspense>} />
    <Route path="inventario" element={<React.Suspense fallback={S('Carregando inventário...')}><AuditManagement /></React.Suspense>} />
  </Route>
);
