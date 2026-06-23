import React from 'react';
import { Route, Outlet } from 'react-router-dom';
import { LoadingSkeleton } from '../components/Feedback/LoadingSkeleton';
import { PermissionGuard } from '../components/Guards/PermissionGuard';
import { ModuleErrorBoundary } from '../components/Feedback/ModuleErrorBoundary';

const SalesDashboard = React.lazy(() => import('../pages/Sales/SalesDashboard').then((m) => ({ default: m.SalesDashboard })));
const ClientManagement = React.lazy(() => import('../pages/Sales/ClientManagement').then((m) => ({ default: m.ClientManagement })));
const SalesOrders = React.lazy(() => import('../pages/Sales/SalesOrders').then((m) => ({ default: m.SalesOrders })));
const Contracts = React.lazy(() => import('../pages/Sales/Contracts').then((m) => ({ default: m.Contracts })));
const Invoices = React.lazy(() => import('../pages/Sales/Invoices').then((m) => ({ default: m.Invoices })));

const S = (msg: string, variant: 'card' | 'table' | 'form' | 'chart' = 'table') => (
  <LoadingSkeleton variant={variant} fullScreen={true} message={msg} />
);

export const vendasRoutes = (
  <Route path="vendas" element={<PermissionGuard permission="comercial"><ModuleErrorBoundary moduleName="Vendas"><Outlet /></ModuleErrorBoundary></PermissionGuard>}>
    <Route path="dashboard" element={<React.Suspense fallback={S('Carregando dashboard de vendas...', 'card')}><SalesDashboard /></React.Suspense>} />
    <Route path="parceiros" element={<PermissionGuard permission="comercial_clientes"><React.Suspense fallback={S('Carregando parceiros...')}><ClientManagement /></React.Suspense></PermissionGuard>} />
    <Route path="pedido" element={<PermissionGuard permission="comercial_pedidos"><React.Suspense fallback={S('Carregando pedidos de venda...')}><SalesOrders /></React.Suspense></PermissionGuard>} />
    <Route path="contrato" element={<PermissionGuard permission="comercial_pedidos"><React.Suspense fallback={S('Carregando contratos...')}><Contracts /></React.Suspense></PermissionGuard>} />
    <Route path="notas" element={<React.Suspense fallback={S('Carregando notas fiscais...')}><Invoices /></React.Suspense>} />
  </Route>
);
