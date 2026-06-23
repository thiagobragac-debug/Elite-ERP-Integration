import React from 'react';
import { Route, Outlet } from 'react-router-dom';
import { LoadingSkeleton } from '../components/Feedback/LoadingSkeleton';
import { PermissionGuard } from '../components/Guards/PermissionGuard';
import { ModuleErrorBoundary } from '../components/Feedback/ModuleErrorBoundary';

const FleetDashboard = React.lazy(() => import('../pages/Fleet/FleetDashboard').then((m) => ({ default: m.FleetDashboard })));
const FleetManagement = React.lazy(() => import('../pages/Fleet/FleetManagement').then((m) => ({ default: m.FleetManagement })));
const FuelManagement = React.lazy(() => import('../pages/Fleet/FuelManagement').then((m) => ({ default: m.FuelManagement })));
const MaintenanceManagement = React.lazy(() => import('../pages/Fleet/MaintenanceManagement').then((m) => ({ default: m.MaintenanceManagement })));

const S = (msg: string, variant: 'card' | 'table' | 'form' | 'chart' = 'table') => (
  <LoadingSkeleton variant={variant} fullScreen={true} message={msg} />
);

export const frotaRoutes = (
  <Route path="frota" element={<PermissionGuard permission="frota"><ModuleErrorBoundary moduleName="Frota"><Outlet /></ModuleErrorBoundary></PermissionGuard>}>
    <Route path="dashboard" element={<React.Suspense fallback={S('Carregando dashboard de frota...', 'card')}><FleetDashboard /></React.Suspense>} />
    <Route path="maquina" element={<React.Suspense fallback={S('Carregando máquinas...')}><FleetManagement /></React.Suspense>} />
    <Route path="abastecimento" element={<PermissionGuard permission="frota_abastecimento"><React.Suspense fallback={S('Carregando abastecimento...')}><FuelManagement /></React.Suspense></PermissionGuard>} />
    <Route path="manutencao" element={<PermissionGuard permission="frota_manutencao"><React.Suspense fallback={S('Carregando manutenção...')}><MaintenanceManagement /></React.Suspense></PermissionGuard>} />
  </Route>
);
