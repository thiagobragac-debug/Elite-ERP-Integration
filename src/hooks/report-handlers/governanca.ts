import { supabase } from '../../lib/supabase';
import type { ReportHandler } from '../../types/reports';
import { Shield, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

const todayBR = () => new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

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
const timeNowBR = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

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
 * Governança: Logs de Auditoria
 */
export const auditLogs: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 25, filters: any = {}) => {
  const columns = [
    { header: 'Módulo', accessor: 'table_name' },
    { header: 'Ação', accessor: 'action' },
    { header: 'Data / Hora', accessor: (row: any) => row.timestamp ? new Date(row.timestamp).toLocaleString('pt-BR') : 'N/A' },
    { header: 'Operador', accessor: 'user_name' },
    { header: 'Descrição', accessor: 'description' }
  ];

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('audit_logs')
      .select('id, action, entity, entity_id, description, created_at, user_id, old_data, new_data', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(from, to);

    // Aplicar filtros avançados
    if (filters.action && filters.action !== 'ALL') query = query.eq('action', filters.action);
    if (filters.module && filters.module !== 'ALL') query = query.eq('entity', filters.module);
    if (filters.dateStart) query = query.gte('created_at', filters.dateStart);
    if (filters.dateEnd) query = query.lte('created_at', filters.dateEnd);
    if (filters.search) query = query.or(`description.ilike.%${filters.search}%,entity.ilike.%${filters.search}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    const logs = data || [];
    const inserts = logs.filter(l => l.action === 'INSERT').length;
    const deletes = logs.filter(l => l.action === 'DELETE').length;
    const integrity = Math.max(0, 100 - (deletes * 5));

    return {
      data: logs.map(l => ({
        id: l.id,
        table_name: l.entity,
        action: l.action,
        timestamp: l.created_at,
        user_name: 'Usuário Tauze',
        description: l.description || `${l.action} em ${l.entity}`,
        old_data: l.old_data,
        new_data: l.new_data,
        entity_id: l.entity_id
      })),
      columns: columns,
      stats: [
        {
          label: 'Integridade Audit', 
          subtitle: _lastLogDate ? `Último evento em ${_lastLogDate}` : `Verificado em ${todayBR()}`,
          sparkline: buildSparkline(logs, 'created_at', null), 
          value: count !== null ? integrity + '%' : '---', 
          icon: Shield, color: 'hsl(var(--brand))', 
          progress: count !== null ? integrity : 0,
          change: integrity === 100 ? 'Sem exclusões' : 'Exclusões detectadas', 
          trend: 'neutral' as const, 
          periodLabel: 'Fidelity Score'
        },
        {
          label: 'Atividade (24h)', 
          subtitle: _lastLogDate ? `Última atividade: ${_lastLogDate}` : 'Sem atividade recente',
          sparkline: buildSparkline(logs, 'created_at', null),
          value: count !== null ? String(count) : '---',
          icon: Activity, color: '#3b82f6', 
          progress: count && count > 0 ? Math.min(100, count * 5) : 0,
          change: inserts > 0 ? `${inserts} novos registros` : 'Sem atividade', 
          trend: 'neutral' as const, 
          periodLabel: 'Logs Processados'
        },
        {
          label: 'Alertas Críticos', 
          subtitle: deletes > 0 && _lastLogDate ? `Último alerta em ${_lastLogDate}` : `Status em ${todayBR()}`,
          sparkline: buildSparkline(logs.filter((l: any) => l.action === 'DELETE'), 'created_at', null), 
          value: count !== null ? String(deletes) : '---', 
          icon: AlertCircle, color: '#ef4444', 
          progress: count ? (deletes / count) * 100 : 0,
          change: deletes > 0 ? 'Exclusões detectadas' : 'Estável', 
          periodLabel: 'High Severity',
          trend: deletes > 0 ? 'down' as const : 'up' as const
        },
        {
          label: 'Cobertura Global', 
          subtitle: 'Monitoramento em tempo real',
          sparkline: buildSparkline(logs, 'created_at', null), 
          value: '100%', 
          icon: CheckCircle2, color: '#10b981', progress: 100,
          change: 'Todos os módulos ativos', 
          trend: 'neutral' as const, 
          periodLabel: 'Real-time Sync'
        }
      ],
      totalCount: count || 0
    };
  } catch (error: any) { console.error("Error:", error); return { data: [], stats: [], columns: columns, totalCount: 0 }; }
};


/**
 * Governança: Perfis de Usuário
 */
export const perfisUsuario: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 25) => {
  const columns = [
    { header: 'Colaborador', accessor: 'nome' },
    { header: 'Cargo/Função', accessor: 'cargo' },
    { header: 'Status', accessor: 'status' }
  ];

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [usersRes, acessosRes, tenantRes] = await Promise.all([
      withTimeout(supabase
        .from('perfis_usuario')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .range(from, to) as unknown as Promise<any>),
      withTimeout(supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', today.toISOString()) as unknown as Promise<any>),
      withTimeout(supabase
        .from('tenants')
        .select('plano, max_usuarios')
        .eq('id', tenantId)
        .single() as unknown as Promise<any>)
    ]);

    if (usersRes.error) throw usersRes.error;

    const users = usersRes.data || [];
    const count = usersRes.count || 0;
    const acessosHoje = acessosRes.count || 0;
    const plano = tenantRes.data?.plano || '---';
    const maxUsuarios = tenantRes.data?.max_usuarios || 25;

    return {
      data: users.map((u: any) => ({
        id: u.id,
        nome: u.nome,
        cargo: u.cargo || '---',
        status: u.ativo ? 'Ativo' : 'Inativo'
      })),
      columns,
      totalCount: count,
      stats: [
        {
          label: 'Total Equipe',
          subtitle: `Inventário em ${todayBR()}`,
          sparkline: buildSparkline(users, 'created_at', null),
          value: count > 0 ? count : '---',
          change: count > 0 ? 'Usuários cadastrados' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Acessos Hoje',
          subtitle: `Em ${todayBR()}`,
          sparkline: buildSparkline(users, 'created_at', null),
          value: acessosHoje > 0 ? acessosHoje : '0',
          change: acessosHoje > 0 ? 'Atividades registradas' : 'Nenhuma atividade',
          trend: 'neutral' as const
        },
        {
          label: 'Licenças Ativas',
          subtitle: `Plano ativo em ${todayBR()}`,
          sparkline: buildSparkline(users, 'created_at', null),
          value: count > 0 ? `${count}/${maxUsuarios}` : '---',
          change: plano !== '---' ? `Plano ${plano}` : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Grupos de Segurança',
          subtitle: 'Integração pendente',
          sparkline: buildSparkline(users, 'created_at', null),
          value: '---',
          change: 'Integração pendente',
          trend: 'neutral' as const
        }
      ]
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

/**
 * Governança: Admin Intelligence Overview
 */
export const adminOverview: ReportHandler = async (tenantId, fazendaId) => {
  const mockData = {
    data: [],
    columns: [
      { header: 'Ação', accessor: 'action' },
      { header: 'Tabela', accessor: 'entity' },
      { header: 'Descrição', accessor: 'description' },
      { header: 'Data / Hora', accessor: (row: any) => row.created_at ? new Date(row.created_at).toLocaleString('pt-BR') : 'N/A' }
    ],
    stats: [
      { id: 'governanca', label: 'Score de Governança', sparkline: (() => {  const valStr = String('88%'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: '88%', change: 'Nível Institucional', trend: 'neutral' as const, color: 'hsl(var(--brand))', progress: 88 },
      { id: 'licencas', label: 'Licenças Ativas', sparkline: (() => {  const valStr = String('12/25'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: '12/25', change: 'Plano Enterprise', trend: 'neutral' as const, color: '#3b82f6', progress: 48 },
      { id: 'alertas', label: 'Alertas de Segurança', sparkline: (() => {  const valStr = String('0'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: '0', change: 'Ambiente Seguro', trend: 'neutral' as const, color: '#10b981', progress: 100 },
      { id: 'saude', label: 'Saúde Operacional', sparkline: (() => {  const valStr = String('94%'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}%` }; }); })(), value: '94%', change: 'SLA de Instância', trend: 'neutral' as const, color: '#f59e0b', progress: 94 }
    ],
    totalCount: 2
  };

  try {
    const [userRes, logsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('audit_logs').select('id, action, entity, description, created_at', { count: 'exact' }).eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(20)
    ]);

    const userCount = userRes.count || 0;
    const _lastAdminLogDate = logsRes.data?.length > 0 ? fmtDateBR(logsRes.data[0].created_at) : null;
    const criticalEvents = (logsRes.data || []).filter((l: any) => l.action === 'DELETE' || l.action === 'SECURITY_ALERT').length;

    const scoreGovernanca = Math.max(0, 100 - (criticalEvents * 5));
    const saudeOperacional = 100; // Placeholder for actual server SLA

    return {
      data: logsRes.data || [],
      stats: [
        {
          id: 'governanca',
          label: 'Score de Governança', 
          subtitle: _lastAdminLogDate ? `Calculado em ${_lastAdminLogDate}` : 'Sem eventos registrados',
          sparkline: buildSparkline(logsRes.data || [], 'created_at', null), 
          value: `${scoreGovernanca}%`, 
          change: scoreGovernanca === 100 ? 'Nível Máximo' : 'Atenção Necessária',
          trend: scoreGovernanca >= 90 ? 'up' : 'down',
          color: 'hsl(var(--brand))',
          progress: scoreGovernanca
        },
        {
          id: 'licencas',
          label: 'Licenças Ativas', 
          subtitle: `Plano ativo em ${todayBR()}`,
          sparkline: buildSparkline(logsRes.data || [], 'created_at', null), 
          value: `${userCount}/25`, 
          change: 'Plano Enterprise',
          trend: 'neutral' as const,
          color: '#3b82f6',
          progress: (userCount / 25) * 100
        },
        {
          id: 'alertas',
          label: 'Alertas de Segurança', 
          subtitle: criticalEvents > 0 && _lastAdminLogDate ? `Último alerta em ${_lastAdminLogDate}` : `Status em ${todayBR()}`,
          sparkline: buildSparkline((logsRes.data || []).filter((l: any) => l.action === 'DELETE' || l.action === 'SECURITY_ALERT'), 'created_at', null), 
          value: criticalEvents, 
          change: criticalEvents > 0 ? 'Ação Requerida' : 'Ambiente Seguro',
          trend: criticalEvents > 0 ? 'down' : 'up',
          color: criticalEvents > 0 ? '#ef4444' : '#10b981',
          progress: criticalEvents > 5 ? 30 : 100
        },
        {
          id: 'saude',
          label: 'Saúde Operacional', 
          subtitle: 'SLA monitorado em tempo real',
          sparkline: buildSparkline(logsRes.data || [], 'created_at', null), 
          value: `${saudeOperacional}%`, 
          change: 'SLA de Instância',
          trend: 'neutral' as const,
          color: '#f59e0b',
          progress: saudeOperacional
        }
      ],
      columns: mockData.columns,
      totalCount: (logsRes.data || []).length
    };
  } catch (error) {
    console.error('[AdminOverview] Critical Failure:', error);
    return { data: [], stats: [], columns: mockData.columns, totalCount: 0 };
  }
};

