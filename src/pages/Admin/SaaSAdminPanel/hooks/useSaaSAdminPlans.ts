import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { logAudit } from '../../../../utils/audit';
import toast from 'react-hot-toast';

export const useSaaSAdminPlans = (
  user: any,
  isSaving: boolean,
  setIsSaving: (v: boolean) => void,
  setAuditLogsList: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const [plansList, setPlansList] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isDeletePlanModalOpen, setIsDeletePlanModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any>(null);
  const [deletePlanConfirmationInput, setDeletePlanConfirmationInput] = useState('');
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const { data, error }: any = await supabase
        .from('saas_plans')
        .select('*', { count: 'exact' }).eq('tenant_id', activeTenantId)
        .order('price', { ascending: true });

      if (error) {
        throw error;
      }

      const mappedData = (data || []).map((p: any) => {
        const numPrice = Number(p.price) || 0;
        return {
          ...p,
          price: numPrice,
          price_formatted:
            numPrice === 0
              ? 'Grátis'
              : `R$ ${numPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          users: 0,
          rev: 'R$ 0',
        };
      });

      setPlansList(mappedData);
    } catch (err) {
      console.error('Erro ao buscar Planos SaaS:', err);
      setPlansList([]);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleSavePlan = async (data: any) => {
    try {
      setIsSaving(true);
      const planData = {
        name: data.name,
        price: parseFloat(
          data.price
            ?.toString()
            .replace(/[^0-9,]/g, '')
            .replace(',', '.') || '0'
        ),
        users_limit: parseInt(data.usersLimit || '0'),
        storage_gb: parseInt(data.storageLimit || '0'),
        features: data.features || [],
        is_public: data.is_public !== undefined ? data.is_public : true,
        animals_limit: parseInt(data.animalsLimit || '0'),
        companies_limit: parseInt(data.companiesLimit || '0'),
        price_per_user_extra: data.pricePerUserExtra || null,
        price_per_animal_extra: data.pricePerAnimalExtra || null,
        billing_cycle: data.billingCycle || 'monthly',
        stripe_plan_id: data.stripePlanId || null,
        pagarme_plan_id: data.pagarMePlanId || null,
        asaas_plan_id: data.asaasPlanId || null,
        modules: data.modules || [],
        settings: data.settings || {},
      };

      const savePromise = selectedPlan
        ? supabase.from('saas_plans').update(planData).eq('id', selectedPlan.id).eq('tenant_id', activeTenantId)
        : supabase.from('saas_plans').insert([planData]);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      const { error }: any = await Promise.race([savePromise, timeoutPromise]);

      if (error) {
        throw error;
      }

      await fetchPlans();
      setIsPlanModalOpen(false);
      logAudit({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        user_id: user?.id,
        action: selectedPlan ? 'Update Plan' : 'Create Plan',
        entity: 'Plans',
        new_data: {
          details: `Plan ${data.name} ${selectedPlan ? 'updated' : 'created'}`,
          status: 'success',
        },
      });

      const newPlanLog = {
        id: `audit-${Date.now()}`,
        action: selectedPlan ? 'PLAN_UPDATE' : 'PLAN_CREATE',
        tenant: 'Catálogo de Planos',
        admin: user?.email || 'Administrador',
        time: 'Agora mesmo',
        status: 'success',
        details: `Plano "${data.name}" ${selectedPlan ? 'atualizado' : 'criado'} com sucesso.`,
      };
      setAuditLogsList((prev) => [newPlanLog, ...prev]);
      toast.success('Plano salvo com sucesso!');
    } catch (err: any) {
      console.error('Error saving plan:', err);
      if (err.message === 'Timeout') {
        toast.error(
          'A conexão com o banco demorou muito. Verifique sua internet e tente novamente.'
        );
      } else {
        toast.error(`Erro ao salvar plano: ${err.message || 'Erro desconhecido'}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    
    try {
      setIsDeletingPlan(true);
      const { data, error } = await supabase.from('saas_plans').delete().eq('id', planToDelete.id).eq('tenant_id', activeTenantId).select();
      
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('O plano não pôde ser excluído. Pode estar bloqueado por políticas de segurança (RLS) ou em uso.');
      }
      
      await fetchPlans();
      
      logAudit({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        user_id: user?.id,
        action: 'DELETE_PLAN',
        entity: 'Plans',
        new_data: {
          details: `Plan ${planToDelete.name} deleted`,
          status: 'success',
        },
      });

      const newPlanLog = {
        id: `audit-${Date.now()}`,
        action: 'PLAN_DELETE',
        tenant: 'Catálogo de Planos',
        admin: user?.email || 'Administrador',
        time: 'Agora mesmo',
        status: 'danger',
        details: `Plano "${planToDelete.name}" excluído com sucesso.`,
      };
      setAuditLogsList((prev) => [newPlanLog, ...prev]);
      
      toast.success('Plano excluído com sucesso!');
      setIsDeletePlanModalOpen(false);
      setPlanToDelete(null);
      setDeletePlanConfirmationInput('');
    } catch (err: any) {
      console.error('Error deleting plan:', err);
      toast.error(`Erro ao excluir plano: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsDeletingPlan(false);
    }
  };

  return {
    plansList,
    plansLoading,
    fetchPlans,
    isPlanModalOpen,
    setIsPlanModalOpen,
    selectedPlan,
    setSelectedPlan,
    handleSavePlan,
    isDeletePlanModalOpen,
    setIsDeletePlanModalOpen,
    planToDelete,
    setPlanToDelete,
    deletePlanConfirmationInput,
    setDeletePlanConfirmationInput,
    isDeletingPlan,
    handleDeletePlan,
  };
};
