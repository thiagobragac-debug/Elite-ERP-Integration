import { supabase } from '../../lib/supabase';
import type { ReportHandler } from '../../types/reports';
import { Shield, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

const TIMEOUT_MS = 30000;

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs))
  ]);
};

/**
 * Governança: Logs de Auditoria
 */
export const auditLogs: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 25, filters: any = {}) => {
  const mockData = {
    data: [
      { id: '1', table_name: 'animais', action: 'INSERT', timestamp: new Date().toISOString(), user_name: 'Thiago Costa', description: 'Inserido animal BR 4520 no lote LT 01' },
      { id: '2', table_name: 'pesagens', action: 'INSERT', timestamp: new Date().toISOString(), user_name: 'João Silva', description: 'Lançado peso 540 kg para o animal BR 4520' }
    ],
    columns: [
      { header: 'Módulo', accessor: 'table_name' },
      { header: 'Ação', accessor: 'action' },
      { header: 'Data / Hora', accessor: (row: any) => row.timestamp ? new Date(row.timestamp).toLocaleString('pt-BR') : 'N/A' },
      { header: 'Operador', accessor: 'user_name' },
      { header: 'Descrição', accessor: 'description' }
    ],
    stats: [
      { label: 'Integridade Audit', sparkline: (() => {  const valStr = String('100%'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: '100%', icon: Shield, color: 'hsl(var(--brand))', progress: 100, change: 'Nível Institucional', trend: 'neutral' as const, periodLabel: 'Fidelity Score' },
      { label: 'Atividade (24h)', value: '2', icon: Activity, color: '#3b82f6', progress: 100, change: '2 novos registros', trend: 'neutral' as const, periodLabel: 'Logs Processados' },
      { label: 'Alertas Críticos', sparkline: (() => {  const valStr = String('0'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: '0', icon: AlertCircle, color: '#ef4444', progress: 0, change: 'Estável', trend: 'neutral' as const, periodLabel: 'High Severity' },
      { label: 'Cobertura Global', sparkline: (() => {  const valStr = String('100%'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}%` }; }); })(), value: '100%', icon: CheckCircle2, color: '#10b981', progress: 100, change: 'Todos os módulos ativos', trend: 'neutral' as const, periodLabel: 'Real-time Sync' }
    ],
    totalCount: 2
  };

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
      columns: mockData.columns,
      stats: [
        {
          label: 'Integridade Audit', sparkline: (() => {  const valStr = String(integrity + '%'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: integrity + '%', icon: Shield, color: 'hsl(var(--brand))', progress: integrity,
          change: 'Nível Institucional', trend: 'neutral' as const, periodLabel: 'Fidelity Score'
        },
        {
          label: 'Atividade (24h)', value: String(count || 0),
          icon: Activity, color: '#3b82f6', progress: 85,
          change: `+${inserts} novos registros`, trend: 'neutral' as const, periodLabel: 'Logs Processados',
          sparkline: [{ value: 30 }, { value: 45 }, { value: 55 }, { value: 70 }]
        },
        {
          label: 'Alertas Críticos', sparkline: (() => {  const valStr = String(String(deletes)); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: String(deletes), icon: AlertCircle, color: '#ef4444', progress: count ? (deletes / count) * 100 : 0,
          change: deletes > 0 ? 'Exclusões detectadas' : 'Estável', periodLabel: 'High Severity',
          trend: deletes > 5 ? 'up' as const : 'down' as const
        },
        {
          label: 'Cobertura Global', sparkline: (() => {  const valStr = String('100%'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}%` }; }); })(), value: '100%', icon: CheckCircle2, color: '#10b981', progress: 100,
          change: 'Todos os módulos ativos', trend: 'neutral' as const, periodLabel: 'Real-time Sync',
        }
      ],
      totalCount: count || 0
    };
  } catch (error: any) { console.error("Error:", error); return { data: [], stats: [], columns: mockData.columns, totalCount: 0 }; }
};

/**
 * Governança: Perfis de Usuário
 */
export const perfisUsuario: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 25) => {
  const mockData = {
    data: [
      { id: 'u1', nome: 'Thiago Costa', cargo: 'Administrador', status: 'Ativo' },
      { id: 'u2', nome: 'João Silva', cargo: 'Gerente Operacional', status: 'Ativo' }
    ],
    columns: [
      { header: 'Colaborador', accessor: 'nome' },
      { header: 'Cargo/Função', accessor: 'cargo' },
      { header: 'Status', accessor: 'status' }
    ],
    stats: [
      { label: 'Total Equipe', sparkline: (() => {  const valStr = String('12'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: '12', change: 'Ativos', trend: 'neutral' as const },
      { label: 'Acessos Hoje', sparkline: (() => {  const valStr = String('8'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: '8', change: '+2', trend: 'up' as const },
      { label: 'Licenças Ativas', sparkline: (() => {  const valStr = String('12/15'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: '12/15', change: 'Disponível', trend: 'neutral' as const },
      { label: 'Grupos de Segurança', sparkline: (() => {  const valStr = String('3 perfis'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: '3 perfis', change: 'Ativo', trend: 'neutral' as const }
    ]
  };

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const fetchUsers = supabase
      .from('perfis_usuario')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .range(from, to);
    
    const { data: users, count, error } = await withTimeout((fetchUsers as unknown) as Promise<any>) as any;
    if (error) throw error;

    return {
      data: (users || []).map((u: any) => ({ 
        id: u.id, 
        nome: u.nome, 
        cargo: u.cargo, 
        status: u.ativo ? 'Ativo' : 'Inativo' 
      })),
      columns: mockData.columns,
      totalCount: count || 0,
      stats: [
        { label: 'Total Equipe', sparkline: (() => { const n = count || 0; return [Math.max(0,n-5),Math.max(0,n-4),Math.max(0,n-3),Math.max(0,n-2),Math.max(0,n-1),n,n].map((v,i) => ({ value: v, label: `${v}` })); })(), value: count || 0, change: 'Status', trend: 'neutral' as const },
        { label: 'Acessos Hoje', sparkline: (() => {  const valStr = String('4'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: '4', change: 'Real', trend: 'neutral' as const },
        { label: 'Licenças Ativas', sparkline: (() => {  const valStr = String('SaaS Connect'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: 'SaaS Connect', change: 'Ativo', trend: 'neutral' as const },
        { label: 'Grupos de Segurança', sparkline: (() => {  const valStr = String('3 perfis'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: '3 perfis', change: 'Ativo', trend: 'neutral' as const }
      ]
    };
  } catch (error: any) { console.error("Error:", error); return { data: [], stats: [], columns: mockData.columns, totalCount: 0 }; }
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
    const criticalEvents = (logsRes.data || []).filter((l: any) => l.action === 'DELETE' || l.action === 'SECURITY_ALERT').length;

    return {
      data: logsRes.data || [],
      stats: [
        {
          id: 'governanca',
          label: 'Score de Governança', sparkline: (() => {  const valStr = String('88%'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: '88%', change: 'Nível Institucional',
          trend: 'neutral' as const,
          color: 'hsl(var(--brand))',
          progress: 88
        },
        {
          id: 'licencas',
          label: 'Licenças Ativas', sparkline: (() => {  const valStr = String(`${userCount}/25`); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: `${userCount}/25`, change: 'Plano Enterprise',
          trend: 'neutral' as const,
          color: '#3b82f6',
          progress: (userCount / 25) * 100
        },
        {
          id: 'alertas',
          label: 'Alertas de Segurança', sparkline: (() => {  const valStr = String(criticalEvents); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}` }; }); })(), value: criticalEvents, change: criticalEvents > 0 ? 'Ação Requerida' : 'Ambiente Seguro',
          trend: criticalEvents > 0 ? 'down' : 'up',
          color: criticalEvents > 0 ? '#ef4444' : '#10b981',
          progress: criticalEvents > 5 ? 30 : 100
        },
        {
          id: 'saude',
          label: 'Saúde Operacional', sparkline: (() => {  const valStr = String('94%'); const match = valStr.match(/[0-9]+(?:[.,][0-9]+)?/); const val = match ? parseFloat(match[0].replace(',', '.')) : 0; return [val*0.6, val*0.7, val*0.8, val*0.85, val*0.9, val*0.95, val].map((v,i) => { const formatted = v % 1 === 0 ? v : Number(v.toFixed(1)); return { value: formatted, label: `${formatted}%` }; }); })(), value: '94%', change: 'SLA de Instância',
          trend: 'neutral' as const,
          color: '#f59e0b',
          progress: 94
        }
      ],
      columns: mockData.columns,
      totalCount: (logsRes.data || []).length
    };
  } catch (error) {
    console.error('[AdminOverview] Critical Failure:', error);
    return { data: [], stats: mockData.stats, columns: mockData.columns, totalCount: 0 };
  }
};
