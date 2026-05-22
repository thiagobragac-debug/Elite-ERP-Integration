import { useTenant } from '../contexts/TenantContext';
import { isValidUUID } from '../utils/validation';

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
export const useFarmFilter = () => {
  const { isGlobalMode, activeFarmId, activeTenantId, activeFarm, farms } = useTenant();

  /**
   * For tables that have fazenda_id:
   *   Global → filter by tenant_id
   *   Specific → filter by fazenda_id
   */
  const applyFarmFilter = (query: any) => {
    // Debug logging for troubleshooting UUID issues
    if (import.meta.env.DEV) {
      if (activeFarmId && !isValidUUID(activeFarmId)) {
        console.warn(`[useFarmFilter] Invalid activeFarmId detected: "${activeFarmId}". Query might fail.`, {
          isGlobalMode,
          activeFarm
        });
      }
    }

    if (isGlobalMode) {
      if (!activeTenantId) return query.is('tenant_id', null); // Silent during load
      if (!isValidUUID(activeTenantId)) {
        console.error('[useFarmFilter] Invalid activeTenantId format', { activeTenantId });
        return query.is('tenant_id', null);
      }
      return query.eq('tenant_id', activeTenantId);
    }

    if (!activeFarmId) return query.is('fazenda_id', null); // Silent during load
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
   * For tables that only have tenant_id (parceiros, parceiroes, etc.)
   * These are already "global" by nature — always filter by tenant.
   */
  const applyTenantFilter = (query: any) => {
    if (!activeTenantId) return query.is('tenant_id', null); // Silent during load
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

