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
 * Logística: Consumo de Frotas
 */
export const consumoFrotas: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 20) => {
  const columns = [
    { header: 'Equipamento', accessor: 'maquina' },
    { header: 'Operador/Motorista', accessor: 'operador' },
    { header: 'Odômetro/Horímetro', accessor: 'odometro' },
    { header: 'Volume', accessor: 'litros' },
    { header: 'Custo Total', accessor: 'valor' },
    { header: 'Data', accessor: 'data' }
  ];

  try {
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [frotaRes, summaryRes, maquinasRes] = await Promise.all([
      withTimeout(supabase
        .from('abastecimentos')
        .select('*, maquinas(nome)', { count: 'exact' })
        .match(scope)
        .order('data', { ascending: false })
        .range(from, to) as unknown as Promise<any>),
      withTimeout(supabase.rpc('calculate_fleet_consumption', {
        p_tenant_id: tenantId,
        p_fazenda_id: fazendaId
      }) as unknown as Promise<any>),
      withTimeout(supabase
        .from('maquinas')
        .select('id', { count: 'exact', head: true })
        .match(scope) as unknown as Promise<any>)
    ]);

    if (frotaRes.error) throw frotaRes.error;

    const _lastFuelDate = frotaRes.data?.length > 0 ? fmtDateBR(frotaRes.data[0].data) : null;
    const totalLitros = Number(summaryRes.data?.total_litros || 0);
    const totalCusto = Number(summaryRes.data?.total_custo || 0);
    const mediaLitros = Number(summaryRes.data?.media_litros || 0);
    const frotaCount = maquinasRes.count || 0;

    return {
      data: (frotaRes.data || []).map((f: any) => ({
        id: f.id,
        maquina: (f.maquinas as any)?.nome || 'Equipamento N/A',
        operador: f.operador || f.motorista || '---',
        odometro: f.odometro ? `${Number(f.odometro).toLocaleString()} ${f.tipo_odometro || 'km'}` : '---',
        litros: f.litros ? `${f.litros} L` : '---',
        valor: f.valor_total ? `R$ ${Number(f.valor_total).toLocaleString()}` : '---',
        data: f.data ? new Date(f.data).toLocaleDateString('pt-BR') : '---'
      })),
      columns,
      stats: [
        {
          label: 'Consumo Total (L)',
          subtitle: _lastFuelDate ? `Último abastecimento: ${_lastFuelDate}` : `Período: ${monthYearBR()}`,
          sparkline: buildSparkline(frotaRes.data || [], 'data', 'litros'),
          value: totalLitros > 0 ? `${totalLitros.toLocaleString()} L` : '---',
          change: totalLitros > 0 ? 'Total período' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Custo Operacional',
          subtitle: _lastFuelDate ? `Último em ${_lastFuelDate}` : `Período: ${monthYearBR()}`,
          sparkline: buildSparkline(frotaRes.data || [], 'data', 'valor_total'),
          value: totalCusto > 0 ? `R$ ${totalCusto.toLocaleString()}` : '---',
          change: totalCusto > 0 ? 'Total período' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Média L/Abast.',
          subtitle: _lastFuelDate ? `Média até ${_lastFuelDate}` : `Média calculada`,
          sparkline: buildSparkline(frotaRes.data || [], 'data', 'litros'),
          value: mediaLitros > 0 ? `${mediaLitros.toFixed(1)} L` : '---',
          change: mediaLitros > 0 ? 'Por abastecimento' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Frota Ativa',
          subtitle: `Status em ${todayBR()}`,
          sparkline: buildSparkline(frotaRes.data || [], 'data', null),
          value: frotaCount > 0 ? `${frotaCount} veíc.` : '---',
          change: frotaCount > 0 ? 'Equipamentos' : 'Sem dados',
          trend: 'neutral' as const
        }
      ],
      totalCount: frotaRes.count || 0
    };
  } catch (error) {
    console.warn('[ConsumoFrotas] Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

/**
 * Logística: Manutenções de Frota
 */
export const manutencoesFrota: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 20) => {
  const columns = [
    { header: 'Equipamento', accessor: 'maq' },
    { header: 'Tipo', accessor: 'tipo' },
    { header: 'Descrição do Serviço', accessor: 'descricao' },
    { header: 'Status', accessor: 'status' },
    { header: 'Custo', accessor: 'valor' },
    { header: 'Data', accessor: 'data' }
  ];

  try {
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [manutRes, statsRes, maquinasTotalRes, maquinasEmManutRes] = await Promise.all([
      withTimeout(supabase
        .from('manutencao_frota')
        .select('*, maquinas(nome)', { count: 'exact' })
        .match(scope)
        .order('data_inicio', { ascending: false })
        .range(from, to) as unknown as Promise<any>),
      withTimeout(supabase.rpc('get_manutencao_stats', {
        p_tenant_id: tenantId,
        p_fazenda_id: fazendaId
      }) as unknown as Promise<any>),
      withTimeout(supabase
        .from('maquinas')
        .select('id', { count: 'exact', head: true })
        .match(scope) as unknown as Promise<any>),
      withTimeout(supabase
        .from('manutencao_frota')
        .select('id', { count: 'exact', head: true })
        .match(scope)
        .eq('status', 'em_andamento') as unknown as Promise<any>)
    ]);

    if (manutRes.error) throw manutRes.error;

    const manut = manutRes.data || [];
    const _lastMaintDate = manutRes.data?.length > 0 ? fmtDateBR(manutRes.data[0].data_inicio) : null;
    const totalManut = Number(statsRes.data?.total_custo || 0);
    const totalIntervencoes = Number(statsRes.data?.total_intervencoes || manut.length || 0);
    const custoMedio = totalIntervencoes > 0 ? totalManut / totalIntervencoes : 0;

    // Disponibilidade real: (total - em manutenção) / total * 100
    const totalMaquinas = maquinasTotalRes.count || 0;
    const emManutencao = maquinasEmManutRes.count || 0;
    const disponibilidade = totalMaquinas > 0
      ? `${Math.max(0, ((totalMaquinas - emManutencao) / totalMaquinas) * 100).toFixed(0)}%`
      : '---';

    return {
      data: manut.map((m: any) => ({
        id: m.id,
        maq: (m.maquinas as any)?.nome || '---',
        tipo: m.tipo || '---',
        descricao: m.descricao || m.servico || '---',
        status: m.status === 'concluido' || m.status === 'Concluído' ? 'Concluído ✅'
          : m.status === 'em_andamento' || m.status === 'Em Andamento' ? 'Em Andamento ⚙️'
          : `${m.status || 'Agendado'} 🗓️`,
        valor: m.custo ? `R$ ${Number(m.custo).toLocaleString()}` : '---',
        data: m.data_inicio ? new Date(m.data_inicio).toLocaleDateString('pt-BR') : '---'
      })),
      columns,
      stats: [
        {
          label: 'Investimento Oficina',
          subtitle: _lastMaintDate ? `Última manutenção: ${_lastMaintDate}` : `Período: ${monthYearBR()}`,
          sparkline: buildSparkline(manut, 'data_inicio', 'custo'),
          value: totalManut > 0 ? `R$ ${totalManut.toLocaleString()}` : '---',
          change: totalManut > 0 ? 'Total período' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Intervenções',
          subtitle: _lastMaintDate ? `Última em ${_lastMaintDate}` : 'Sem intervenções',
          sparkline: buildSparkline(manut, 'data_inicio', null),
          value: totalIntervencoes > 0 ? totalIntervencoes : '---',
          change: totalIntervencoes > 0 ? 'Total registradas' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Custo Médio / Máq',
          subtitle: _lastMaintDate ? `Base: manutenção de ${_lastMaintDate}` : `Média em ${monthYearBR()}`,
          sparkline: buildSparkline(manut, 'data_inicio', 'custo'),
          value: custoMedio > 0 ? `R$ ${custoMedio.toLocaleString()}` : '---',
          change: custoMedio > 0 ? 'Por intervenção' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Disponibilidade Frota',
          subtitle: _lastMaintDate ? `Atualizado em ${_lastMaintDate}` : `Verificado em ${todayBR()}`,
          sparkline: buildSparkline(manut, 'data_inicio', null),
          value: disponibilidade,
          change: totalMaquinas > 0 ? `${emManutencao} em manutenção` : 'Sem dados',
          trend: disponibilidade !== '---' && parseFloat(disponibilidade) >= 85 ? 'up' as const : 'neutral' as const
        }
      ],
      totalCount: manutRes.count || 0
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

/**
 * Logística: Inventário de Suprimentos
 */
export const suprimentosInventario: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 20) => {
  const columns = [
    { header: 'Produto/Insumo', accessor: 'nome' },
    { header: 'Grupo/Categoria', accessor: 'categoria' },
    { header: 'Estoque Atual', accessor: 'qtd' },
    { header: 'Unidade', accessor: 'un' },
    { header: 'Custo Médio', accessor: 'valor' },
    { header: 'Estoque Mínimo', accessor: 'estoque_minimo' },
    { header: 'Valor Total', accessor: 'valor_total' },
    { header: 'Status Alerta', accessor: 'alerta' }
  ];

  try {
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [invRes, summaryRes] = await Promise.all([
      withTimeout(supabase
        .from('produtos')
        .select('*', { count: 'exact' })
        .match(scope)
        .range(from, to) as unknown as Promise<any>),
      withTimeout(supabase.rpc('get_inventory_health', {
        p_tenant_id: tenantId,
        p_fazenda_id: fazendaId
      }) as unknown as Promise<any>)
    ]);

    if (invRes.error) throw invRes.error;

    const produtos = invRes.data || [];
    const _lastEstDate = latestDate(produtos, 'updated_at') || latestDate(produtos, 'created_at');

    // Calcular patrimônio real a partir dos produtos retornados
    const patrimonioCalculado = produtos.reduce((acc: number, p: any) => {
      return acc + (Number(p.estoque_atual || 0) * Number(p.custo_medio || 0));
    }, 0);
    const patrimonioTotal = Number(summaryRes.data?.total_patrimonio || patrimonioCalculado || 0);

    const itensFalta = produtos.filter((p: any) => Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0)).length;
    const acuracidade = summaryRes.data?.acuracidade;
    const acuracidadeText = acuracidade ? `${acuracidade}%` : '---';

    return {
      data: produtos.map((i: any) => {
        const atual = Number(i.estoque_atual || 0);
        const min = Number(i.estoque_minimo || 0);
        const total = atual * Number(i.custo_medio || 0);
        return {
          id: i.id,
          nome: i.nome || '---',
          categoria: i.categoria || '---',
          qtd: atual.toLocaleString(),
          un: i.unidade_medida || 'UN',
          valor: i.custo_medio ? `R$ ${Number(i.custo_medio).toLocaleString()}` : '---',
          estoque_minimo: `${min.toLocaleString()} ${i.unidade_medida || 'UN'}`,
          valor_total: total > 0 ? `R$ ${total.toLocaleString()}` : '---',
          alerta: atual <= min && min > 0 ? 'Abaixo do Mínimo ⚠️' : 'Ideal ✅'
        };
      }),
      columns,
      stats: [
        {
          label: 'Patrimônio Estoque',
          subtitle: _lastEstDate ? `Inventário em ${_lastEstDate}` : `Inventário em ${todayBR()}`,
          sparkline: produtos.length > 0
            ? produtos.map((p: any, i: number) => ({ value: Number((Number(p.estoque_atual || 0) * Number(p.custo_medio || 0)).toFixed(2)), label: `P${i + 1}` }))
            : [],
          value: patrimonioTotal > 0 ? `R$ ${patrimonioTotal.toLocaleString()}` : '---',
          change: patrimonioTotal > 0 ? 'Valor total' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Itens Abaixo Mínimo',
          subtitle: `Status em ${todayBR()}`,
          sparkline: produtos.length > 0
            ? produtos.map((p: any, i: number) => ({ value: Number(p.estoque_atual || 0), label: `I${i + 1}` }))
            : [],
          value: itensFalta > 0 ? itensFalta : produtos.length > 0 ? '0' : '---',
          change: itensFalta > 0 ? 'Atenção necessária' : 'Estoque OK',
          trend: itensFalta > 0 ? 'down' as const : 'up' as const
        },
        {
          label: 'Acuracidade',
          subtitle: _lastEstDate ? `Auditado em ${_lastEstDate}` : `Calculada em ${todayBR()}`,
          sparkline: produtos.length > 0
            ? produtos.map((p: any, i: number) => ({ value: Number(p.estoque_atual || 0), label: `I${i + 1}` }))
            : [],
          value: acuracidadeText,
          change: acuracidade ? 'Inventário auditado' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Giro de Estoque',
          subtitle: `Período: ${monthYearBR()}`,
          sparkline: produtos.length > 0
            ? produtos.map((p: any, i: number) => ({ value: Number(p.estoque_atual || 0), label: `I${i + 1}` }))
            : [],
          value: '---',
          change: 'Integração pendente',
          trend: 'neutral' as const
        }
      ],
      totalCount: invRes.count || 0
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

/**
 * Logística: Pedidos de Compra
 */
export const pedidosCompra: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 20) => {
  const columns = [
    { header: 'Nº Pedido', accessor: 'codigo' },
    { header: 'Fornecedor', accessor: 'forn' },
    { header: 'Solicitante', accessor: 'solicitante' },
    { header: 'Data Emissão', accessor: 'data' },
    { header: 'Previsão Entrega', accessor: 'previsao' },
    { header: 'Valor Total', accessor: 'total' },
    { header: 'Status Pedido', accessor: 'status' }
  ];

  try {
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [comprasRes, summaryRes] = await Promise.all([
      withTimeout(supabase
        .from('pedidos_compra')
        .select('*, fornecedores:parceiros(nome)', { count: 'exact' })
        .match(scope)
        .order('created_at', { ascending: false })
        .range(from, to) as unknown as Promise<any>),
      withTimeout(supabase.rpc('get_purchase_summary', {
        p_tenant_id: tenantId,
        p_fazenda_id: fazendaId
      }) as unknown as Promise<any>)
    ]);

    if (comprasRes.error) throw comprasRes.error;

    const compras = comprasRes.data || [];
    const _lastOrderDate = compras.length > 0 ? fmtDateBR(compras[0].created_at) : null;
    const totalCompras = Number(summaryRes.data?.total_compras || 0);
    const pedidosPendentes = Number(summaryRes.data?.pedidos_pendentes || 0);
    const mediaPedido = Number(summaryRes.data?.media_pedido || 0);

    // Saving real = soma de (cotacao_estimada - valor_real) dos pedidos concluídos
    const savingCalculado = compras
      .filter((c: any) => c.status === 'concluido' || c.status === 'aprovado')
      .reduce((acc: number, c: any) => {
        const estimado = Number(c.valor_estimado || 0);
        const real = Number(c.valor_total || 0);
        return acc + Math.max(0, estimado - real);
      }, 0);

    return {
      data: compras.map((c: any) => ({
        id: c.id,
        codigo: c.codigo || `#PED-${c.id.substring(0, 8).toUpperCase()}`,
        forn: (c.fornecedores as any)?.nome || '---',
        solicitante: c.solicitante || '---',
        data: new Date(c.created_at).toLocaleDateString('pt-BR'),
        previsao: c.data_previsao_entrega
          ? new Date(c.data_previsao_entrega).toLocaleDateString('pt-BR')
          : '---',
        total: `R$ ${Number(c.valor_total || 0).toLocaleString()}`,
        status: c.status === 'aprovado' ? 'Aprovado 🟢'
          : c.status === 'pendente' ? 'Pendente 🟡'
          : c.status === 'concluido' ? 'Concluído ✅'
          : c.status === 'cancelado' ? 'Cancelado ❌'
          : `${c.status || 'Rascunho'} ⚪`
      })),
      columns,
      stats: [
        {
          label: 'Volume Compras',
          subtitle: _lastOrderDate ? `Último pedido em ${_lastOrderDate}` : `Período: ${monthYearBR()}`,
          sparkline: buildSparkline(compras, 'created_at', 'valor_total'),
          value: totalCompras > 0 ? `R$ ${totalCompras.toLocaleString()}` : '---',
          change: totalCompras > 0 ? 'Total período' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Pedidos Pendentes',
          subtitle: _lastOrderDate ? `Pedidos até ${_lastOrderDate}` : `Status em ${todayBR()}`,
          sparkline: buildSparkline(compras, 'created_at', null),
          value: pedidosPendentes > 0 ? pedidosPendentes : compras.filter((c: any) => c.status === 'pendente').length || '---',
          change: 'Aguardando aprovação',
          trend: 'neutral' as const
        },
        {
          label: 'Média / Pedido',
          subtitle: _lastOrderDate ? `Base: pedidos até ${_lastOrderDate}` : `Média em ${monthYearBR()}`,
          sparkline: buildSparkline(compras, 'created_at', 'valor_total'),
          value: mediaPedido > 0 ? `R$ ${mediaPedido.toLocaleString()}` : '---',
          change: mediaPedido > 0 ? 'Por pedido' : 'Sem dados',
          trend: 'neutral' as const
        },
        {
          label: 'Saving Estimado',
          subtitle: _lastOrderDate ? `Calculado até ${_lastOrderDate}` : `Calculado em ${todayBR()}`,
          sparkline: buildSparkline(compras, 'created_at', 'valor_total'),
          value: savingCalculado > 0 ? `R$ ${savingCalculado.toLocaleString()}` : 'R$ 0',
          change: savingCalculado > 0 ? 'Economia negociada' : 'Sem dados',
          trend: savingCalculado > 0 ? 'up' as const : 'neutral' as const
        }
      ],
      totalCount: comprasRes.count || 0
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};
