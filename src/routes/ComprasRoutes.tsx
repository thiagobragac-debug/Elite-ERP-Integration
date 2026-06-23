import React from 'react';
import { Route, Outlet } from 'react-router-dom';
import { LoadingSkeleton } from '../components/Feedback/LoadingSkeleton';
import { PermissionGuard } from '../components/Guards/PermissionGuard';
import { ModuleErrorBoundary } from '../components/Feedback/ModuleErrorBoundary';

const PurchasingDashboard = React.lazy(() => import('../pages/Purchasing/PurchasingDashboard').then((m) => ({ default: m.PurchasingDashboard })));
const PurchaseRequest = React.lazy(() => import('../pages/Purchasing/PurchaseRequest').then((m) => ({ default: m.PurchaseRequest })));
const QuotationMap = React.lazy(() => import('../pages/Purchasing/QuotationMap').then((m) => ({ default: m.QuotationMap })));
const PurchaseOrder = React.lazy(() => import('../pages/Purchasing/PurchaseOrder').then((m) => ({ default: m.PurchaseOrder })));
const EntryInvoice = React.lazy(() => import('../pages/Purchasing/EntryInvoice').then((m) => ({ default: m.EntryInvoice })));
const SupplierManagement = React.lazy(() => import('../pages/Purchasing/SupplierManagement').then((m) => ({ default: m.SupplierManagement })));

const S = (msg: string, variant: 'card' | 'table' | 'form' | 'chart' = 'table') => (
  <LoadingSkeleton variant={variant} fullScreen={true} message={msg} />
);

export const comprasRoutes = (
  <Route path="compras" element={<PermissionGuard permission="compras"><ModuleErrorBoundary moduleName="Compras"><Outlet /></ModuleErrorBoundary></PermissionGuard>}>
    <Route path="dashboard" element={<React.Suspense fallback={S('Carregando dashboard de compras...', 'card')}><PurchasingDashboard /></React.Suspense>} />
    <Route path="solicitacao" element={<PermissionGuard permission="compras_pedidos"><React.Suspense fallback={S('Carregando solicitações...')}><PurchaseRequest /></React.Suspense></PermissionGuard>} />
    <Route path="cotacao" element={<PermissionGuard permission="compras_pedidos"><React.Suspense fallback={S('Carregando cotações...')}><QuotationMap /></React.Suspense></PermissionGuard>} />
    <Route path="pedido" element={<PermissionGuard permission="compras_pedidos"><React.Suspense fallback={S('Carregando pedidos...')}><PurchaseOrder /></React.Suspense></PermissionGuard>} />
    <Route path="nota" element={<React.Suspense fallback={S('Carregando notas de entrada...')}><EntryInvoice /></React.Suspense>} />
    <Route path="fornecedores" element={<PermissionGuard permission="compras_fornecedores"><React.Suspense fallback={S('Carregando fornecedores...')}><SupplierManagement /></React.Suspense></PermissionGuard>} />
  </Route>
);
