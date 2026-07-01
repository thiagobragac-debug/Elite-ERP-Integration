import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';

export const MFAGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, aal, loading: authLoading, user } = useAuth();
  const { userProfile, loading: tenantLoading } = useTenant();
  const location = useLocation();

  if (authLoading || tenantLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Se o usuário tem perfil de ADMIN ou SAAS_ADMIN, exige MFA (aal2)
  const isAuthAdmin = user?.role === 'admin' || user?.role === 'ADMIN';
  const isProfileAdmin = userProfile?.role === 'admin' || userProfile?.role === 'ADMIN' || userProfile?.role === 'SAAS_ADMIN';
  const isAdmin = isAuthAdmin || isProfileAdmin;

  if (isAdmin && aal !== 'aal2' && location.pathname !== '/mfa-enroll') {
    return <Navigate to="/mfa-enroll" replace />;
  }

  // Se tem o nível de AAL exigido ou não é admin, permite acesso
  return <>{children}</>;
};
