import { useTenant } from '../contexts/TenantContext';

/**
 * useFarmFilter — Elite ERP v5.0 query helper
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
    if (isGlobalMode) {
      return query.eq('tenant_id', activeTenantId);
    }
    return query.eq('fazenda_id', activeFarmId);
  };

  /**
   * For tables that only have tenant_id (clientes, fornecedores, etc.)
   * These are already "global" by nature — always filter by tenant.
   */
  const applyTenantFilter = (query: any) => {
    return query.eq('tenant_id', activeTenantId);
  };

  /**
   * Guard for INSERT operations.
   * In global mode, we cannot insert without a specific farm.
   * Returns true if a cadastro (create) is safe to proceed.
   */
  const canCreate = !isGlobalMode && !!activeFarmId;

  /**
   * For new records: the fazenda_id and tenant_id to insert.
   * Null in global mode — components must guard with canCreate.
   */
  const insertPayload = {
    fazenda_id: activeFarmId,
    tenant_id: activeTenantId,
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
