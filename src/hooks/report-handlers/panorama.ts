import { supabase } from '../../lib/supabase';
import type { ReportHandler } from '../../types/reports';

const todayBR = () => new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const monthYearBR = () => new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

const fmtDateBR = (dateStr?: string | null): string => {
  if (!dateStr) return todayBR();
  try { return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return todayBR(); }
};
const latestDate = (records: any[], dateField: string): string | null => {
  if (!records || records.length === 0) return null;
  const sorted = [...records].filter(r => r[dateField])
    .sort((a: any, b: any) => new Date(b[dateField]).getTime() - new Date(a[dateField]).getTime());
  return sorted.length > 0 ? fmtDateBR(sorted[0][dateField]) : null;
};
const earliestPending = (records: any[], dateField: string, pendingStatuses = ['PENDENTE','pendente','aberto','ABERTO']): string | null => {
  const pending = records.filter(r => r[dateField] && pendingStatuses.includes(r.status || ''));
  if (pending.length === 0) return null;
  const sorted = pending.sort((a: any, b: any) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  return fmtDateBR(sorted[0][dateField]);
};
const latestPaid = (records: any[], dateField: string, paidStatuses = ['PAGO','pago','LIQUIDADO','liquidado','RECEBIDO','recebido']): string | null => {
  const paid = records.filter(r => r[dateField] && paidStatuses.includes(r.status || ''));
  if (paid.length === 0) return null;
  const sorted = paid.sort((a: any, b: any) => new Date(b[dateField]).getTime() - new Date(a[dateField]).getTime());
  return fmtDateBR(sorted[0][dateField]);
};

const TIMEOUT_MS = 30000;

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs))
  ]);
};

// Gera sparkline a partir de registros reais agrupados por data
function buildSparkline(
  records: any[],
  dateField: string,
  valueField: string | null,
  buckets: number = 7
): { value: number; label: string }[] {
  if (!records || records.length === 0) return [];
  const sorted = [...records]
    .filter(r => r[dateField])
    .sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) return [];
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter(r => {
      const t = new Date(r[dateField]).getTime();
      return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd;
    });
    const v = inBucket.length === 0
      ? 0
      : valueField
        ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0)
        : inBucket.length;
    const d = new Date(bStart + bucketMs / 2);
    return {
      value: Number(v.toFixed(2)),
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    };
  });
}

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
      { header: 'Status', accessor: (row: any) => row.status === 'critical' ? '🔴 Crítico' : row.status === 'warning' ? '🟡 Alerta' : '🔵 Info' }
    ],
    stats: [],
    totalCount: 2
  };

  try {
    // Queries paralelas para máxima performance (Diamond Precision)
    const [gmdRes, bankRes, logsRes, animalRes, lotacaoRes] = await Promise.all([
      supabase.rpc('calculate_herd_gmd', { p_tenant_id: tenantId, p_fazenda_id: fazendaId }),
      supabase.rpc('get_banking_consolidated_balance', { p_tenant_id: tenantId, p_fazenda_id: fazendaId }),
      supabase.from('audit_logs').select('id, action, entity, description, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(6),
      supabase.from('animais').select('id', { count: 'exact', head: true }).match(fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId }),
      supabase.rpc('get_paddock_lotation_summary', { p_tenant_id: tenantId, p_fazenda_id: fazendaId })
    ]);

    const totalBalance = bankRes.data?.saldo_total || 0;
    const animalCount = animalRes.count || 0;

    // Mapeamento de Atividades Recentes
    const activities = (logsRes.data || []).map((log: any) => ({
      id: log.id,
      type: (log.entity || 'SISTEMA').toUpperCase(),
      desc: log.description || `${log.action} em ${log.entity}`,
      time: formatTimeAgo(log.created_at),
      status: log.action === 'DELETE' ? 'critical' : log.action === 'UPDATE' ? 'warning' : 'info',
      entity: log.entity
    }));

    // Removido injeção de sugestões falsas

    return {
      data: activities,
      columns: mockData.columns,
      stats: [
        { 
          id: 'gmd', 
          label: 'Evolução de GMD', 
          subtitle: _lastWeighDatePan ? `Última pesagem em ${_lastWeighDatePan}` : 'Sem pesagens registradas',
          sparkline: buildSparkline(logsRes.data || [], 'created_at', null),
          value: gmdRes.data ? `${Number(gmdRes.data).toFixed(3)} kg` : '---', 
          change: 'kg/dia', 
          trend: 'neutral' as const, 
          color: '#10b981', 
          progress: gmdRes.data ? Math.min(100, Number(gmdRes.data) * 100) : 0
        },
        { 
          id: 'caixa', 
          label: 'Fluxo de Caixa', 
          subtitle: `Saldo em ${todayBR()}`,
          sparkline: buildSparkline(logsRes.data || [], 'created_at', null),
          value: totalBalance !== 0 ? (totalBalance / 1000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + 'k' : '---', 
          change: 'Saldo atual', 
          trend: 'neutral' as const, 
          color: '#f59e0b', 
          progress: totalBalance > 0 ? Math.min(100, Math.log10(totalBalance) * 20) : 0
        },
        { 
          id: 'rebanho', 
          label: 'Total Rebanho', 
          subtitle: _lastAnimalDatePan ? `Último cadastro em ${_lastAnimalDatePan}` : `Inventário em ${todayBR()}`,
          sparkline: buildSparkline(logsRes.data || [], 'created_at', null),
          value: animalCount > 0 ? animalCount.toLocaleString() : '---', 
          change: 'Cabeças cadastradas', 
          trend: 'neutral' as const, 
          color: '#6366f1', 
          progress: animalCount > 0 ? 100 : 0
        },
        { 
          id: 'lotacao', 
          label: 'Taxa de Lotação', 
          subtitle: `Verificado em ${todayBR()}`,
          sparkline: buildSparkline(logsRes.data || [], 'created_at', null),
          value: lotacaoRes.data?.media_lotacao ? `${Number(lotacaoRes.data.media_lotacao).toFixed(2)} UA/ha` : '---', 
          change: lotacaoRes.data?.area_total ? `Área: ${Number(lotacaoRes.data.area_total).toFixed(0)} ha` : 'Sem dados', 
          trend: 'neutral' as const, 
          color: '#8b5cf6', 
          progress: Math.min(100, Number(lotacaoRes.data?.taxa_ocupacao || 0))
        }
      ],
      totalCount: activities.length
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

  if (days > 0) return `Há ${days}d`;
  if (hours > 0) return `Há ${hours}h`;
  return `Há ${minutes}m`;
};
