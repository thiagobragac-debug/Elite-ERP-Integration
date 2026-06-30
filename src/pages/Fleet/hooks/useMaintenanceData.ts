import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useFarmFilter } from '../../../hooks/useFarmFilter';
import { useServerPagination } from '../../../hooks/useServerPagination';
import toast from 'react-hot-toast';

export type MaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export const useMaintenanceData = (filterValues: any, activeTab: string, searchTerm: string) => {
  const { activeFarmId, activeTenantId, isGlobalMode, applyFarmFilter, insertPayload } = useFarmFilter();
  const { page, pageSize, totalCount, setTotalCount, setPage, getRange } = useServerPagination(20);
  const queryClient = useQueryClient();
  const range = getRange();

  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: [
      'maintenance_orders',
      activeFarmId,
      activeTenantId,
      isGlobalMode,
      range.from,
      range.to,
      filterValues,
      activeTab,
      searchTerm,
    ],
    queryFn: async () => {
      let query = supabase
        .from('manutencao_frota')
        .select(
          'id, maquina_id, tipo, descricao, data_inicio, data_fim, tipo_manutencao, estoque_id, custo, responsavel, status, created_at, maquinas:maquina_id (nome)',
          { count: 'exact' }
        )
        .eq('tenant_id', activeTenantId)
        .order('data_inicio', { ascending: false });

      query = applyFarmFilter(query);

      // Server-side filtering
      if (searchTerm) {
        // Simple search on description or responsavel since we can't easily join-search maquinas.nome via rpc without modifying backend
        query = query.or(`descricao.ilike.%${searchTerm}%,responsavel.ilike.%${searchTerm}%`);
      }

      if (filterValues.types && filterValues.types.length > 0) {
        query = query.in('tipo', filterValues.types);
      }

      if (filterValues.status && filterValues.status !== 'all') {
        if (filterValues.status === 'open') {
          query = query.in('status', ['PENDING', 'open', 'ABERTA', 'pending']);
        } else if (filterValues.status === 'completed') {
          query = query.in('status', ['COMPLETED', 'completed', 'CONCLUIDA', 'finalizada']);
        } else {
          query = query.eq('status', filterValues.status);
        }
      }

      if (activeTab === 'ACTIVE') {
        query = query.not('status', 'in', '("COMPLETED","completed","CONCLUIDA","finalizada")');
      } else if (activeTab === 'HISTORY') {
        query = query.in('status', ['COMPLETED', 'completed', 'CONCLUIDA', 'finalizada']);
      }

      if (filterValues.maxCost && filterValues.maxCost < 1000000) {
        query = query.lte('custo', filterValues.maxCost);
      }

      if (filterValues.dateStart) {
        query = query.gte('data_inicio', filterValues.dateStart);
      }
      if (filterValues.dateEnd) {
        query = query.lte('data_inicio', filterValues.dateEnd);
      }

      const { data, count, error } = await query.range(range.from, range.to);

      if (error) throw error;
      if (count !== null && count !== totalCount) {
        setTotalCount(count);
      }

      return (data || []) as any[];
    },
    enabled: isGlobalMode ? !!activeTenantId : !!activeFarmId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        maquina_id: data.maquina_id,
        tipo: data.tipo,
        descricao: data.descricao,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim || null,
        tipo_manutencao: data.tipo_manutencao || 'corretiva',
        estoque_id: data.estoque_id || null,
        custo: parseFloat(data.custo) || 0,
        responsavel: data.responsavel,
        status: data.status,
        ...insertPayload,
      };

      if (data.id) {
        const { error } = await supabase
          .from('manutencao_frota')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('manutencao_frota').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_orders'] });
      queryClient.invalidateQueries({ queryKey: ['fleet_dashboard'] });
      toast.success('Operação realizada com sucesso!');
    },
    onError: (err: any) => {
      toast.error(`Erro ao salvar ordem de serviço: ${err.message}`);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: MaintenanceStatus }) => {
      const { error } = await supabase
        .from('manutencao_frota')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_orders'] });
      queryClient.invalidateQueries({ queryKey: ['fleet_dashboard'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (err: any) => {
      toast.error(`Erro ao atualizar status: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('manutencao_frota').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_orders'] });
      queryClient.invalidateQueries({ queryKey: ['fleet_dashboard'] });
      toast.success('Ordem de serviço excluída!');
    },
    onError: (err: any) => {
      toast.error(`Erro ao excluir ordem de serviço: ${err.message}`);
    },
  });

  return {
    orders,
    loading,
    page,
    pageSize,
    totalCount,
    setPage,
    saveOrder: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    updateStatus: statusMutation.mutate,
    isUpdatingStatus: statusMutation.isPending,
    deleteOrder: deleteMutation.mutate,
  };
};
