import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { LoadingSkeleton } from '../Feedback/LoadingSkeleton';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';

interface OnboardingGuardProps {
  children?: React.ReactNode;
}

export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { companies, loading: tenantLoading } = useTenant();
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin();

  if (authLoading || tenantLoading || superAdminLoading) {
    return <LoadingSkeleton variant="card" fullScreen={true} message="Verificando acesso..." />;
  }

  // Se não está logado, deixa passar (rotas protegidas já lidam com isso)
  if (!isAuthenticated) {
    return <>{children ? children : <Outlet />}</>;
  }

  // Super admin não passa pelo onboarding
  if (isSuperAdmin) {
    return <>{children ? children : <Outlet />}</>;
  }

  // Usuário logado sem empresas vai para onboarding
  if (companies.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children ? children : <Outlet />}</>;
};
