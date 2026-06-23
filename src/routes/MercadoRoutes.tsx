import React from 'react';
import { Route, Outlet } from 'react-router-dom';
import { LoadingSkeleton } from '../components/Feedback/LoadingSkeleton';
import { PermissionGuard } from '../components/Guards/PermissionGuard';
import { ModuleErrorBoundary } from '../components/Feedback/ModuleErrorBoundary';

const MarketIntelligenceDashboard = React.lazy(() => import('../pages/Market/MarketIntelligenceDashboard').then((m) => ({ default: m.MarketIntelligenceDashboard })));
const MarketAdvancedAnalytics = React.lazy(() => import('../pages/Market/MarketAdvancedAnalytics').then((m) => ({ default: m.MarketAdvancedAnalytics })));
const MarketSeasonality = React.lazy(() => import('../pages/Market/MarketSeasonality').then((m) => ({ default: m.MarketSeasonality })));
const MarketB3Calculator = React.lazy(() => import('../pages/Market/MarketB3Calculator').then((m) => ({ default: m.MarketB3Calculator })));

const S = (msg: string, variant: 'card' | 'table' | 'form' | 'chart' = 'chart') => (
  <LoadingSkeleton variant={variant} fullScreen={true} message={msg} />
);

export const mercadoRoutes = (
  <Route path="mercado" element={<PermissionGuard permission="mercado"><ModuleErrorBoundary moduleName="Mercado"><Outlet /></ModuleErrorBoundary></PermissionGuard>}>
    <Route path="indicadores" element={<React.Suspense fallback={S('Carregando indicadores de mercado...')}><MarketIntelligenceDashboard /></React.Suspense>} />
    <Route path="analise" element={<React.Suspense fallback={S('Carregando análises avançadas...')}><MarketAdvancedAnalytics /></React.Suspense>} />
    <Route path="sazonalidade" element={<React.Suspense fallback={S('Carregando dados de sazonalidade...')}><MarketSeasonality /></React.Suspense>} />
    <Route path="b3" element={<React.Suspense fallback={S('Carregando calculadora B3...', 'form')}><MarketB3Calculator /></React.Suspense>} />
  </Route>
);
