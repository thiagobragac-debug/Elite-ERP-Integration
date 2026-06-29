/**
 * Hook for handling receivable mutations (create, update, delete)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useFarmFilter } from '../../../hooks/useFarmFilter';
import type { Receivable, ReceivableFormData } from './types';

export function useReceivableMutation(selectedInvoice: Receivable | null, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { canCreate, insertPayload } = useFarmFilter();

  const saveMutation = useMutation({
    mutationFn: async (formData: ReceivableFormData) => {
      const payload = {
        descricao: formData.description,
        valor_total: parseFloat(String(formData.value)),
        data_vencimento: formData.dueDate,
        categoria_id: formData.category || null,
        cliente_id: formData.entityId || null,
        metodo_recebimento: formData.paymentMethod,
        status: formData.status,
      };

      if (selectedInvoice) {
        const { error } = await supabase
          .from('contas_receber')
          .update(payload)
          .eq('id', selectedInvoice.id).eq('tenant_id', activeTenantId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contas_receber')
          .insert([{ ...payload, ...insertPayload }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', 'contas-receber'] });
      if (onSuccess) onSuccess();
      toast.success('Receita salva com sucesso!');
    },
    onError: (err: any) => {
      console.error('[AccountsReceivable] Erro ao salvar:', err);
      toast.error(`❌ Erro ao salvar receita: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contas_receber').delete().eq('id', id).eq('tenant_id', activeTenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', 'contas-receber'] });
      toast.success('Receita excluída com sucesso!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao excluir receita: ${err.message}`);
    },
  });

  const handleSubmit = async (formData: ReceivableFormData) => {
    if (!canCreate && !selectedInvoice) {
      toast.error(
        '⚠️ Selecione uma unidade específica para registrar uma nova receita. No modo Visão Global, a fazenda beneficiária deve ser definida.'
      );
      return;
    }
    saveMutation.mutate(formData);
  };

  return {
    handleSubmit,
    deleteMutation,
    isSubmitting: saveMutation.isPending,
  };
}
