import { useTenantFarm, useTenantProfile } from '../contexts/TenantContext';
import { isAdminRole } from '../types/tenant';
import type { Farm } from '../types/tenant';
import { isValidUUID } from '../utils/validation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseQuery = any;

interface FarmFilterReturn {
  applyFarmFilter: (query: SupabaseQuery) => SupabaseQuery;
  applyTenantFilter: (query: SupabaseQuery) => SupabaseQuery;
  isGlobalMode: boolean;
  activeFarmId: string | null;
  activeTenantId: string | null;
  activeFarm: Farm | null;
  farms: Array<{ id: string }>;
  canCreate: boolean;
  insertPayload: {
    fazenda_id: string | null;
    tenant_id: string | null;
  };
}

/**
 * useFarmFilter — Tauze ERP v5.0 query helper
 *
 * Applies the correct Supabase filter depending on whether
 * the user is in "Visão Global" (all farms) or single-farm mode.
 *
 * Usage:
 *   const { applyFarmFilter, applyTenantFilter, isGlobalMode, activeFarmId, activeTenantId } = useFarmFilter();
 *   const query = applyFarmFilter(supabase.from('animais').select('*'));
 */
export const useFarmFilter = (): FarmFilterReturn => {
  const { isGlobalMode, activeFarmId, activeTenantId, activeFarm, farms } = useTenantFarm();
  const { userProfile } = useTenantProfile();

  const hasGlobalPermission = (): boolean => {
    if (!userProfile) {
      return false;
    }
    const permissions = (userProfile as any).permissoes || userProfile.perfis_usuario?.permissoes || [];
    return isAdminRole(userProfile.role) || permissions.includes('global_view');
  };

  /**
   * For tables that have fazenda_id:
   *   Global → filter by tenant_id
   *   Specific → filter by fazenda_id
   */
  const applyFarmFilter = (query: SupabaseQuery): SupabaseQuery => {
    // Debug logging for troubleshooting UUID issues
    if (import.meta.env.DEV) {
      if (activeFarmId && !isValidUUID(activeFarmId)) {
        console.warn(
          `[useFarmFilter] Invalid activeFarmId detected: "${activeFarmId}". Query might fail.`,
          {
            isGlobalMode,
            activeFarm,
          }
        );
      }
    }

    if (isGlobalMode) {
      if (!activeTenantId) {
        return query.is('tenant_id', null);
      } // Silent during load
      if (!isValidUUID(activeTenantId)) {
        console.error('[useFarmFilter] Invalid activeTenantId format', { activeTenantId });
        return query.is('tenant_id', null);
      }

      if (hasGlobalPermission()) {
        return query.eq('tenant_id', activeTenantId);
      }
      const farmIds = farms.map((f) => f.id);
      if (farmIds.length === 0) {
        return query.is('fazenda_id', null);
      }
      return query.in('fazenda_id', farmIds);
    }

    if (!activeFarmId) {
      return query.is('fazenda_id', null);
    } // Silent during load
    if (!isValidUUID(activeFarmId)) {
      console.error('[useFarmFilter] Invalid activeFarmId format', { activeFarmId });
      if (isValidUUID(activeTenantId)) {
        return query.eq('tenant_id', activeTenantId);
      }
      return query.is('fazenda_id', null);
    }

    return query.eq('fazenda_id', activeFarmId);
  };

  /**
   * For tables that only have tenant_id (parceiros, fornecedores, etc.)
   * These are already "global" by nature — always filter by tenant.
   */
  const applyTenantFilter = (query: SupabaseQuery): SupabaseQuery => {
    if (!activeTenantId) {
      return query.is('tenant_id', null);
    } // Silent during load
    if (!isValidUUID(activeTenantId)) {
      console.error('[useFarmFilter] Invalid activeTenantId format', { activeTenantId });
      return query.is('tenant_id', null);
    }
    return query.eq('tenant_id', activeTenantId);
  };

  /**
   * Guard for INSERT operations.
   * In global mode, we cannot insert without a specific farm.
   * Returns true if a cadastro (create) is safe to proceed.
   */
  const canCreate = !isGlobalMode && isValidUUID(activeFarmId);

  /**
   * For new records: the fazenda_id and tenant_id to insert.
   * Null in global mode — components must guard with canCreate.
   */
  const insertPayload = {
    fazenda_id: isValidUUID(activeFarmId) ? activeFarmId : null,
    tenant_id: isValidUUID(activeTenantId) ? activeTenantId : null,
  };

  return {
    applyFarmFilter,
    applyTenantFilter,
    isGlobalMode,
    activeFarmId,
    activeTenantId,
    activeFarm,
    farms,
    canCreate,
    insertPayload,
  };
};
