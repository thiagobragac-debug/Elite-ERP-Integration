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
    const d = i === buckets - 1 && inBucket.length > 0
      ? new Date(inBucket[inBucket.length - 1][dateField])
      : i === 0 && inBucket.length > 0
        ? new Date(inBucket[0][dateField])
        : new Date(bStart + bucketMs / 2);
    return {
      value: Number(v.toFixed(2)),
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    };
  });
}

/**
 * Comercial: Pedidos de Venda
 */
export const pedidosVenda: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 15) => {
  const columns = [
    { header: 'Cód. Venda', accessor: 'codigo' },
    { header: 'Cliente', accessor: 'cliente' },
    { header: 'Produto/Insumo', accessor: 'produto' },
    { header: 'Qtd.', accessor: 'quantidade' },
    { header: 'Preço Unitário', accessor: 'preco_unitario' },
    { header: 'Valor Total', accessor: 'total' },
    { header: 'Status Venda', accessor: 'status' },
    { header: 'Data Faturamento', accessor: 'data' }
  ];

  try {
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [vendasRes, summaryRes] = await Promise.all([
      withTimeout(supabase
        .from('pedidos_venda')
        .select('*, clientes:parceiros(nome)', { count: 'exact' })
        .match(scope)
        .order('created_at', { ascending: false })
        .range(from, to) as unknown as Promise<any>),
      withTimeout(supabase.rpc('get_sales_performance', {
        p_tenant_id: tenantId,
        p_fazenda_id: fazendaId
      }) as unknown as Promise<any>)
    ]);

    if (vendasRes.error) throw vendasRes.error;

    const vendas = vendasRes.data || [];
    const totalVendas = vendasRes.count || 0;
    const faturamentoTotal = Number(summaryRes.data?.faturamento_total || 0);
    const ticketMedio = Number(summaryRes.data?.ticket_medio || 0);
    const volumePedidos = Number(summaryRes.data?.volume_pedidos || 0);

    const _lastSaleDate = vendas.length > 0 ? fmtDateBR(vendas[0].created_at) : null;

    // Calcular conversão: faturados / total
    const faturados = vendas.filter((v: any) => v.status === 'faturado' || v.status === 'Faturado').length;
    const conversao = totalVendas > 0 ? ((faturados / totalVendas) * 100).toFixed(1) + '%' : '---';

    return {
      data: vendas.map((v: any) => ({
        id: v.id,
        codigo: v.codigo || `#VD-${v.id.substring(0, 8).toUpperCase()}`,
        cliente: (v.clientes as any)?.nome || 'Cliente N/A',
        produto: v.produto || v.descricao || '---',
        quantidade: v.quantidade ? `${Number(v.quantidade).toLocaleString()} ${v.unidade_medida || 'un'}` : '---',
        preco_unitario: v.preco_unitario ? `R$ ${Number(v.preco_unitario || 0).toLocaleString()}` : '---',
        total: `R$ ${Number(v.valor_total || 0).toLocaleString()}`,
        status: v.status === 'faturado' || v.status === 'Faturado' ? 'Faturado ✅'
          : v.status === 'em_transito' || v.status === 'Em Trânsito' ? 'Em Trânsito 🚚'
          : v.status === 'cancelado' ? 'Cancelado ❌'
          : `${v.status || 'Pendente'} ⏱️`,
        data: new Date(v.created_at).toLocaleDateString('pt-BR')
      })),
      columns,
      stats: [
        {
          label: 'Faturamento Total',
          subtitle: _lastSaleDate ? `Última venda em ${_lastSaleDate}` : `Período: ${monthYearBR()}`,
          sparkline: buildSparkline(vendas, 'created_at', 'valor_total'),
          value: faturamentoTotal > 0 ? `R$ ${faturamentoTotal.toLocaleString()}` : '---',
          change: faturamentoTotal > 0 ? 'Total período' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Ticket Médio',
          subtitle: _lastSaleDate ? `Base: pedidos até ${_lastSaleDate}` : `Média em ${monthYearBR()}`,
          sparkline: buildSparkline(vendas, 'created_at', 'valor_total'),
          value: ticketMedio > 0 ? `R$ ${ticketMedio.toLocaleString()}` : '---',
          change: ticketMedio > 0 ? 'Média por pedido' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Volume de Pedidos',
          subtitle: _lastSaleDate ? `Último pedido em ${_lastSaleDate}` : `Em ${todayBR()}`,
          sparkline: buildSparkline(vendas, 'created_at', null),
          value: volumePedidos > 0 ? volumePedidos : totalVendas,
          change: 'Total cadastrado',
          trend: 'neutral' as const
        },
        {
          label: 'Conversão Comercial',
          subtitle: _lastSaleDate ? `Taxa até ${_lastSaleDate}` : `Taxa até ${todayBR()}`,
          sparkline: buildSparkline(vendas, 'created_at', null),
          value: conversao,
          change: conversao !== '---' ? 'Pedidos faturados' : 'Sem dados',
          trend: 'neutral' as const
        }
      ],
      totalCount: totalVendas
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

/**
 * Comercial: Base de Clientes
 */
export const clientes: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 20) => {
  const columns = [
    { header: 'Cliente / Razão Social', accessor: 'nome' },
    { header: 'CNPJ/CPF', accessor: 'cnpj' },
    { header: 'Contato', accessor: 'contato' },
    { header: 'E-mail Comercial', accessor: 'email' },
    { header: 'Cidade - UF', accessor: 'cidade' },
    { header: 'Status', accessor: 'status' },
    { header: 'LTV Acumulado', accessor: 'ltv' }
  ];

  try {
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [clientesRes, vendasRes] = await Promise.all([
      withTimeout(supabase
        .from('parceiros')
        .select('*', { count: 'exact' })
        .match(scope)
        .eq('is_customer', true)
        .range(from, to) as unknown as Promise<any>),
      withTimeout(supabase
        .from('pedidos_venda')
        .select('valor_total, parceiro_id')
        .match(scope) as unknown as Promise<any>)
    ]);

    if (clientesRes.error) throw clientesRes.error;

    const cls = clientesRes.data || [];
    const count = clientesRes.count || 0;
    const vendas = vendasRes.data || [];

    // Calcular LTV médio real: soma total de vendas / número de clientes
    const totalFaturamento = vendas.reduce((acc: number, v: any) => acc + Number(v.valor_total || 0), 0);
    const ltvMedio = count > 0 ? totalFaturamento / count : 0;
    const ltvMedioText = ltvMedio > 0 ? `R$ ${(ltvMedio / 1000).toFixed(1)}k` : '---';

    const _lastClientDate = cls.length > 0 ? fmtDateBR(cls[0].created_at) : null;

    // Clientes inativos = clientes com status INATIVO
    const inativos = cls.filter((c: any) => c.status === 'INATIVO').length;
    const churnRate = count > 0 ? ((inativos / count) * 100).toFixed(1) + '%' : '---';

    return {
      data: cls.map((c: any) => ({
        id: c.id,
        nome: c.nome,
        cnpj: c.cnpj_cpf || c.documento || '---',
        contato: c.telefone || c.celular || '---',
        email: c.email || '---',
        cidade: c.cidade ? `${c.cidade}${c.estado ? ' - ' + c.estado : ''}` : '---',
        status: c.status === 'INATIVO' ? 'Inativo 🔴' : 'Ativo 🟢',
        ltv: `R$ ${Number(c.ltv || 0).toLocaleString()}`
      })),
      columns,
      totalCount: count,
      stats: [
        {
          label: 'Base Clientes',
          subtitle: _lastClientDate ? `Último cadastro em ${_lastClientDate}` : `Inventário em ${todayBR()}`,
          sparkline: buildSparkline(cls, 'created_at', null),
          value: count > 0 ? count : '---',
          change: count > 0 ? 'Clientes ativos' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Churn Rate',
          subtitle: _lastClientDate ? `Calculado até ${_lastClientDate}` : `Taxa até ${todayBR()}`,
          sparkline: buildSparkline(cls, 'created_at', null),
          value: churnRate,
          change: churnRate !== '---' ? 'Taxa de inativação' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'LTV Médio',
          subtitle: ltvMedioText !== '---' ? `Base: vendas do período` : `Calculado em ${todayBR()}`,
          sparkline: buildSparkline(vendas, 'created_at', 'valor_total'),
          value: ltvMedioText,
          change: ltvMedio > 0 ? 'Faturamento/cliente' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'CSAT (Satisfação)',
          subtitle: 'Integração pendente',
          sparkline: buildSparkline(cls, 'created_at', null),
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
