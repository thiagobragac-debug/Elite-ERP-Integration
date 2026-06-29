import React from 'react';
import { Route, Outlet } from 'react-router-dom';
import { LoadingSkeleton } from '../components/Feedback/LoadingSkeleton';
import { PermissionGuard } from '../components/Guards/PermissionGuard';
import { ModuleErrorBoundary } from '../components/Feedback/ModuleErrorBoundary';

const LivestockDashboard = React.lazy(() => import('../pages/Bovinocultura/LivestockDashboard').then((m) => ({ default: m.LivestockDashboard })));
const AnimalManagement = React.lazy(() => import('../pages/Bovinocultura/AnimalManagement'));
const RomaneioManagement = React.lazy(() => import('../pages/Bovinocultura/RomaneioManagement'));
const AnimalDetail = React.lazy(() => import('../pages/Bovinocultura/AnimalDetail').then((m) => ({ default: m.AnimalDetail })));
const LotManagement = React.lazy(() => import('../pages/Bovinocultura/LotManagement'));
const PastureManagement = React.lazy(() => import('../pages/Bovinocultura/PastureManagement'));
const WeightManagement = React.lazy(() => import('../pages/Bovinocultura/WeightManagement').then((m) => ({ default: m.WeightManagement })));
const ReproductionManagement = React.lazy(() => import('../pages/Bovinocultura/ReproductionManagement').then((m) => ({ default: m.ReproductionManagement })));
const NutritionManagement = React.lazy(() => import('../pages/Bovinocultura/NutritionManagement').then((m) => ({ default: m.NutritionManagement })));
const HealthManagement = React.lazy(() => import('../pages/Bovinocultura/HealthManagement').then((m) => ({ default: m.HealthManagement })));
const ConfinementManagement = React.lazy(() => import('../pages/Bovinocultura/ConfinementManagement').then((m) => ({ default: m.ConfinementManagement })));

const S = (msg: string, variant: 'card' | 'table' | 'form' | 'chart' = 'table') => (
  <LoadingSkeleton variant={variant} fullScreen={true} message={msg} />
);

export const bovinoculturaRoutes = (
  <Route path="bovinocultura" element={<PermissionGuard permission="bovinocultura"><ModuleErrorBoundary moduleName="Bovinocultura"><Outlet /></ModuleErrorBoundary></PermissionGuard>}>
    <Route path="dashboard" element={<PermissionGuard permission="bovinocultura_dashboard"><React.Suspense fallback={S('Carregando dashboard...', 'card')}><LivestockDashboard /></React.Suspense></PermissionGuard>} />
    <Route path="animal" element={<PermissionGuard permission="bovinocultura_animais"><React.Suspense fallback={S('Carregando animais...')}><AnimalManagement /></React.Suspense></PermissionGuard>} />
    <Route path="romaneios" element={<PermissionGuard permission="bovinocultura_animais"><React.Suspense fallback={S('Carregando romaneios...')}><RomaneioManagement /></React.Suspense></PermissionGuard>} />
    <Route path="animal/:id" element={<PermissionGuard permission="bovinocultura_animais"><React.Suspense fallback={S('Carregando animal...', 'card')}><AnimalDetail /></React.Suspense></PermissionGuard>} />
    <Route path="lote" element={<PermissionGuard permission="bovinocultura_animais"><React.Suspense fallback={S('Carregando lotes...')}><LotManagement /></React.Suspense></PermissionGuard>} />
    <Route path="pasto" element={<PermissionGuard permission="bovinocultura_animais"><React.Suspense fallback={S('Carregando pastos...')}><PastureManagement /></React.Suspense></PermissionGuard>} />
    <Route path="pesagem" element={<PermissionGuard permission="bovinocultura_animais"><React.Suspense fallback={S('Carregando pesagens...')}><WeightManagement /></React.Suspense></PermissionGuard>} />
    <Route path="reproducao" element={<PermissionGuard permission="bovinocultura_saude"><React.Suspense fallback={S('Carregando reprodução...')}><ReproductionManagement /></React.Suspense></PermissionGuard>} />
    <Route path="nutricao" element={<PermissionGuard permission="bovinocultura_saude"><React.Suspense fallback={S('Carregando nutrição...')}><NutritionManagement /></React.Suspense></PermissionGuard>} />
    <Route path="sanidade" element={<PermissionGuard permission="bovinocultura_saude"><React.Suspense fallback={S('Carregando sanidade...')}><HealthManagement /></React.Suspense></PermissionGuard>} />
    <Route path="confinamento" element={<PermissionGuard permission="bovinocultura_animais"><React.Suspense fallback={S('Carregando confinamento...')}><ConfinementManagement /></React.Suspense></PermissionGuard>} />
  </Route>
);
