/**
 * Hook for handling payment mutations (create, update, delete)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useFarmFilter } from '../../../hooks/useFarmFilter';
import { useApprovalQueue } from '../../../hooks/useApprovalQueue';
import toast from 'react-hot-toast';
import type { Account, AccountFormData } from './types';

export function usePaymentMutation(selectedBill: Account | null, onSuccess: () => void) {
  const queryClient = useQueryClient();
  const { canCreate, insertPayload } = useFarmFilter();
  const { submitForApproval } = useApprovalQueue();

  const saveMutation = useMutation({
    mutationFn: async (formData: AccountFormData) => {
      const payload = {
        descricao: formData.description,
        valor_total: parseFloat(String(formData.value)),
        data_vencimento: formData.dueDate,
        categoria_id: formData.category || null,
        fornecedor_id: formData.entityId || null,
        metodo_pagamento: formData.paymentMethod,
        status: formData.status,
      };

      if (selectedBill) {
        const { error } = await supabase
          .from('contas_pagar')
          .update(payload)
          .eq('id', selectedBill.id);
        if (error) throw error;
      } else {
        const { data: newRecord, error } = await supabase
          .from('contas_pagar')
          .insert([{ ...payload, ...insertPayload }])
          .select()
          .single();
        if (error) throw error;

        const { data: userData } = await supabase.auth.getUser();
        await submitForApproval(
          'Contas a Pagar',
          newRecord.id,
          'contas_pagar',
          payload.valor_total,
          payload.descricao || 'Nova Conta a Pagar',
          userData.user?.email || 'Usuário'
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', 'contas-pagar'] });
      onSuccess();
      toast.success('Título salvo com sucesso!');
    },
    onError: (err: any) => {
      console.error('[AccountsPayable] Erro ao salvar:', err);
      toast.error(`❌ Erro ao salvar título: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contas_pagar').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', 'contas-pagar'] });
      toast.success('Título excluído com sucesso!');
    },
    onError: (err: any) => {
      toast.error(`❌ Erro ao excluir título: ${err.message}`);
    },
  });

  const handleSubmit = async (formData: AccountFormData) => {
    if (!canCreate && !selectedBill) {
      toast.error(
        '⚠️ Selecione uma unidade específica para registrar uma nova conta. No modo Visão Global, a fazenda devedora deve ser definida.'
      );
      return;
    }
    saveMutation.mutate(formData);
  };

  return {
    saveMutation,
    deleteMutation,
    handleSubmit,
    isSubmitting: saveMutation.isPending || deleteMutation.isPending,
  };
}
