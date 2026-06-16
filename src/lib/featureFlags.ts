/**
 * Feature Flags System
 * Permite habilitar/desabilitar features sem deploy
 * 
 * Evolução futura:
 * - Integrar com LaunchDarkly/PostHog
 * - Flags por tenant (tabela no banco)
 * - A/B testing
 */

import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';

/**
 * Features disponíveis no sistema
 */
export type FeatureFlags = {
  // Dashboard
  newDashboard: boolean;
  dashboardV2: boolean;
  
  // IA e Analytics
  aiRecommendations: boolean;
  predictiveAnalytics: boolean;
  
  // Importação/Exportação
  bulkImport: boolean;
  advancedExport: boolean;
  
  // Relatórios
  advancedReports: boolean;
  customReports: boolean;
  
  // Integrações
  whatsappIntegration: boolean;
  apiV2: boolean;
  
  // Módulos
  marketModule: boolean;
  b3Integration: boolean;
  
  // Experimentos
  experimentalUI: boolean;
  betaFeatures: boolean;
};

/**
 * Configuração padrão (produção)
 */
const defaultFlags: FeatureFlags = {
  // Dashboard
  newDashboard: false,
  dashboardV2: false,
  
  // IA
  aiRecommendations: false,
  predictiveAnalytics: false,
  
  // Import/Export
  bulkImport: true, // Já estável
  advancedExport: true,
  
  // Relatórios
  advancedReports: true,
  customReports: false,
  
  // Integrações
  whatsappIntegration: false,
  apiV2: false,
  
  // Módulos
  marketModule: true,
  b3Integration: true,
  
  // Experimentos
  experimentalUI: false,
  betaFeatures: false,
};

/**
 * Beta testers (emails hardcoded - futuramente da tabela)
 */
const BETA_TESTERS = [
  'admin@tauze.com',
  'beta@tauze.com',
  'teste@exemplo.com',
];

/**
 * Tenants em beta (futuramente da tabela)
 */
const BETA_TENANTS = [
  // IDs de tenants que têm acesso a features beta
];

/**
 * Obter flags para um usuário específico
 */
export function getFeatureFlags(
  userEmail?: string,
  tenantId?: string,
  isAdmin?: boolean
): FeatureFlags {
  // Desenvolvimento: tudo habilitado
  if (import.meta.env.DEV) {
    return Object.fromEntries(
      Object.keys(defaultFlags).map(key => [key, true])
    ) as FeatureFlags;
  }

  // Admin: todas as flags habilitadas
  if (isAdmin) {
    return Object.fromEntries(
      Object.keys(defaultFlags).map(key => [key, true])
    ) as FeatureFlags;
  }

  // Beta tester (por email)
  if (userEmail && BETA_TESTERS.includes(userEmail)) {
    return {
      ...defaultFlags,
      newDashboard: true,
      aiRecommendations: true,
      predictiveAnalytics: true,
      dashboardV2: true,
      betaFeatures: true,
    };
  }

  // Beta tenant (por tenant_id)
  if (tenantId && BETA_TENANTS.includes(tenantId)) {
    return {
      ...defaultFlags,
      advancedReports: true,
      customReports: true,
      whatsappIntegration: true,
      betaFeatures: true,
    };
  }

  // Produção: flags padrão
  return defaultFlags;
}

/**
 * Hook para usar feature flags
 */
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  const flags = getFeatureFlags(
    user?.email,
    currentTenant?.id,
    user?.role === 'admin'
  );
  
  return flags[flag];
}

/**
 * Hook para obter todas as flags
 */
export function useFeatureFlags(): FeatureFlags {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  return getFeatureFlags(
    user?.email,
    currentTenant?.id,
    user?.role === 'admin'
  );
}

/**
 * Helper para conditional rendering baseado em flag
 */
export function FeatureFlag({ 
  flag, 
  children, 
  fallback = null 
}: { 
  flag: keyof FeatureFlags; 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isEnabled = useFeatureFlag(flag);
  return <>{isEnabled ? children : fallback}</>;
}

/**
 * Helper para envolver componentes com feature flag
 */
export function withFeatureFlag<P extends object>(
  flag: keyof FeatureFlags,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
) {
  return function WrappedWithFeatureFlag(props: P) {
    const isEnabled = useFeatureFlag(flag);
    
    if (!isEnabled && FallbackComponent) {
      return <FallbackComponent {...props} />;
    }
    
    return isEnabled ? <Component {...props} /> : null;
  };
}

/**
 * Utilitário para debug (apenas dev)
 */
export function debugFeatureFlags() {
  if (import.meta.env.DEV) {
    const { user } = useAuth();
    const { currentTenant } = useTenant();
    
    const flags = getFeatureFlags(
      user?.email,
      currentTenant?.id,
      user?.role === 'admin'
    );
    
    console.table(flags);
  }
}
