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
const periodoBR = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} – ${todayBR()}`;
};

const TIMEOUT_MS = 30000;

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs))
  ]);
};

const fmt = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
 * Financeiro: Fluxo de Caixa
 * Combina contas_pagar + contas_receber com KPIs via RPC
 */
export const fluxoCaixa: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 50) => {
  const columns = [
    { header: 'Descrição', accessor: 'description' },
    { header: 'Categoria', accessor: 'category' },
    { header: 'Valor', accessor: (row: any) => row.amount ? fmt(row.amount) : 'R$ 0,00' },
    { header: 'Vencimento / Data', accessor: (row: any) => row.date ? new Date(row.date).toLocaleDateString('pt-BR') : 'N/A' },
    { header: 'Tipo', accessor: (row: any) => row.type === 'inflow' ? '🟢 Entrada' : '🔴 Saída' },
    { header: 'Status', accessor: (row: any) => row.status === 'paid' ? '✅ Liquidado' : '⏳ Pendente' }
  ];

  try {
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const today = new Date().toISOString().split('T')[0];

    const [bankRes, payRes, recRes, flowStatsRes] = await Promise.all([
      withTimeout(supabase.rpc('get_banking_consolidated_balance', { p_tenant_id: tenantId, p_fazenda_id: fazendaId }) as unknown as Promise<any>),
      withTimeout(supabase.from('contas_pagar').select('*', { count: 'exact' }).match(scope).order('data_vencimento', { ascending: false }).range(from, to) as unknown as Promise<any>),
      withTimeout(supabase.from('contas_receber').select('*', { count: 'exact' }).match(scope).order('data_vencimento', { ascending: false }).range(from, to) as unknown as Promise<any>),
      withTimeout(supabase.rpc('calculate_cash_flow_summary', { p_tenant_id: tenantId, p_fazenda_id: fazendaId }) as unknown as Promise<any>)
    ]);

    if (payRes.error) throw payRes.error;
    if (recRes.error) throw recRes.error;

    const totalBalance = Number(bankRes.data?.total_balance || bankRes.data?.saldo_total || 0);
    const inMonth = Number(flowStatsRes.data?.inMonth || 0);
    const outMonth = Number(flowStatsRes.data?.outMonth || 0);
    const netMonth = inMonth - outMonth;

    // Runway: meses de fôlego com base no burn rate mensal
    const runway = outMonth > 0 ? (totalBalance / outMonth).toFixed(1) : '---';

    const pageTx = [
      ...(payRes.data || []).map((p: any) => ({
        ...p,
        date: p.data_vencimento,
        amount: Number(p.valor_total || 0),
        type: 'outflow',
        category: p.categoria || 'Despesa Operacional',
        description: p.descricao || '---',
        status: p.status === 'PAGO' ? 'paid' : 'pending',
        entity: 'contas_pagar'
      })),
      ...(recRes.data || []).map((r: any) => ({
        ...r,
        date: r.data_vencimento,
        amount: Number(r.valor_total || 0),
        type: 'inflow',
        category: r.categoria || 'Receita Bruta',
        description: r.descricao || '---',
        status: r.status === 'PAGO' ? 'paid' : 'pending',
        entity: 'contas_receber'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calcular vencidos reais nos dados carregados
    const vencidosPagar = (payRes.data || []).filter((p: any) =>
      p.status !== 'PAGO' && p.data_vencimento && p.data_vencimento < today
    ).length;

    const spPagar = buildSparkline(payRes.data || [], 'data_vencimento', 'valor_total');
    const spReceber = buildSparkline(recRes.data || [], 'data_vencimento', 'valor_total');

    return {
      data: pageTx,
      columns,
      stats: [
        {
          id: 'patrimonio',
          label: 'Patrimônio Líquido',
          subtitle: `Saldo em ${todayBR()}`,
          sparkline: spReceber.length > 0 ? spReceber : spPagar,
          value: totalBalance !== 0 ? fmt(totalBalance) : '---',
          change: vencidosPagar > 0 ? `${vencidosPagar} títulos vencidos` : 'Consolidado',
          trend: 'neutral' as const,
          color: '#10b981',
          progress: 100
        },
        {
          id: 'resultado',
          label: 'Resultado Operacional',
          subtitle: `Período: ${periodoBR()}`,
          sparkline: spReceber,
          value: inMonth > 0 || outMonth > 0 ? fmt(netMonth) : '---',
          change: inMonth > 0 || outMonth > 0 ? 'Mês Atual' : 'Sem lançamentos',
          trend: netMonth >= 0 ? 'up' as const : 'down' as const,
          color: '#3b82f6',
          progress: inMonth > 0 ? Math.min(100, Math.max(0, (inMonth / (outMonth || 1)) * 50)) : 0
        },
        {
          id: 'runway',
          label: 'Runway / Fôlego',
          subtitle: 'Com base no burn rate atual',
          sparkline: spPagar,
          value: runway !== '---' ? `${runway} meses` : '---',
          change: runway !== '---' ? (Number(runway) > 12 ? 'Excelente' : 'Atenção') : 'Sem burn rate',
          trend: runway !== '---' && Number(runway) > 6 ? 'up' as const : 'neutral' as const,
          color: '#8b5cf6',
          progress: runway !== '---' ? Math.min(100, (parseFloat(runway) / 24) * 100) : 0
        },
        {
          id: 'entradas',
          label: 'Entradas (Mês)',
          subtitle: `Referência: ${monthYearBR()}`,
          sparkline: spReceber,
          value: inMonth > 0 ? fmt(inMonth) : '---',
          change: inMonth > 0 ? 'Realizado' : 'Sem entradas',
          trend: inMonth > 0 ? 'up' as const : 'neutral' as const,
          color: '#10b981',
          progress: inMonth > 0 ? 100 : 0
        }
      ],
      totalCount: (payRes.count || 0) + (recRes.count || 0)
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

/**
 * Financeiro: Contas a Pagar
 */
export const contasPagar: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 25, filters: any = {}) => {
  const columns = [
    { header: 'Descrição', accessor: 'descricao' },
    { header: 'Fornecedor', accessor: (row: any) => row.parceiros?.nome || row.fornecedores?.nome || '---' },
    { header: 'Valor Total', accessor: (row: any) => row.valor_total ? fmt(Number(row.valor_total)) : 'R$ 0,00' },
    { header: 'Vencimento', accessor: (row: any) => row.data_vencimento ? new Date(row.data_vencimento).toLocaleDateString('pt-BR') : '---' },
    { header: 'Status', accessor: (row: any) => row.status === 'PAGO' ? '✅ Pago' : '⏳ Pendente' }
  ];

  try {
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('contas_pagar')
      .select('*, parceiros(nome)', { count: 'exact' })
      .match(scope)
      .order('data_vencimento', { ascending: true })
      .range(from, to);

    if (filters.status && filters.status !== 'all' && filters.status !== 'TODAS') query = query.eq('status', filters.status);
    if (filters.search) query = query.ilike('descricao', `%${filters.search}%`);
    if (filters.dateStart) query = query.gte('data_vencimento', filters.dateStart);
    if (filters.dateEnd) query = query.lte('data_vencimento', filters.dateEnd);

    const [billsRes, summaryRes] = await Promise.all([
      withTimeout(query as unknown as Promise<any>),
      withTimeout(supabase.rpc('get_finance_summary', {
        p_table_name: 'contas_pagar',
        p_tenant_id: tenantId,
        p_fazenda_id: fazendaId
      }) as unknown as Promise<any>)
    ]);

    if (billsRes.error) throw billsRes.error;

    const bills = billsRes.data || [];
    const totalPendente = Number(summaryRes.data?.find((s: any) => s.status === 'PENDENTE')?.total_value || 0);
    const totalPago = Number(summaryRes.data?.find((s: any) => s.status === 'PAGO')?.total_value || 0);

    // Calcular vencidos reais nos dados carregados
    const vencidos = bills.filter((b: any) =>
      b.status !== 'PAGO' && b.data_vencimento && b.data_vencimento < today
    ).length;

    // Eficiência: proporção do total já pago
    const totalGeral = totalPendente + totalPago;
    const eficiencia = totalGeral > 0 ? ((totalPago / totalGeral) * 100).toFixed(0) + '%' : '---';

    const spBills = buildSparkline(bills, 'data_vencimento', 'valor_total');

    // Real dates from payables
    const _nextDuePagar = earliestPending(bills, 'data_vencimento');
    const _lastPaidPagar = latestPaid(bills, 'data_vencimento');
    const _lastBillDatePagar = latestDate(bills, 'data_vencimento');

    return {
      data: bills,
      columns,
      stats: [
        {
          label: 'Passivo Circulante',
          subtitle: _nextDuePagar ? `Próx. vencimento: ${_nextDuePagar}` : `Posição em ${todayBR()}`,
          sparkline: spBills,
          value: totalPendente > 0 ? fmt(totalPendente) : '---',
          color: '#6366f1',
          progress: totalPendente > 0 ? 100 : 0,
          change: vencidos > 0 ? `${vencidos} títulos vencidos` : 'Em dia',
          periodLabel: 'Próximos 30 dias',
          trend: vencidos > 0 ? 'down' as const : 'neutral' as const
        },
        {
          label: 'Total Liquidado',
          subtitle: _lastPaidPagar ? `Último pagamento: ${_lastPaidPagar}` : `Histórico até ${todayBR()}`,
          sparkline: spBills,
          value: totalPago > 0 ? fmt(totalPago) : '---',
          color: '#10b981',
          progress: totalPago > 0 ? 100 : 0,
          change: totalPago > 0 ? 'Histórico' : 'Sem pagamentos',
          periodLabel: 'Histórico',
          trend: totalPago > 0 ? 'up' as const : 'neutral' as const
        },
        {
          label: 'Volume de Títulos',
          subtitle: _lastBillDatePagar ? `Emissão até ${_lastBillDatePagar}` : `Em ${todayBR()}`,
          sparkline: buildSparkline(bills, 'data_vencimento', null),
          value: billsRes.count !== null ? String(billsRes.count) : '---',
          color: '#ef4444',
          progress: billsRes.count ? 100 : 0,
          change: billsRes.count > 0 ? 'Total localizado' : 'Sem registros',
          periodLabel: 'Total',
          trend: 'neutral' as const
        },
        {
          label: 'Eficiência Pagamento',
          subtitle: `Taxa até ${todayBR()}`,
          sparkline: spBills,
          value: eficiencia,
          color: '#f59e0b',
          progress: totalGeral > 0 ? (totalPago / totalGeral) * 100 : 0,
          change: totalGeral > 0 ? 'Títulos pagos / total' : 'Sem dados',
          periodLabel: 'Taxa liquidação',
          trend: 'neutral' as const
        }
      ],
      totalCount: billsRes.count || 0
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

/**
 * Financeiro: Contas a Receber
 */
export const contasReceber: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 25, filters: any = {}) => {
  const columns = [
    { header: 'Descrição', accessor: 'descricao' },
    { header: 'Cliente', accessor: (row: any) => row.parceiros?.nome || row.clientes?.nome || '---' },
    { header: 'Valor Total', accessor: (row: any) => row.valor_total ? fmt(Number(row.valor_total)) : 'R$ 0,00' },
    { header: 'Vencimento', accessor: (row: any) => row.data_vencimento ? new Date(row.data_vencimento).toLocaleDateString('pt-BR') : '---' },
    { header: 'Status', accessor: (row: any) => row.status === 'PAGO' ? '✅ Recebido' : '⏳ Pendente' }
  ];

  try {
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('contas_receber')
      .select('*, parceiros(nome)', { count: 'exact' })
      .match(scope)
      .order('data_vencimento', { ascending: true })
      .range(from, to);

    if (filters.status && filters.status !== 'all' && filters.status !== 'TODAS') query = query.eq('status', filters.status);
    if (filters.search) query = query.ilike('descricao', `%${filters.search}%`);

    const [billsRes, summaryRes] = await Promise.all([
      withTimeout(query as unknown as Promise<any>),
      withTimeout(supabase.rpc('get_finance_summary', {
        p_table_name: 'contas_receber',
        p_tenant_id: tenantId,
        p_fazenda_id: fazendaId
      }) as unknown as Promise<any>)
    ]);

    if (billsRes.error) throw billsRes.error;

    const bills = billsRes.data || [];
    const totalPendente = Number(summaryRes.data?.find((s: any) => s.status === 'PENDENTE')?.total_value || 0);
    const totalRecebido = Number(summaryRes.data?.find((s: any) => s.status === 'PAGO')?.total_value || 0);

    // Inadimplência: títulos vencidos e ainda não pagos (calculado nos dados reais)
    const vencidos = bills.filter((b: any) =>
      b.status !== 'PAGO' && b.data_vencimento && b.data_vencimento < today
    ).length;

    // Eficiência de cobrança real: recebido / (recebido + pendente) * 100
    const totalGeral = totalRecebido + totalPendente;
    const eficiencia = totalGeral > 0 ? ((totalRecebido / totalGeral) * 100).toFixed(0) + '%' : '---';

    const spRec = buildSparkline(bills, 'data_vencimento', 'valor_total');

    // Real dates from receivables
    const _nextDueRec = earliestPending(bills, 'data_vencimento');
    const _lastReceivedDate = latestPaid(bills, 'data_vencimento');
    const _lastBillDateRec = latestDate(bills, 'data_vencimento');

    return {
      data: bills,
      columns,
      stats: [
        {
          label: 'Ativo Circulante',
          subtitle: _nextDueRec ? `Próx. recebimento: ${_nextDueRec}` : `Posição em ${todayBR()}`,
          sparkline: spRec,
          value: totalPendente > 0 ? fmt(totalPendente) : '---',
          color: '#10b981',
          progress: totalPendente > 0 ? 100 : 0,
          change: vencidos > 0 ? `${vencidos} títulos em atraso` : 'Em dia',
          periodLabel: 'A Receber',
          trend: vencidos > 0 ? 'down' as const : 'up' as const
        },
        {
          label: 'Total Recebido',
          subtitle: _lastReceivedDate ? `Último recebimento: ${_lastReceivedDate}` : `Histórico até ${todayBR()}`,
          sparkline: spRec,
          value: totalRecebido > 0 ? fmt(totalRecebido) : '---',
          color: '#3b82f6',
          progress: totalRecebido > 0 ? 100 : 0,
          change: totalRecebido > 0 ? 'Histórico' : 'Sem recebimentos',
          periodLabel: 'Histórico',
          trend: totalRecebido > 0 ? 'up' as const : 'neutral' as const
        },
        {
          label: 'Volume de Títulos',
          subtitle: _lastBillDateRec ? `Emissão até ${_lastBillDateRec}` : `Em ${todayBR()}`,
          sparkline: buildSparkline(bills, 'data_vencimento', null),
          value: billsRes.count !== null ? String(billsRes.count) : '---',
          color: '#6366f1',
          progress: billsRes.count ? 100 : 0,
          change: billsRes.count > 0 ? 'Total localizado' : 'Sem registros',
          periodLabel: 'Total',
          trend: 'neutral' as const
        },
        {
          label: 'Eficiência de Cobrança',
          subtitle: `Taxa até ${todayBR()}`,
          sparkline: spRec,
          value: eficiencia,
          color: '#8b5cf6',
          progress: totalGeral > 0 ? (totalRecebido / totalGeral) * 100 : 0,
          change: totalGeral > 0 ? `${vencidos} inadimplentes` : 'Sem dados',
          periodLabel: 'Taxa de Recebimento',
          trend: 'neutral' as const
        }
      ],
      totalCount: billsRes.count || 0
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

/**
 * Financeiro: Extrato Bancário
 */
export const extratoBancario: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 20) => {
  const columns = [
    { header: 'Banco', accessor: 'banco' },
    { header: 'Conta', accessor: 'conta' },
    { header: 'Tipo', accessor: 'tipo' },
    { header: 'Saldo Atual', accessor: 'saldo' }
  ];

  try {
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [contasRes, summaryRes] = await Promise.all([
      withTimeout(supabase
        .from('contas_bancarias')
        .select('*', { count: 'exact' })
        .match(scope)
        .range(from, to) as unknown as Promise<any>),
      withTimeout(supabase.rpc('get_banking_consolidated_balance', {
        p_tenant_id: tenantId,
        p_fazenda_id: fazendaId
      }) as unknown as Promise<any>)
    ]);

    if (contasRes.error) throw contasRes.error;

    const contas = contasRes.data || [];
    const saldoTotal = Number(summaryRes.data?.saldo_total || summaryRes.data?.total_balance || 0);
    const contasAtivas = summaryRes.data?.contas_ativas || contasRes.count || 0;

    // Liquidez imediata = saldo de contas correntes (tipo = 'corrente')
    const liquidezImediata = contas
      .filter((c: any) => c.tipo?.toLowerCase() === 'corrente' || c.tipo?.toLowerCase() === 'checking')
      .reduce((acc: number, c: any) => acc + Number(c.saldo_atual || 0), 0);

    // Sparkline de saldo por conta (distribui saldos pelas contas como pontos)
    const spContas = contas.length > 0
      ? contas.map((c: any, i: number) => ({ value: Number(c.saldo_atual || 0), label: `C${i + 1}` }))
      : [];

    // Real date from bank accounts
    const _lastBankDate = contas.length > 0
      ? (latestDate(contas, 'updated_at') || latestDate(contas, 'created_at'))
      : null;

    return {
      data: contas.map((c: any) => ({
        id: c.id,
        banco: c.banco || c.nome_banco || '---',
        conta: c.conta || c.numero_conta || '---',
        saldo: c.saldo_atual !== undefined ? fmt(Number(c.saldo_atual)) : '---',
        tipo: c.tipo || '---'
      })),
      columns,
      stats: [
        {
          label: 'Saldo Consolidado',
          subtitle: _lastBankDate ? `Sincronizado em ${_lastBankDate}` : `Posição em ${todayBR()}`,
          sparkline: spContas,
          value: saldoTotal !== 0 ? fmt(saldoTotal) : '---',
          change: saldoTotal > 0 ? 'Total auditado' : saldoTotal < 0 ? 'Negativo!' : 'Sem saldo',
          trend: saldoTotal > 0 ? 'up' as const : 'neutral' as const
        },
        {
          label: 'Contas Ativas',
          subtitle: _lastBankDate ? `Cadastro em ${_lastBankDate}` : `Inventário em ${todayBR()}`,
          sparkline: spContas,
          value: contasAtivas > 0 ? String(contasAtivas) : '---',
          change: contasAtivas > 0 ? 'Contas cadastradas' : 'Sem contas',
          trend: 'neutral' as const
        },
        {
          label: 'Liquidez Imediata',
          subtitle: _lastBankDate ? `Disponível em ${_lastBankDate}` : `Disponível em ${todayBR()}`,
          sparkline: spContas,
          value: liquidezImediata > 0 ? fmt(liquidezImediata) : saldoTotal > 0 ? fmt(saldoTotal) : '---',
          change: liquidezImediata > 0 ? 'Contas correntes' : 'Ver saldo total',
          trend: 'neutral' as const
        },
        {
          label: 'Bancos Conectados',
          subtitle: _lastBankDate ? `Sincronizado em ${_lastBankDate}` : `Sincronizado em ${todayBR()}`,
          sparkline: spContas,
          value: contasRes.count !== null && contasRes.count > 0 ? String(contasRes.count) : '---',
          change: contasRes.count > 0 ? 'Sincronizado' : 'Nenhuma conta',
          trend: 'neutral' as const
        }
      ],
      totalCount: contasRes.count || 0
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

/**
 * Financeiro: Intelligence Overview (KPIs + Insights)
 */
export const financeOverview: ReportHandler = async (tenantId, fazendaId) => {
  const columns = [
    { header: 'Insight / Oportunidade', accessor: 'title' },
    { header: 'Detalhes', accessor: 'desc' },
    { header: 'Impacto', accessor: (row: any) => row.impact || 'MÉDIO' }
  ];

  try {
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };
    const today = new Date().toISOString().split('T')[0];

    const [bankRes, payableRes, receivableRes] = await Promise.all([
      withTimeout(supabase.rpc('get_banking_consolidated_balance', { p_tenant_id: tenantId, p_fazenda_id: fazendaId }) as unknown as Promise<any>),
      withTimeout(supabase.from('contas_pagar').select('valor_total, status, data_vencimento').match(scope) as unknown as Promise<any>),
      withTimeout(supabase.from('contas_receber').select('valor_total, status, data_vencimento').match(scope) as unknown as Promise<any>)
    ]);

    const totalBalance = Number(bankRes.data?.saldo_total || bankRes.data?.total_balance || 0);

    const payables = payableRes.data || [];
    const receivables = receivableRes.data || [];

    const totalPayable = payables
      .filter((p: any) => p.status !== 'PAGO')
      .reduce((acc: number, p: any) => acc + Number(p.valor_total || 0), 0);

    const totalReceivable = receivables
      .filter((r: any) => r.status !== 'PAGO')
      .reduce((acc: number, r: any) => acc + Number(r.valor_total || 0), 0);

    const overduePayable = payables.filter((p: any) =>
      p.status !== 'PAGO' && p.data_vencimento && p.data_vencimento < today
    ).length;

    const overdueReceivable = receivables.filter((r: any) =>
      r.status !== 'PAGO' && r.data_vencimento && r.data_vencimento < today
    ).length;

    // Índice de Liquidez Corrente: (Caixa + A Receber) / A Pagar
    const currentRatio = totalPayable > 0
      ? ((totalBalance + totalReceivable) / totalPayable)
      : totalBalance > 0 ? 9.9 : 0;

    // Runway: meses de autonomia baseado no burn rate mensal aproximado (A Pagar / 3 meses)
    const monthlyBurnEstimate = totalPayable > 0 ? totalPayable / 3 : 0;
    const runway = monthlyBurnEstimate > 0 ? (totalBalance / monthlyBurnEstimate).toFixed(1) : null;

    // EBITDA estimado = 22% das receitas brutas a receber (margem operacional típica agro)
    const ebitdaEstimado = totalReceivable > 0 ? totalReceivable * 0.22 : 0;

    const hasData = totalBalance > 0 || totalPayable > 0 || totalReceivable > 0;

    const insights = hasData ? [
      totalReceivable > 0 && {
        id: 1,
        type: 'opportunity',
        title: 'Otimização de Fluxo',
        desc: `Você tem ${fmt(totalReceivable)} a receber. Antecipar 20% pode melhorar liquidez imediata.`,
        impact: 'ALTO',
        color: '#10b981'
      },
      overduePayable > 0 && {
        id: 2,
        type: 'warning',
        title: 'Títulos Vencidos a Pagar',
        desc: `${overduePayable} título(s) de contas a pagar estão vencidos. Risco de multa e juros.`,
        impact: 'ALTO',
        color: '#ef4444'
      },
      overdueReceivable > 0 && {
        id: 3,
        type: 'warning',
        title: 'Inadimplência Detectada',
        desc: `${overdueReceivable} título(s) a receber em atraso. Acionar cobrança.`,
        impact: 'MÉDIO',
        color: '#f59e0b'
      },
      currentRatio > 0 && currentRatio < 1.5 && {
        id: 4,
        type: 'warning',
        title: 'Liquidez Abaixo do Ideal',
        desc: `Índice de liquidez em ${currentRatio.toFixed(2)} (ideal > 1.5). Reforçar capital de giro.`,
        impact: 'ALTO',
        color: '#ef4444'
      }
    ].filter(Boolean) : [];

    const spPay = buildSparkline(payables, 'data_vencimento', 'valor_total');
    const spReceive = buildSparkline(receivables, 'data_vencimento', 'valor_total');

    return {
      data: insights,
      stats: [
        {
          id: 'patrimonio',
          label: 'Patrimônio Líquido Real',
          subtitle: `Saldo em ${todayBR()}`,
          sparkline: spReceive.length > 0 ? spReceive : spPay,
          value: totalBalance !== 0 ? fmt(totalBalance) : '---',
          change: totalBalance !== 0 ? 'Consolidado bancário' : 'Sem dados',
          trend: totalBalance > 0 ? 'up' as const : 'neutral' as const,
          color: '#10b981',
          progress: totalBalance > 0 ? 100 : 0,
          periodLabel: 'Saldo total'
        },
        {
          id: 'ebitda',
          label: 'EBITDA Estimado (22% A/R)',
          subtitle: 'Estimativa sobre A/R atual',
          sparkline: spReceive,
          value: ebitdaEstimado > 0 ? fmt(ebitdaEstimado) : '---',
          change: ebitdaEstimado > 0 ? 'Margem op. estimada 22%' : 'Sem dados',
          trend: 'neutral' as const,
          color: '#3b82f6',
          progress: ebitdaEstimado > 0 ? Math.min(100, (ebitdaEstimado / (totalReceivable || 1)) * 100) : 0,
          periodLabel: 'Estimativa s/ A/R'
        },
        {
          id: 'runway',
          label: 'Runway (Fôlego)',
          subtitle: 'Baseado no burn rate médio',
          sparkline: spPay,
          value: runway ? `${runway} meses` : '---',
          change: runway ? (Number(runway) > 6 ? 'Estável' : 'Atenção') : 'Sem dados',
          trend: runway && Number(runway) > 6 ? 'up' as const : 'neutral' as const,
          color: '#8b5cf6',
          progress: runway ? Math.min(100, (parseFloat(runway) / 24) * 100) : 0,
          periodLabel: 'Autonomia de Caixa'
        },
        {
          id: 'liquidez',
          label: 'Índice de Liquidez',
          subtitle: `Calculado em ${todayBR()}`,
          sparkline: spReceive,
          value: currentRatio > 0 ? currentRatio.toFixed(2) : '---',
          change: currentRatio > 0 ? (currentRatio > 1.5 ? 'Saudável ✅' : 'Atenção ⚠️') : 'Sem dados',
          trend: currentRatio > 1.5 ? 'up' as const : currentRatio > 0 ? 'down' as const : 'neutral' as const,
          color: '#f59e0b',
          progress: currentRatio > 0 ? Math.min(100, (currentRatio / 3) * 100) : 0,
          periodLabel: 'Meta: > 1.50'
        }
      ],
      columns,
      totalCount: insights.length,
      healthScore: currentRatio > 0 ? Math.min(100, Math.floor(currentRatio * 30)) : 0
    };
  } catch (error) {
    console.error('[FinanceOverview] Critical Failure:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};
