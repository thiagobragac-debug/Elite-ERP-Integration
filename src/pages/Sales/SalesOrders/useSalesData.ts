/**
 * Hook for fetching and managing sales orders data
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../../../hooks/useDebounce';
import { useFarmFilter } from '../../../hooks/useFarmFilter';
import { supabase } from '../../../lib/supabase';
import type {
  SalesOrder,
  SalesFilterValues,
  SalesTabType,
  SparklineData,
  RecordWithDate,
  SalesStats,
} from './types';
import { DollarSign, TrendingUp, AlertTriangle, Zap } from 'lucide-react';

interface UseSalesDataParams {
  activeTab: SalesTabType;
  searchTerm: string;
  filterValues: SalesFilterValues;
}

function buildSparkline(
  records: RecordWithDate[],
  dateField: string,
  valueField: string | null,
  buckets = 7
): SparklineData[] {
  if (!records || records.length === 0) return [];
  const sorted = [...records]
    .filter((r) => r[dateField])
    .sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) return [];
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter((r) => {
      const t = new Date(r[dateField]).getTime();
      return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd;
    });
    const v =
      inBucket.length === 0
        ? 0
        : valueField
          ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0)
          : inBucket.length;
    return {
      value: Number(v.toFixed(2)),
      label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
    };
  });
}

export function useSalesData({ activeTab, searchTerm, filterValues }: UseSalesDataParams) {
  const { activeFarmId, activeTenantId, isGlobalMode, applyFarmFilter } = useFarmFilter();
  const debouncedSearch = useDebounce(searchTerm, 500);

  const isReady = isGlobalMode ? !!activeTenantId : !!activeFarmId;

  const {
    data: rawOrders = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: [
      'pedidos-venda',
      activeTenantId,
      activeFarmId,
      isGlobalMode,
      filterValues,
      activeTab,
    ],
    queryFn: async () => {
      if (!isReady || !activeTenantId) return [];

      let query = supabase
        .from('pedidos_venda')
        .select('*')
        .order('created_at', { ascending: false });

      query = applyFarmFilter(query);

      if (activeTab === 'OPEN') {
        query = query.neq('status', 'delivered');
      } else {
        query = query.eq('status', 'delivered');
      }

      if (filterValues.status !== 'all') {
        query = query.eq('status', filterValues.status);
      }

      if (filterValues.dateStart) {
        query = query.gte('created_at', filterValues.dateStart);
      }
      if (filterValues.dateEnd) {
        query = query.lte('created_at', filterValues.dateEnd);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const clienteIds = [...new Set(data.map((d: SalesOrder) => d.cliente_id).filter(Boolean))];
        const parceirosMap: Record<string, string> = {};
        if (clienteIds.length > 0) {
          const { data: parceiros } = await supabase
            .from('parceiros')
            .select('id, nome')
            .in('id', clienteIds);
          if (parceiros)
            parceiros.forEach((p: { id: string; nome: string }) => {
              parceirosMap[p.id] = p.nome;
            });
        }

        return data.map((order: SalesOrder) => {
          const estimatedCost = order.valor_total * 0.72;
          const margin = ((order.valor_total - estimatedCost) / (order.valor_total || 1)) * 100;
          const isHighRisk = order.valor_total > 500000;

          return {
            ...order,
            parceiros: { nome: parceirosMap[order.cliente_id] || 'N/A' },
            margin,
            isHighRisk,
            clientRating: 'B',
          };
        });
      }
      return [];
    },
    enabled: isReady && !!activeTenantId,
  });

  if (queryError) {
    console.error('[useSalesData] Query error:', queryError);
  }

  const orders = React.useMemo(() => {
    if (!debouncedSearch) return rawOrders;
    return rawOrders.filter(
      (o: SalesOrder) =>
        (o.numero_pedido || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (o.parceiros?.nome || '').toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [rawOrders, debouncedSearch]);

  const stats: SalesStats[] = React.useMemo(() => {
    if (!rawOrders || rawOrders.length === 0) {
      return [
        {
          label: 'Pipeline Comercial',
          value: '---',
          icon: DollarSign,
          color: '#10b981',
          progress: 0,
          change: 'Sem pedidos',
          periodLabel: 'Faturamento Bruto',
          sparkline: [],
        },
        {
          label: 'Saúde da Margem',
          value: '---',
          icon: TrendingUp,
          color: '#f59e0b',
          progress: 0,
          change: '---',
          periodLabel: 'Lucratividade Est.',
          sparkline: [],
        },
        {
          label: 'Exposição de Risco',
          value: 0,
          icon: AlertTriangle,
          color: '#ef4444',
          progress: 0,
          change: '---',
          periodLabel: 'Auditoria',
          sparkline: [],
        },
        {
          label: 'Taxa de Conclusão',
          value: '---',
          icon: Zap,
          color: '#3b82f6',
          progress: 0,
          change: 'Sem dados',
          periodLabel: 'Concluído',
          sparkline: [],
        },
      ];
    }

    const valorTotal = rawOrders.reduce(
      (acc: number, curr: SalesOrder) => acc + Number(curr.valor_total || 0),
      0
    );
    const avgMargin =
      rawOrders.reduce((acc: number, curr: SalesOrder) => acc + (curr.margin || 0), 0) /
      rawOrders.length;
    const highRiskCount = rawOrders.filter((o: SalesOrder) => o.isHighRisk).length;
    const entregues = rawOrders.filter((o: SalesOrder) => o.status === 'delivered').length;
    const taxaConclusao =
      rawOrders.length > 0 ? `${((entregues / rawOrders.length) * 100).toFixed(0)}%` : '---';

    return [
      {
        label: 'Pipeline Comercial',
        value: valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        icon: DollarSign,
        color: '#10b981',
        progress: 100,
        change: `${rawOrders.length} ordens`,
        periodLabel: 'Faturamento Bruto',
        sparkline: buildSparkline(rawOrders, 'created_at', 'valor_total'),
      },
      {
        label: 'Saúde da Margem',
        value: `${avgMargin.toFixed(1)}%`,
        icon: TrendingUp,
        color: avgMargin > 20 ? '#10b981' : '#f59e0b',
        progress: Math.min(avgMargin * 2, 100),
        change: 'Margem Operacional',
        periodLabel: 'Lucratividade Est.',
        sparkline: buildSparkline(rawOrders, 'created_at', 'valor_total'),
      },
      {
        label: 'Exposição de Risco',
        value: highRiskCount,
        icon: AlertTriangle,
        color: '#ef4444',
        progress: (highRiskCount / rawOrders.length) * 100,
        change: 'Acima do Limite',
        periodLabel: 'Auditoria',
        sparkline: buildSparkline(rawOrders, 'created_at', 'valor_total'),
      },
      {
        label: 'Taxa de Conclusão',
        value: taxaConclusao,
        icon: Zap,
        color: '#3b82f6',
        progress: rawOrders.length > 0 ? (entregues / rawOrders.length) * 100 : 0,
        trend: 'up' as const,
        change: `${entregues} pedidos entregues`,
        periodLabel: 'Concluído',
        sparkline: buildSparkline(rawOrders, 'created_at', 'valor_total'),
      },
    ];
  }, [rawOrders]);

  return {
    orders,
    stats,
    loading,
    error: queryError,
  };
}
