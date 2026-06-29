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
   * @param module O ID do módulo (ex: 'bovinocultura', 'financeiro')
   * @param action A ação desejada: 'read', 'write', 'approve', 'delete'
   */
  const can = useCallback((module: string, action: 'read' | 'write' | 'approve' | 'delete' = 'read') => {
    if (!userProfile) return false;
    
    // SAAS_ADMIN e ADMIN sempre têm passe livre global
    if (isAdminRole(userProfile.role)) {
      return true;
    }

    // Se o usuário não tem perfil associado ou matriz de permissão nula, nega tudo
    let permissions = userProfile.perfis_usuario?.permissoes || (userProfile as any).permissoes || (userProfile as any).permissions || (userProfile.settings as any)?.permissoes || (userProfile.settings as any)?.permissions;
    
    if (!permissions) {
      return false;
    }

    // Tenta fazer parse caso as permissões tenham sido salvas como string JSON por engano
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch (e) {
        // Se não for JSON válido, tenta separar por vírgula como fallback extremo
        permissions = permissions.split(',').map(s => s.trim());
      }
    }

    const moduleLower = module.toLowerCase();
    const parentModule = moduleLower.split('_')[0];
    const actionLower = action.toLowerCase();

    // Se a matriz for legado (Array simples de strings), tratamos:
    if (Array.isArray(permissions)) {
      if (actionLower === 'read') {
        return permissions.some(p => {
          const pLower = typeof p === 'string' ? p.toLowerCase() : '';
          return pLower === moduleLower || pLower === 'all' || pLower.startsWith(`${moduleLower}_`) || pLower === parentModule;
        });
      }
      return permissions.some(p => {
        const pLower = typeof p === 'string' ? p.toLowerCase() : '';
        return pLower === moduleLower || pLower === 'all' || pLower === `${moduleLower}_${actionLower}` || pLower === parentModule;
      });
    }

    // Estrutura nova do ProfileForm: Record<string, string[]>
    // ex: { pecuaria: ['read', 'write'], financeiro: ['read'] }
    const normalizedPermissions = Object.fromEntries(
      Object.entries(permissions as Record<string, any>).map(([k, v]) => [k.toLowerCase(), v])
    );
    
    const modulePerms = normalizedPermissions[moduleLower] || normalizedPermissions[parentModule];
    
    if (!modulePerms || !Array.isArray(modulePerms)) {
      return false;
    }

    return modulePerms.some(a => typeof a === 'string' && a.toLowerCase() === actionLower);
  }, [userProfile]);

  return { can };
};
