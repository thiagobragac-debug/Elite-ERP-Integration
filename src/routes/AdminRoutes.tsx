import React from 'react';
import { Route, Outlet } from 'react-router-dom';
import { LoadingSkeleton } from '../components/Feedback/LoadingSkeleton';
import { PermissionGuard } from '../components/Guards/PermissionGuard';
import { ModuleErrorBoundary } from '../components/Feedback/ModuleErrorBoundary';

const UserManagement = React.lazy(() =>
  import('../pages/Admin/UserManagement').then((m) => ({ default: m.UserManagement }))
);
const ProfilePage = React.lazy(() =>
  import('../pages/Admin/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const CompanyManagement = React.lazy(() =>
  import('../pages/Admin/CompanyManagement').then((m) => ({ default: m.CompanyManagement }))
);
const AdminIntelligenceHub = React.lazy(() =>
  import('../pages/Admin/AdminIntelligenceHub').then((m) => ({ default: m.AdminIntelligenceHub }))
);
const ModuleSettings = React.lazy(() =>
  import('../pages/Admin/ModuleSettings').then((m) => ({ default: m.ModuleSettings }))
);
const TenantBilling = React.lazy(() =>
  import('../pages/Admin/TenantBilling').then((m) => ({ default: m.TenantBilling }))
);
const AuditLog = React.lazy(() =>
  import('../pages/Admin/AuditLog').then((m) => ({ default: m.AuditLog }))
);
const ApprovalCenter = React.lazy(() =>
  import('../pages/Admin/ApprovalCenter').then((m) => ({ default: m.ApprovalCenter }))
);
const SentryErrorTest = React.lazy(() =>
  import('../pages/Admin/SentryErrorTest').then((m) => ({ default: m.default }))
);

export const adminRoutes = (
  <Route
    path="admin"
    element={
      <PermissionGuard permission="admin">
        <ModuleErrorBoundary moduleName="Administração">
          <Outlet />
        </ModuleErrorBoundary>
      </PermissionGuard>
    }
  >
    <Route path="usuarios" element={<PermissionGuard permission="admin_users"><React.Suspense fallback={<LoadingSkeleton variant="table" fullScreen={true} message="Carregando usuários..." />}><UserManagement /></React.Suspense></PermissionGuard>} />
    <Route path="perfil" element={<React.Suspense fallback={<LoadingSkeleton variant="form" fullScreen={true} message="Carregando perfil..." />}><ProfilePage /></React.Suspense>} />
    <Route path="config" element={<PermissionGuard permission="admin_config"><React.Suspense fallback={<LoadingSkeleton variant="form" fullScreen={true} message="Carregando configurações..." />}><CompanyManagement /></React.Suspense></PermissionGuard>} />
    <Route path="intelligence" element={<React.Suspense fallback={<LoadingSkeleton variant="card" fullScreen={true} message="Carregando hub de inteligência..." />}><AdminIntelligenceHub /></React.Suspense>} />
    <Route path="configuracoes" element={<PermissionGuard permission="admin_config"><React.Suspense fallback={<LoadingSkeleton variant="form" fullScreen={true} message="Carregando configurações de módulos..." />}><ModuleSettings /></React.Suspense></PermissionGuard>} />
    <Route path="assinatura" element={<PermissionGuard permission="admin_billing"><React.Suspense fallback={<LoadingSkeleton variant="card" fullScreen={true} message="Carregando assinatura..." />}><TenantBilling /></React.Suspense></PermissionGuard>} />
    <Route path="auditoria" element={<PermissionGuard permission="admin_audit"><React.Suspense fallback={<LoadingSkeleton variant="table" fullScreen={true} message="Carregando auditoria..." />}><AuditLog /></React.Suspense></PermissionGuard>} />
    <Route path="aprovacoes" element={<React.Suspense fallback={<LoadingSkeleton variant="table" fullScreen={true} message="Carregando aprovações..." />}><ApprovalCenter /></React.Suspense>} />
    <Route path="sentry-test" element={<React.Suspense fallback={<LoadingSkeleton variant="card" fullScreen={true} message="Carregando teste de erros..." />}><SentryErrorTest /></React.Suspense>} />
  </Route>
);
