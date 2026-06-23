import { useCallback } from 'react';
import { useTenantProfile } from '../contexts/TenantContext';
import { isAdminRole } from '../types/tenant';

/**
 * Hook global para avaliação da Matriz de Segurança (CRUD).
 * Deve ser usado por Sidebar, Botões de Ação e ProtectedRoutes.
 */
export const usePermissions = () => {
  const { userProfile } = useTenantProfile();

  /**
   * Verifica se o usuário tem permissão para uma ação em um módulo.
   * Se a action não for passada, verifica apenas se o módulo está habilitado para leitura.
   * 
   * @param module O ID do módulo (ex: 'pecuaria', 'financeiro')
   * @param action A ação desejada: 'read', 'write', 'approve', 'delete'
   */
  const can = useCallback((module: string, action: 'read' | 'write' | 'approve' | 'delete' = 'read') => {
    if (!userProfile) return false;
    
    // SAAS_ADMIN e ADMIN sempre têm passe livre global
    if (isAdminRole(userProfile.role)) {
      return true;
    }

    // Se o usuário não tem perfil associado ou matriz de permissão nula, nega tudo
    const permissions = userProfile.perfis_usuario?.permissoes;
    if (!permissions) {
      return false;
    }

    // Se a matriz for legado (Array simples de strings), tratamos:
    if (Array.isArray(permissions)) {
      return permissions.includes(module) || permissions.includes(`${module}_${action}`);
    }

    // Estrutura nova do ProfileForm: Record<string, string[]>
    // ex: { pecuaria: ['read', 'write'], financeiro: ['read'] }
    const modulePerms = (permissions as Record<string, string[]>)[module];
    
    if (!modulePerms || !Array.isArray(modulePerms)) {
      return false;
    }

    return modulePerms.includes(action);
  }, [userProfile]);

  return { can };
};
