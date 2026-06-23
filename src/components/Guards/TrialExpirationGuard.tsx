import React from 'react';
import { useTenantCore } from '../../contexts/TenantContext';
import { TrialExpiredScreen } from '../../pages/Upgrade/TrialExpiredScreen';

export const TrialExpirationGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isTrialExpired, loading } = useTenantCore();

  if (loading) {
    return null; // O App.tsx já tem um skeleton de loading global
  }

  // Se o trial expirou, renderiza o Muro de Pagamento e bloqueia o acesso à rota
  if (isTrialExpired) {
    return <TrialExpiredScreen />;
  }

  return <>{children}</>;
};
