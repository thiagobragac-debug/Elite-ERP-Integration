import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';

interface UseApprovalQueueReturn {
  submitForApproval: (
    moduleName: string,
    referenceId: string,
    referenceTable: string,
    amount: number,
    description: string,
    requester: string
  ) => Promise<boolean>;
}

export const useApprovalQueue = (): UseApprovalQueueReturn => {
  const { activeTenantId, activeFarmId } = useTenant();

  const submitForApproval = async (
    moduleName: string,
    referenceId: string,
    referenceTable: string,
    amount: number,
    description: string,
    requester: string
  ) => {
    if (!activeTenantId) {
      return false;
    }

    try {
      // 1. Check if there are active rules for this module
      const { data: rules, error: rulesError } = await supabase
        .from('approval_rules')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('module', moduleName)
        .eq('active', true)
        .lte('min_amount', amount);

      if (rulesError) {
        throw rulesError;
      }

      // 2. If no active rule applies, return false (no approval needed)
      if (!rules || rules.length === 0) {
        return false;
      }

      // Pick the rule with highest stages if multiple match
      const maxStagesRule = rules.reduce((prev, current) =>
        prev.stages > current.stages ? prev : current
      );

      // 3. Create entry in approval_queue
      const { error: queueError } = await supabase.from('approval_queue').insert([
        {
          tenant_id: activeTenantId,
          farm_id: activeFarmId || null,
          type: moduleName,
          reference_id: referenceId,
          reference_table: referenceTable,
          description,
          requester,
          amount,
          status: 'pending',
          current_stage: 1,
          total_stages: maxStagesRule.stages,
        },
      ]);

      if (queueError) {
        throw queueError;
      }

      return true; // Sent to approval queue
    } catch (err) {
      console.error('[useApprovalQueue] Error submitting to approval queue:', err);
      return false; // Fail silently but log error, meaning fallback to auto-approval or alert user
    }
  };

  return { submitForApproval };
};
