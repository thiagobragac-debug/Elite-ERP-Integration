import { supabase } from '../../lib/supabase';
import type { ReportHandler } from '../../types/reports';
import {
  todayBR,
  withTimeout,
  buildSparkline,
} from '../../utils/report-utils';


/**
 * Panorama Geral: Visão Consolidada do Ecossistema
 */
export const panoramaOverview: ReportHandler = async (tenantId, fazendaId) => {
  const mockData = {
    mensagens: [],
    columns: [
      { header: 'Tipo', accessor: 'type' },
      { header: 'Atividade', accessor: 'desc' },
      { header: 'Tempo', accessor: 'time' },
      {
        header: 'Status',
        accessor: (row: any) =>
          row.status === 'critical'
            ? '🔴 Crítico'
            : row.status === 'warning'
              ? '🟡 Alerta'
              : '🔵 Info',
      },
    ],
    stats: [],
    totalCount: 2,
  };

  try {
    const [gmdRes, bankRes, logsRes, animalRes, lotacaoRes] = await Promise.all([
      supabase.rpc('calculate_herd_gmd', { p_tenant_id: tenantId, p_fazenda_id: fazendaId }),
      supabase.rpc('get_banking_consolidated_balance', {
        p_tenant_id: tenantId,
        p_fazenda_id: fazendaId,
      }),
      supabase
        .from('audit_logs')
        .select('id, action, entity, description, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('animais')
        .select('id', { count: 'exact', head: true })
        .match(fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId }),
      supabase.rpc('get_paddock_lotation_summary', {
        p_tenant_id: tenantId,
        p_fazenda_id: fazendaId,
      }),
    ]);

    const totalBalance = bankRes.data?.saldo_total || 0;
    const animalCount = animalRes.count || 0;

    const activities = (logsRes.data || []).map((log: any) => ({
      id: log.id,
      type: (log.entity || 'SISTEMA').toUpperCase(),
      desc: log.description || `${log.action} em ${log.entity}`,
      time: formatTimeAgo(log.created_at),
      status: log.action === 'DELETE' ? 'critical' : log.action === 'UPDATE' ? 'warning' : 'info',
      entity: log.entity,
    }));

    return {
      data: activities,
      columns: mockData.columns,
      stats: [
        {
          id: 'gmd',
          label: 'Evolução de GMD',
          subtitle: `Dados do período atual`,
          sparkline: buildSparkline(logsRes.data || [], 'created_at', null),
          value: gmdRes.data ? `${Number(gmdRes.data).toFixed(3)} kg` : '---',
          change: 'kg/dia',
          trend: 'neutral' as const,
          color: '#10b981',
          progress: gmdRes.data ? Math.min(100, Number(gmdRes.data) * 100) : 0,
        },
        {
          id: 'caixa',
          label: 'Fluxo de Caixa',
          subtitle: `Saldo em ${todayBR()}`,
          sparkline: buildSparkline(logsRes.data || [], 'created_at', null),
          value:
            totalBalance !== 0
              ? `${(totalBalance / 1000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}k`
              : '---',
          change: 'Saldo atual',
          trend: 'neutral' as const,
          color: '#f59e0b',
          progress: totalBalance > 0 ? Math.min(100, Math.log10(totalBalance) * 20) : 0,
        },
        {
          id: 'rebanho',
          label: 'Total Rebanho',
          subtitle:
            animalCount > 0 ? `Rebanho atualizado em ${todayBR()}` : `Inventário em ${todayBR()}`,
          sparkline: buildSparkline(logsRes.data || [], 'created_at', null),
          value: animalCount > 0 ? animalCount.toLocaleString() : '---',
          change: 'Cabeças cadastradas',
          trend: 'neutral' as const,
          color: '#6366f1',
          progress: animalCount > 0 ? 100 : 0,
        },
        {
          id: 'lotacao',
          label: 'Taxa de Lotação',
          subtitle: `Verificado em ${todayBR()}`,
          sparkline: buildSparkline(logsRes.data || [], 'created_at', null),
          value: lotacaoRes.data?.media_lotacao
            ? `${Number(lotacaoRes.data.media_lotacao).toFixed(2)} UA/ha`
            : '---',
          change: lotacaoRes.data?.area_total
            ? `Área: ${Number(lotacaoRes.data.area_total).toFixed(0)} ha`
            : 'Sem dados',
          trend: 'neutral' as const,
          color: '#8b5cf6',
          progress: Math.min(100, Number(lotacaoRes.data?.taxa_ocupacao || 0)),
        },
      ],
      totalCount: activities.length,
    };
  } catch (error) {
    console.error('[PanoramaOverview] Critical Failure:', error);
    return { data: [], stats: [], columns: mockData.columns, totalCount: 0 };
  }
};

const formatTimeAgo = (dateStr: string) => {
  const diff = new Date().getTime() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `Há ${days}d`;
  }
  if (hours > 0) {
    return `Há ${hours}h`;
  }
  return `Há ${minutes}m`;
};
