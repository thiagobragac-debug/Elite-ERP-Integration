/**
 * Hook for handling sales order mutations (create, update, delete, status changes)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useFarmFilter } from '../../../hooks/useFarmFilter';
import toast from 'react-hot-toast';
import type { SalesOrder, SalesOrderFormData } from './types';

interface UseSalesMutationsParams {
  selectedOrder: SalesOrder | null;
  onSaveSuccess: () => void;
}

export function useSalesMutations({ selectedOrder, onSaveSuccess }: UseSalesMutationsParams) {
  const queryClient = useQueryClient();
  const { insertPayload } = useFarmFilter();

  const saveMutation = useMutation({
    mutationFn: async (data: SalesOrderFormData) => {
      const payload = {
        numero_pedido: data.orderNumber,
        cliente_id: data.clientId,
        produto_id: data.productId,
        quantidade: parseFloat(data.quantity),
        unidade: data.unit,
        valor_total: parseFloat(data.totalValue),
        data_pedido: data.date,
        status: data.status,
        transportadora: data.transportadora,
        placa_veiculo: data.placa_veiculo,
        numero_gta: data.numero_gta,
        forma_pagamento: data.forma_pagamento,
        comissao: parseFloat(data.comissao || '0') || 0,
        observacoes: data.observacoes,
      };

      if (selectedOrder) {
        const { error } = await supabase
          .from('pedidos_venda')
          .update(payload)
          .eq('id', selectedOrder.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pedidos_venda')
          .insert([{ ...payload, ...insertPayload }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-venda'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      onSaveSuccess();
      toast.success('Pedido de venda salvo com sucesso!');
    },
    onError: (err: Error) => {
      console.error('[useSalesMutations] Erro ao salvar pedido:', err);
      toast.error(`❌ Erro ao salvar pedido de venda: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pedidos_venda').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-venda'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('Pedido excluído com sucesso!');
    },
    onError: (err: Error) => {
      console.error('[useSalesMutations] Erro ao excluir pedido:', err);
      toast.error(`❌ Erro ao excluir pedido: ${err.message}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      newStatus,
    }: {
      id: string;
      newStatus: 'pending' | 'delivered' | 'canceled';
    }) => {
      const { error } = await supabase
        .from('pedidos_venda')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-venda'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('Status do pedido atualizado com sucesso!');
    },
    onError: (err: Error) => {
      console.error('[useSalesMutations] Erro ao atualizar status:', err);
      toast.error(`❌ Erro ao atualizar status: ${err.message}`);
    },
  });

  return {
    saveMutation,
    deleteMutation,
    updateStatusMutation,
  };
}
