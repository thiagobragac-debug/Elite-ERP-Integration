import { supabase } from '../../lib/supabase';
import type { ReportHandler } from '../../types/reports';
import { Beef, Scale, Skull, TrendingUp, Activity, Map as MapIcon, Calendar } from 'lucide-react';
import {
  todayBR,
  monthYearBR,
  fmtDateBR,
  latestDate,
  earliestPending,
  latestPaid,
  withTimeout,
  buildSparkline,
  applyScope,
} from '../../utils/report-utils';


// ─────────────────────────────────────────────────────────────
// Pecuária: Performance Ponderal (GMD)
// ─────────────────────────────────────────────────────────────
export const performancePonderal: ReportHandler = async (
  tenantId,
  fazendaId,
  page = 1,
  pageSize = 20
) => {
  const columns = [
    { header: 'Animal / Brinco', accessor: 'brinco' },
    { header: 'Peso Atual', accessor: 'evolucao' },
    { header: 'GMD Calculado', accessor: 'gmd' },
    { header: 'Última Pesagem', accessor: 'data' },
  ];

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };

    const [pesagensRes, gmdRes, weightRes] = await Promise.all([
      withTimeout(
        supabase
          .from('pesagens')
          .select('id, animal_id, data_pesagem, peso, animais(brinco, lote_id)', { count: 'exact' })
          .match(scope)
          .order('data_pesagem', { ascending: false })
          .range(from, to) as unknown as Promise<any>
      ),
      withTimeout(
        supabase.rpc('calculate_herd_gmd', {
          p_tenant_id: tenantId,
          p_fazenda_id: fazendaId,
        }) as unknown as Promise<any>
      ),
      withTimeout(
        supabase.rpc('get_herd_total_weight', {
          p_tenant_id: tenantId,
          p_fazenda_id: fazendaId,
        }) as unknown as Promise<any>
      ),
    ]);

    if (pesagensRes.error) {
      throw pesagensRes.error;
    }

    const pesagens = pesagensRes.data || [];
    const gmdGlobal = Number(gmdRes.data || 0);
    const pesoTotal = Number(weightRes.data || 0);

    // GMD por animal: (peso atual - peso anterior) / dias entre pesagens
    // Se não há pesagem anterior, exibe '---' (sem Math.random)
    const enrichedData = pesagens.map((curr: any, idx: number) => {
      const prev = pesagens.slice(idx + 1).find((w: any) => w.animal_id === curr.animal_id);
      let gmdVal: number | null = null;
      if (prev) {
        const days =
          (new Date(curr.data_pesagem).getTime() - new Date(prev.data_pesagem).getTime()) /
          86400000;
        if (days > 0) {
          gmdVal = (Number(curr.peso) - Number(prev.peso)) / days;
        }
      }
      const animal = Array.isArray(curr.animais) ? curr.animais[0] : curr.animais;
      return {
        id: curr.id,
        brinco: animal?.brinco || '---',
        evolucao: curr.peso ? `${Number(curr.peso).toFixed(1)} kg` : '---',
        gmd: gmdVal !== null ? `${gmdVal.toFixed(3)} kg/dia` : '---',
        data: curr.data_pesagem ? new Date(curr.data_pesagem).toLocaleDateString('pt-BR') : '---',
      };
    });

    // GMD projetado = GMD atual * 1.05 (projeção de 5% melhora no próximo ciclo)
    const gmdProjetado = gmdGlobal > 0 ? gmdGlobal * 1.05 : null;
    const _lastWeighDate1 = pesagens.length > 0 ? fmtDateBR(pesagens[0].data_pesagem) : null;

    return {
      data: enrichedData,
      columns,
      stats: [
        {
          label: 'GMD Médio Global',
          subtitle: _lastWeighDate1
            ? `Última pesagem em ${_lastWeighDate1}`
            : `Calculado em ${todayBR()}`,
          sparkline: buildSparkline(pesagens, 'data_pesagem', 'peso'),
          value: gmdGlobal > 0 ? `${gmdGlobal.toFixed(3)} kg/dia` : '---',
          change: gmdGlobal > 0 ? 'Calculado do rebanho' : 'Sem pesagens',
          trend: 'neutral' as const,
          icon: TrendingUp,
          color: 'hsl(var(--success))',
        },
        {
          label: 'Peso Total Rebanho',
          subtitle: _lastWeighDate1
            ? `Apurado em ${_lastWeighDate1}`
            : `Inventário em ${todayBR()}`,
          sparkline: buildSparkline(pesagens, 'data_pesagem', 'peso'),
          value: pesoTotal > 0 ? `${(pesoTotal / 1000).toFixed(1)} ton` : '---',
          change: pesoTotal > 0 ? 'Soma pesagens' : 'Sem dados',
          trend: 'neutral' as const,
          icon: Scale,
          color: 'hsl(var(--brand))',
        },
        {
          label: 'Total Pesagens',
          subtitle: _lastWeighDate1
            ? `Última pesagem em ${_lastWeighDate1}`
            : 'Sem pesagens registradas',
          sparkline: buildSparkline(pesagens, 'data_pesagem', null),
          value:
            pesagensRes.count !== null && pesagensRes.count > 0 ? String(pesagensRes.count) : '---',
          change: pesagensRes.count > 0 ? 'Registros no período' : 'Sem pesagens',
          trend: 'neutral' as const,
          icon: Activity,
          color: 'hsl(var(--warning))',
        },
        {
          label: 'GMD Projetado',
          subtitle: 'Proje\u00e7\u00e3o baseada em hist\u00f3rico',
          sparkline: buildSparkline(pesagens, 'data_pesagem', 'peso'),
          value: gmdProjetado ? `${gmdProjetado.toFixed(3)} kg/dia` : '---',
          change: gmdProjetado ? 'Projeção +5% próx. ciclo' : 'Sem base de cálculo',
          trend: gmdProjetado ? ('up' as const) : ('neutral' as const),
          icon: TrendingUp,
          color: 'hsl(var(--success))',
        },
      ],
      totalCount: pesagensRes.count || 0,
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

// ─────────────────────────────────────────────────────────────
// Pecuária: Sanidade Animal
// ─────────────────────────────────────────────────────────────
export const sanidadeAnimal: ReportHandler = async (
  tenantId,
  fazendaId,
  page = 1,
  pageSize = 20
) => {
  const columns = [
    { header: 'Manejo / Vacina', accessor: 'vacina' },
    { header: 'Alvo', accessor: 'targetName' },
    { header: 'Tipo', accessor: 'targetType' },
    { header: 'Lote Aplicado', accessor: 'lote' },
    { header: 'Data Manejo', accessor: 'data' },
    {
      header: 'Carência',
      accessor: (row: any) => (row.carencia_dias ? `${row.carencia_dias} dias` : 'Isento'),
    },
    {
      header: 'Status Consumo',
      accessor: (row: any) =>
        row.isBlocked ? `⚠️ Bloqueado (${row.diasRestantes}d)` : '✅ Liberado',
    },
  ];

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };
    const today = new Date();

    const [sanidadeRes, statsRes, animalTotalRes] = await Promise.all([
      withTimeout(
        supabase
          .from('sanidade')
          .select('*, animais:animal_id(brinco), lotes:lote_id(nome)', { count: 'exact' })
          .match(scope)
          .order('data_manejo', { ascending: false })
          .range(from, to) as unknown as Promise<any>
      ),
      withTimeout(
        supabase.rpc('get_sanitary_coverage', {
          p_tenant_id: tenantId,
          p_fazenda_id: fazendaId,
        }) as unknown as Promise<any>
      ),
      withTimeout(
        supabase
          .from('animais')
          .select('id', { count: 'exact', head: true })
          .match(scope) as unknown as Promise<any>
      ),
    ]);

    if (sanidadeRes.error) {
      throw sanidadeRes.error;
    }

    const registros = sanidadeRes.data || [];
    const cobertura = Number(statsRes.data?.cobertura || 0);
    const aplicacoesMes = Number(statsRes.data?.aplicacoes_mes || 0);
    const custoUA = Number(statsRes.data?.custo_ua || 0);
    const totalAnimais = animalTotalRes.count || 0;

    // Fetch product names since sanidade.produto stores UUIDs but lacks FK
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const productIds = registros.map((r: any) => r.produto).filter((p: string) => p && uuidRegex.test(p));
    const uniqueProductIds = [...new Set(productIds)];
    const produtosMap: Record<string, string> = {};
    
    if (uniqueProductIds.length > 0) {
      const prodRes = await supabase.from('produtos').select('id, nome').in('id', uniqueProductIds);
      if (prodRes.data) {
        prodRes.data.forEach((p: any) => {
          produtosMap[p.id] = p.nome;
        });
      }
    }

    // Alertas de carência reais: registros REALIZADOS que ainda estão em período de carência
    const alertasCarencia = registros.filter((s: any) => {
      if (!s.carencia_dias || s.carencia_dias === 0) {
        return false;
      }
      const dataManejo = new Date(s.data_manejo);
      const dataLiberacao = new Date(dataManejo);
      dataLiberacao.setDate(dataLiberacao.getDate() + s.carencia_dias);
      return dataLiberacao > today && s.status === 'REALIZADO';
    }).length;

    const _lastManejoDate = registros.length > 0 ? fmtDateBR(registros[0].data_manejo) : null;

    return {
      data: registros.map((s: any) => {
        const dataManejo = s.data_manejo ? new Date(s.data_manejo) : new Date();
        const dataLiberacao = new Date(dataManejo);
        dataLiberacao.setDate(dataLiberacao.getDate() + (s.carencia_dias || 0));
        const diffTime = dataLiberacao.getTime() - today.getTime();
        const diasRestantes = Math.ceil(diffTime / 86400000);
        const isBlocked = diasRestantes > 0 && s.status === 'REALIZADO';
        const animal = Array.isArray(s.animais) ? s.animais[0] : s.animais;
        const lote = Array.isArray(s.lotes) ? s.lotes[0] : s.lotes;
        
        // Resolve product name from map, fallback to literal
        const produtoNome = (s.produto && produtosMap[s.produto]) ? produtosMap[s.produto] : s.produto || s.titulo || '---';
        const animalNomeStr = animal?.nome ? `${animal.nome} #${animal.brinco}` : animal?.brinco ? `#${animal.brinco}` : null;
        
        return {
          ...s,
          produto: produtoNome,
          vacina: produtoNome,
          lote: lote?.nome || '---',
          data: dataManejo.toLocaleDateString('pt-BR'),
          dataLiberacao,
          diasRestantes,
          isBlocked,
          targetName: animalNomeStr || lote?.nome || 'Manejo Geral',
          targetType: animal ? 'INDIVIDUAL' : lote ? 'LOTE' : 'GERAL',
        };
      }),
      columns,
      stats: [
        {
          label: 'Cobertura Sanitária',
          subtitle: _lastManejoDate
            ? `Último manejo em ${_lastManejoDate}`
            : `Calculado em ${todayBR()}`,
          sparkline: buildSparkline(registros, 'data_manejo', null),
          value: cobertura > 0 ? `${cobertura.toFixed(1)}%` : totalAnimais > 0 ? '0%' : '---',
          change: cobertura > 0 ? 'Animais vacinados' : 'Sem registros',
          trend:
            cobertura >= 90
              ? ('up' as const)
              : cobertura > 0
                ? ('neutral' as const)
                : ('neutral' as const),
          icon: Activity,
          color: 'hsl(var(--success))',
        },
        {
          label: 'Aplicações (Mês)',
          subtitle: `Refer\u00eancia: ${monthYearBR()}`,
          sparkline: buildSparkline(registros, 'data_manejo', null),
          value:
            aplicacoesMes > 0
              ? String(aplicacoesMes)
              : registros.length > 0
                ? String(registros.length)
                : '---',
          change: aplicacoesMes > 0 ? 'Mês atual' : 'Período total',
          trend: 'neutral' as const,
          icon: Scale,
          color: 'hsl(var(--brand))',
        },
        {
          label: 'Custo Sanitário / UA',
          subtitle: `Per\u00edodo: ${monthYearBR()}`,
          sparkline: buildSparkline(registros, 'data_manejo', null),
          value: custoUA > 0 ? `R$ ${custoUA.toFixed(2)}` : 'R$ 0,00',
          change: custoUA > 0 ? 'Por unidade animal' : 'Sem dados de custo',
          trend: 'neutral' as const,
          icon: Skull,
          color: 'hsl(var(--danger))',
        },
        {
          label: 'Em Carência Ativa',
          subtitle:
            alertasCarencia > 0 && _lastManejoDate
              ? `Desde ${_lastManejoDate}`
              : `Status em ${todayBR()}`,
          sparkline: buildSparkline(registros, 'data_manejo', null),
          value: alertasCarencia > 0 ? String(alertasCarencia) : '0',
          change: alertasCarencia > 0 ? 'Consumo bloqueado' : 'Todos liberados',
          trend: alertasCarencia > 0 ? ('down' as const) : ('up' as const),
          icon: Activity,
          color: alertasCarencia > 0 ? 'hsl(var(--danger))' : 'hsl(var(--success))',
        },
      ],
      totalCount: sanidadeRes.count || 0,
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

// ─────────────────────────────────────────────────────────────
// Pecuária: Manejo de Pastagens
// ─────────────────────────────────────────────────────────────
export const pastagens: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 20) => {
  const columns = [
    { header: 'Pasto / Piquete', accessor: 'nome' },
    { header: 'Área', accessor: 'area' },
    { header: 'Capim', accessor: (row: any) => row.tipo_capim || '---' },
    {
      header: 'Capacidade UA/ha',
      accessor: (row: any) =>
        row.capacidade_ua ? `${Number(row.capacidade_ua).toFixed(1)} UA/ha` : '---',
    },
    { header: 'Lotação Atual', accessor: 'lotacao' },
    {
      header: 'Status Ocupação',
      accessor: (row: any) =>
        row.status === 'resting'
          ? '🟢 Descanso'
          : row.status === 'occupied'
            ? '🔴 Ocupado'
            : `${row.status || '---'}`,
    },
  ];

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };

    const [pastosRes, summaryRes] = await Promise.all([
      withTimeout(
        supabase
          .from('pastos')
          .select('*, lotes(id, animais(count))', { count: 'exact' })
          .match(scope)
          .order('created_at', { ascending: false })
          .range(from, to) as unknown as Promise<any>
      ),
      withTimeout(
        supabase.rpc('get_paddock_lotation_summary', {
          p_tenant_id: tenantId,
          p_fazenda_id: fazendaId,
        }) as unknown as Promise<any>
      ),
    ]);

    if (pastosRes.error) {
      throw pastosRes.error;
    }

    const pastos = pastosRes.data || [];
    const areaTotal =
      Number(summaryRes.data?.area_total || 0) ||
      pastos.reduce((a: number, p: any) => a + Number(p.area || 0), 0);
    const mediaLotacao = Number(summaryRes.data?.media_lotacao || 0);
    const pastosDescanso =
      Number(summaryRes.data?.pastos_descanso || 0) ||
      pastos.filter((p: any) => p.status === 'resting').length;

    const _lastPastoDate = pastos.length > 0 ? latestDate(pastos, 'created_at') : null;

    // Capacidade suporte real: soma de (area * capacidade_ua) por pasto
    const capacidadeTotal = pastos.reduce(
      (acc: number, p: any) => acc + Number(p.area || 0) * Number(p.capacidade_ua || 0),
      0
    );

    return {
      data: pastos.map((p: any) => {
        const totalAnimais =
          p.lotes?.reduce(
            (acc: number, l: any) =>
              acc + ((Array.isArray(l.animais) ? l.animais[0] : l.animais)?.count || 0),
            0
          ) || 0;
        return {
          ...p,
          nome: p.nome || '---',
          area: `${Number(p.area || 0).toFixed(2)} ha`,
          lotacao: totalAnimais > 0 ? `${totalAnimais} UA` : '---',
        };
      }),
      columns,
      stats: [
        {
          label: 'Área Total Pasto',
          subtitle: _lastPastoDate ? `Atualizado em ${_lastPastoDate}` : `Cadastro em ${todayBR()}`,
          sparkline: buildSparkline(pastos, 'created_at', 'area'),
          value: areaTotal > 0 ? `${areaTotal.toFixed(0)} ha` : '---',
          change: areaTotal > 0 ? 'Cadastrado' : 'Sem pastos',
          trend: 'neutral' as const,
          icon: MapIcon,
          color: 'hsl(var(--brand))',
        },
        {
          label: 'Média Lotação',
          subtitle: _lastPastoDate
            ? `Calculado em ${_lastPastoDate}`
            : `Verificado em ${todayBR()}`,
          sparkline: buildSparkline(pastos, 'created_at', 'capacidade_ua'),
          value: mediaLotacao > 0 ? `${mediaLotacao.toFixed(2)} UA/ha` : '---',
          change: mediaLotacao > 0 ? 'Pressão de pastejo' : 'Sem dados',
          trend: 'neutral' as const,
          icon: Activity,
          color: 'hsl(var(--success))',
        },
        {
          label: 'Pastos em Descanso',
          subtitle: `Status em ${todayBR()}`,
          sparkline: buildSparkline(pastos, 'created_at', null),
          value: pastosRes.count !== null ? String(pastosDescanso) : '---',
          change: pastosDescanso > 0 ? `de ${pastosRes.count || 0} total` : 'Todos ocupados',
          trend: 'neutral' as const,
          icon: TrendingUp,
          color: 'hsl(var(--warning))',
        },
        {
          label: 'Capacidade Suporte',
          subtitle: _lastPastoDate
            ? `Base: dados de ${_lastPastoDate}`
            : `Calculado em ${todayBR()}`,
          sparkline: buildSparkline(pastos, 'created_at', 'capacidade_ua'),
          value: capacidadeTotal > 0 ? `${capacidadeTotal.toFixed(0)} UA` : '---',
          change: capacidadeTotal > 0 ? 'Soma área × cap. UA' : 'Sem capacidade definida',
          trend: 'neutral' as const,
          icon: Activity,
          color: 'hsl(var(--brand))',
        },
      ],
      totalCount: pastosRes.count || 0,
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

// ─────────────────────────────────────────────────────────────
// Pecuária: Confinamento
// ─────────────────────────────────────────────────────────────
export const confinamento: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 20) => {
  const columns = [
    { header: 'Curral', accessor: 'nome_curral' },
    { header: 'Lote', accessor: (row: any) => row.lotes?.nome || '---' },
    {
      header: 'Data Entrada',
      accessor: (row: any) =>
        row.data_inicio ? new Date(row.data_inicio).toLocaleDateString('pt-BR') : '---',
    },
    {
      header: 'Peso Entrada',
      accessor: (row: any) =>
        row.peso_entrada ? `${Number(row.peso_entrada).toFixed(1)} kg` : '---',
    },
    {
      header: 'Dias / Alvo (DOF)',
      accessor: (row: any) => `${row.dof || 0} / ${row.dof_alvo || '---'} dias`,
    },
    {
      header: 'Progresso',
      accessor: (row: any) => (row.dof_alvo ? `${Number(row.progress || 0).toFixed(0)}%` : '---'),
    },
    {
      header: 'Peso Projetado',
      accessor: (row: any) =>
        row.projectedWeight ? `${Number(row.projectedWeight).toFixed(1)} kg` : '---',
    },
    {
      header: 'Custo Diária (CPD)',
      accessor: (row: any) => (row.cpd ? `R$ ${Number(row.cpd).toFixed(2)}` : '---'),
    },
    {
      header: 'Status',
      accessor: (row: any) =>
        row.status === 'active' || row.status === 'ativo' ? '⚡ Ativo' : '✅ Finalizado',
    },
  ];

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };

    // Buscar confinamentos + animais confinados reais + custo diário real de nutrição
    const [confRes, gmdRes, nutricaoRes] = await Promise.all([
      withTimeout(
        supabase
          .from('confinamento')
          .select('*, lotes(id, nome, animais(count))', { count: 'exact' })
          .match(scope)
          .range(from, to) as unknown as Promise<any>
      ),
      withTimeout(
        supabase.rpc('calculate_herd_gmd', {
          p_tenant_id: tenantId,
          p_fazenda_id: fazendaId,
        }) as unknown as Promise<any>
      ),
      withTimeout(
        supabase
          .from('nutricao_animais')
          .select('valor_total_consumido, data_consumo')
          .match(scope)
          .order('data_consumo', { ascending: false })
          .limit(30) as unknown as Promise<any>
      ),
    ]);

    if (confRes.error) {
      throw confRes.error;
    }

    const conf = confRes.data || [];
    const gmdReal = Number(gmdRes.data || 0);

    // CPD real: média dos custos diários registrados nos últimos 30 dias
    const nutricao = nutricaoRes.data || [];
    const cpdReal =
      nutricao.length > 0
        ? nutricao.reduce((acc: number, n: any) => acc + Number(n.valor_total_consumido || 0), 0) /
          nutricao.length
        : null;

    // Animais confinados reais: sum of capacidade_animais for active pens
    const animaisConfinados = conf
      .filter((c: any) => c.status !== 'archived')
      .reduce((acc: number, c: any) => acc + (c.capacidade_animais || 0), 0);

    const _lastNutricaoDate = nutricao.length > 0 ? fmtDateBR(nutricao[0].data_consumo) : null;
    const _lastConfDate = conf.length > 0 ? latestDate(conf, 'data_inicio') : null;

    return {
      data: conf.map((c: any) => {
        const startDate = new Date(c.data_inicio || new Date());
        const dof = Math.ceil(Math.abs(new Date().getTime() - startDate.getTime()) / 86400000);
        const progress = c.dof_alvo ? Math.min(100, (dof / c.dof_alvo) * 100) : null;
        // Peso projetado = peso entrada + dias × GMD real (se disponível)
        const projectedWeight =
          c.peso_entrada && gmdReal > 0 ? Number(c.peso_entrada) + dof * gmdReal : null;
        return {
          ...c,
          dof,
          progress,
          projectedWeight,
          cpd: cpdReal,
          status: c.status || 'active',
        };
      }),
      columns,
      stats: [
        {
          label: 'Animais Confinados',
          subtitle: _lastConfDate
            ? `Entrada mais recente: ${_lastConfDate}`
            : `Inventário em ${todayBR()}`,
          sparkline: buildSparkline(conf, 'data_inicio', null),
          value:
            animaisConfinados > 0
              ? String(animaisConfinados)
              : confRes.count !== null && confRes.count > 0
                ? `${confRes.count} currais`
                : '---',
          change: animaisConfinados > 0 ? 'Em currais ativos' : 'Sem animais',
          trend: 'neutral' as const,
          icon: Beef,
          color: 'hsl(var(--brand))',
        },
        {
          label: 'GMD do Rebanho',
          subtitle: 'Calculado de pesagens do rebanho',
          sparkline: buildSparkline(conf, 'data_inicio', null),
          value: gmdReal > 0 ? `${gmdReal.toFixed(3)} kg/dia` : '---',
          change: gmdReal > 0 ? 'Calculado de pesagens' : 'Sem pesagens',
          trend: gmdReal > 0 ? ('up' as const) : ('neutral' as const),
          icon: TrendingUp,
          color: 'hsl(var(--success))',
        },
        {
          label: 'Custo Diária (CPD)',
          subtitle: _lastNutricaoDate
            ? `Última nutrição: ${_lastNutricaoDate}`
            : 'Sem registro de nutrição',
          sparkline: buildSparkline(nutricao, 'data_consumo', 'valor_total_consumido'),
          value: cpdReal ? `R$ ${cpdReal.toFixed(2)}` : '---',
          change: cpdReal ? 'Média 30 dias' : 'Sem nutrição registrada',
          trend: 'neutral' as const,
          icon: Activity,
          color: 'hsl(var(--warning))',
        },
        {
          label: 'Currais Ativos',
          subtitle: `Status em ${todayBR()}`,
          sparkline: buildSparkline(conf, 'data_inicio', null),
          value: confRes.count !== null && confRes.count > 0 ? String(confRes.count) : '---',
          change: confRes.count > 0 ? 'Em operação' : 'Sem confinamento',
          trend: 'neutral' as const,
          icon: Scale,
          color: 'hsl(var(--brand))',
        },
      ],
      totalCount: confRes.count || 0,
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

// ─────────────────────────────────────────────────────────────
// Pecuária: Dashboard Overview (KPIs + Fila Operacional)
// ─────────────────────────────────────────────────────────────
export const dashboardOverview: ReportHandler = async (tenantId, fazendaId) => {
  try {
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date().toISOString().split('T')[0];

    const [animalRes, gmdRes, healthRes, lotacaoRes, pesagensRes, manejosPendentesRes] =
      await Promise.all([
        withTimeout(
          applyScope(
            supabase.from('animais').select('id', { count: 'exact', head: true }),
            tenantId,
            fazendaId
          ) as unknown as Promise<any>
        ),
        withTimeout(
          supabase.rpc('calculate_herd_gmd', {
            p_tenant_id: tenantId,
            p_fazenda_id: fazendaId,
          }) as unknown as Promise<any>
        ),
        withTimeout(
          applyScope(
            supabase
              .from('sanidade')
              .select('data_manejo, carencia_dias, status')
              .eq('status', 'REALIZADO')
              .gte('data_manejo', sixtyDaysAgo.toISOString().split('T')[0]),
            tenantId,
            fazendaId
          ) as unknown as Promise<any>
        ),
        withTimeout(
          supabase.rpc('get_paddock_lotation_summary', {
            p_tenant_id: tenantId,
            p_fazenda_id: fazendaId,
          }) as unknown as Promise<any>
        ),
        withTimeout(
          applyScope(
            supabase
              .from('pesagens')
              .select('peso, data_pesagem')
              .gte('data_pesagem', thirtyDaysAgo.toISOString().split('T')[0]),
            tenantId,
            fazendaId
          ) as unknown as Promise<any>
        ),
        // Manejos agendados reais (status PENDENTE ou AGENDADO com data >= hoje)
        withTimeout(
          applyScope(
            supabase
              .from('sanidade')
              .select('id, produto, titulo, lotes:lote_id(nome), data_manejo, tipo')
              .in('status', ['PENDENTE', 'AGENDADO'])
              .gte('data_manejo', today)
              .order('data_manejo', { ascending: true })
              .limit(10),
            tenantId,
            fazendaId
          ) as unknown as Promise<any>
        ),
      ]);

    // Carências ativas reais
    const activeWithdrawals = (healthRes.data || []).filter((e: any) => {
      const releaseDate = new Date(e.data_manejo);
      releaseDate.setDate(releaseDate.getDate() + (e.carencia_dias || 0));
      return releaseDate > new Date();
    }).length;

    const animalCount = animalRes.count || 0;
    const gmdGlobal = Number(gmdRes.data || 0);
    const avgLotation = Number(lotacaoRes.data?.media_lotacao || 0);

    const _lastWeighDateOv =
      pesagensRes.data?.length > 0 ? latestDate(pesagensRes.data, 'data_pesagem') : null;
    const _lastHealthDateOv =
      healthRes.data?.length > 0 ? latestDate(healthRes.data, 'data_manejo') : null;

    // Fila operacional: manejos agendados reais
    const manejosPendentes = (manejosPendentesRes.data || []).map((m: any, i: number) => {
      const dataManejo = m.data_manejo ? new Date(m.data_manejo) : null;
      const diffDays = dataManejo
        ? Math.ceil((dataManejo.getTime() - new Date().getTime()) / 86400000)
        : null;
      const lote = Array.isArray(m.lotes) ? m.lotes[0] : m.lotes;
      return {
        id: m.id || String(i),
        type: m.tipo_manejo || 'MANEJO',
        title: m.produto || m.titulo || 'Manejo Agendado',
        target: lote?.nome || 'Rebanho Geral',
        date: dataManejo
          ? diffDays === 0
            ? 'Hoje'
            : diffDays === 1
              ? 'Amanhã'
              : `em ${diffDays} dias`
          : '---',
        priority: diffDays !== null && diffDays <= 1 ? 'high' : 'medium',
      };
    });

    return {
      data: manejosPendentes,
      stats: [
        {
          label: 'Estoque Biológico',
          subtitle: `Inventário em ${todayBR()}`,
          value: animalCount > 0 ? `${animalCount.toLocaleString()} Cabeças` : '---',
          change: animalCount > 0 ? 'Rebanho cadastrado' : 'Sem animais',
          trend: 'neutral' as const,
          icon: Beef,
          color: '#10b981',
          periodLabel: 'Total em Pátio',
        },
        {
          label: 'GMD Médio (Rebanho)',
          subtitle: _lastWeighDateOv
            ? `Última pesagem em ${_lastWeighDateOv}`
            : gmdGlobal > 0 ? 'Média do histórico' : 'Sem pesagens registradas',
          value: gmdGlobal > 0 ? `${gmdGlobal.toFixed(3)} kg/dia` : '---',
          change: gmdGlobal > 0 ? 'Performance global' : 'Sem pesagens',
          trend: gmdGlobal > 0 ? ('up' as const) : ('neutral' as const),
          icon: TrendingUp,
          color: '#3b82f6',
          periodLabel: 'Calculado de pesagens',
        },
        {
          label: 'Taxa de Lotação',
          subtitle: `Verificado em ${todayBR()}`,
          value: avgLotation > 0 ? `${avgLotation.toFixed(2)} UA/ha` : '---',
          change: avgLotation > 0 ? 'Pressão de pastejo' : 'Sem dados de pasto',
          trend: 'neutral' as const,
          icon: MapIcon,
          color: '#f59e0b',
          periodLabel: 'Capacidade Suporte',
        },
        {
          label: 'Animais em Carência',
          subtitle: _lastHealthDateOv
            ? `Último manejo em ${_lastHealthDateOv}`
            : `Status em ${todayBR()}`,
          value: String(activeWithdrawals),
          change: activeWithdrawals > 0 ? 'Consumo bloqueado' : 'Todos liberados',
          trend: activeWithdrawals > 0 ? ('down' as const) : ('up' as const),
          icon: Activity,
          color: activeWithdrawals > 0 ? '#ef4444' : '#10b981',
          periodLabel: 'Alertas de Carência',
        },
      ],
      columns: [],
      totalCount: manejosPendentes.length,
    };
  } catch (error) {
    console.error('[dashboardOverview] Critical Failure:', error);
    return { data: [], stats: [], columns: [], totalCount: 0 };
  }
};

// ─────────────────────────────────────────────────────────────
// Pecuária: Gestão de Dietas
// ─────────────────────────────────────────────────────────────
export const dietas: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 20) => {
  const columns = [
    { header: 'Nome da Dieta', accessor: 'nome' },
    { header: 'Tipo', accessor: 'tipo' },
    {
      header: 'Custo/kg Natural',
      accessor: (row: any) =>
        row.custo_por_kg ? `R$ ${Number(row.custo_por_kg).toFixed(2)}` : '---',
    },
    {
      header: 'MS %',
      accessor: (row: any) => (row.percentual_ms ? `${row.percentual_ms}%` : '---'),
    },
    {
      header: 'Custo/kg MS',
      accessor: (row: any) => (row.custoMS ? `R$ ${Number(row.custoMS).toFixed(2)}` : '---'),
    },
  ];

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const scope = fazendaId ? { fazenda_id: fazendaId } : { tenant_id: tenantId };

    // ── Query principal (obrigatória) ─────────────────────────────────────
    const { data, count, error } = await withTimeout(
      supabase
        .from('dietas')
        .select('*', { count: 'exact' })
        .match(scope)
        .range(from, to) as unknown as Promise<any>
    );

    if (error) throw error;

    const dietasData = (data || []).map((d: any) => {
      const ms = d.percentual_ms ? d.percentual_ms / 100 : 0.88;
      const custoMS = d.custo_por_kg && ms > 0 ? Number(d.custo_por_kg) / ms : null;
      return { ...d, percMS: d.percentual_ms || null, custoMS };
    });

    const totalDietas = count || 0;
    const _lastDietDate = dietasData.length > 0 ? fmtDateBR(dietasData[0].created_at) : null;
    const dietasComCusto = dietasData.filter((d: any) => d.custoMS);
    const custoMedioKgMS =
      dietasComCusto.length > 0
        ? dietasComCusto.reduce((a: number, d: any) => a + d.custoMS, 0) / dietasComCusto.length
        : null;

    // ── Janela operacional: últimos 30 dias ───────────────────────────────
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje);
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    const dataInicio = trintaDiasAtras.toISOString().split('T')[0];

    // ── Queries opcionais: falha silenciosa, nunca quebra os KPIs 1 e 2 ──
    const [nutricaoRes, pesagensRes] = await Promise.all([
      supabase
        .from('nutricao_animais')
        .select('quantidade_kg, data_consumo, animal_id, dieta_id')
        .match(scope)
        .gte('data_consumo', dataInicio)
        .limit(1000)
        .then((r: any) => r.data || [])
        .catch(() => [] as any[]),

      supabase
        .from('pesagens')
        .select('animal_id, data_pesagem, peso')
        .match(scope)
        .gte('data_pesagem', dataInicio)
        .order('data_pesagem', { ascending: true })
        .limit(500)
        .then((r: any) => r.data || [])
        .catch(() => [] as any[]),
    ]);

    const nutricaoData: any[] = nutricaoRes as any[];
    const pesagensData: any[] = pesagensRes as any[];

    // ── KPI 3: Conversão Alimentar (CA = MS consumida / ganho de peso) ────
    let caReal: number | null = null;
    let caLabel = 'Sem lançamentos nos últimos 30 dias';

    if (nutricaoData.length > 0 && pesagensData.length > 0) {
      const totalConsumidoMS = nutricaoData.reduce((acc: number, row: any) => {
        // Usa MS default de 88% quando não temos o percentual da dieta
        const ms = 0.88;
        return acc + Number(row.quantidade_kg || 0) * ms;
      }, 0);

      const pesagensPorAnimal: Record<string, number[]> = {};
      for (const p of pesagensData) {
        if (!pesagensPorAnimal[p.animal_id]) pesagensPorAnimal[p.animal_id] = [];
        pesagensPorAnimal[p.animal_id].push(Number(p.peso));
      }

      let totalGanhoPeso = 0;
      for (const pesos of Object.values(pesagensPorAnimal)) {
        if (pesos.length >= 2) {
          const ganho = pesos[pesos.length - 1] - pesos[0];
          if (ganho > 0) totalGanhoPeso += ganho;
        }
      }

      if (totalConsumidoMS > 0 && totalGanhoPeso > 0) {
        caReal = totalConsumidoMS / totalGanhoPeso;
        caLabel = 'Últimos 30 dias (base MS 88%)';
      } else if (totalConsumidoMS > 0) {
        caLabel = 'Aguardando pesagens no período';
      }
    }

    // ── KPI 4: Consumo Médio Diário MS por cabeça ─────────────────────────
    let consumoMedioDM: number | null = null;
    let consumoDMLabel = 'Sem lançamentos nos últimos 30 dias';

    if (nutricaoData.length > 0) {
      const animaisUnicos = new Set(nutricaoData.map((r: any) => r.animal_id)).size;
      const diasUnicos = new Set(nutricaoData.map((r: any) => r.data_consumo)).size;

      if (animaisUnicos > 0 && diasUnicos > 0) {
        const totalMS = nutricaoData.reduce(
          (acc: number, row: any) => acc + Number(row.quantidade_kg || 0) * 0.88,
          0
        );
        consumoMedioDM = totalMS / (animaisUnicos * diasUnicos);
        consumoDMLabel = `${animaisUnicos} animais · ${diasUnicos} dias`;
      }
    }

    const sparklineConsumo =
      nutricaoData.length > 0
        ? buildSparkline(nutricaoData, 'data_consumo', 'quantidade_kg')
        : buildSparkline(dietasData, 'created_at', null);

    return {
      data: dietasData,
      columns,
      totalCount: count || 0,
      stats: [
        {
          label: 'Dietas Formuladas',
          subtitle: _lastDietDate
            ? `Último cadastro em ${_lastDietDate}`
            : `Cadastro em ${todayBR()}`,
          sparkline: buildSparkline(dietasData, 'created_at', null),
          value: totalDietas > 0 ? String(totalDietas) : '0',
          change: totalDietas > 0 ? 'Cadastradas' : 'Nenhuma dieta',
          trend: 'neutral' as const,
          icon: Activity,
          color: 'hsl(var(--brand))',
        },
        {
          label: 'Custo Médio/kg MS',
          subtitle: _lastDietDate ? `Base: ${_lastDietDate}` : `Período: ${monthYearBR()}`,
          sparkline: buildSparkline(dietasData, 'created_at', 'custo_por_kg'),
          value: custoMedioKgMS ? `R$ ${custoMedioKgMS.toFixed(2)}` : 'Sem custo',
          change: custoMedioKgMS ? 'Média das dietas ativas' : 'Cadastrar custo nas dietas',
          trend: 'neutral' as const,
          icon: Scale,
          color: 'hsl(var(--warning))',
        },
        {
          label: 'Conversão Alimentar (CA)',
          subtitle: caLabel,
          sparkline: sparklineConsumo,
          value: caReal !== null ? `${caReal.toFixed(2)} : 1` : 'Sem dados',
          change:
            caReal !== null
              ? caReal <= 5
                ? '✓ Excelente'
                : caReal <= 7
                  ? '⚠ Adequado'
                  : '⚑ Revisar dieta'
              : 'Lançar tratos + pesagens',
          trend:
            caReal !== null
              ? caReal <= 7
                ? ('up' as const)
                : ('down' as const)
              : ('neutral' as const),
          icon: TrendingUp,
          color: 'hsl(var(--success))',
        },
        {
          label: 'Consumo Médio DM',
          subtitle: consumoDMLabel,
          sparkline: sparklineConsumo,
          value: consumoMedioDM !== null ? `${consumoMedioDM.toFixed(2)} kg/cab/dia` : 'Sem dados',
          change: consumoMedioDM !== null ? 'Últimos 30 dias' : 'Lançar tratos para calcular',
          trend: 'neutral' as const,
          icon: Activity,
          color: 'hsl(var(--brand))',
        },
      ],
    };
  } catch (error: any) {
    console.error('[dietas handler]', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

// ─────────────────────────────────────────────────────────────
// Pecuária: Gestão de Animais
// ─────────────────────────────────────────────────────────────
export const animais: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 20, filters: Record<string, unknown> = {}) => {
  const columns = [
    { header: 'Brinco', accessor: 'brinco' },
    { header: 'Raça', accessor: 'raca' },
    {
      header: 'Sexo',
      accessor: (row: any) =>
        row.sexo === 'M' ? 'Macho' : row.sexo === 'F' ? 'Fêmea' : row.sexo || '---',
    },
    { header: 'Lote', accessor: 'lote' },
    {
      header: 'Peso Atual',
      accessor: (row: any) => (row.peso_atual ? `${Number(row.peso_atual).toFixed(1)} kg` : '---'),
    },
    {
      header: 'Carência Sanitária',
      accessor: (row: any) => (row.isSanitaryBlocked ? '⚠️ Bloqueado' : '✅ Liberado'),
    },
    { header: 'Status', accessor: 'status' },
  ];

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let animaisQuery = supabase.from('animais').select('*, lotes(nome)', { count: 'exact' });
    animaisQuery = applyScope(animaisQuery, tenantId, fazendaId);

    // ── Server-side filters ───────────────────────────────────────────────
    // Status filter: normalize case (Ativo = ATIVO)
    if (filters.status && filters.status !== 'all') {
      const statusVal = String(filters.status);
      // Handle both 'Ativo' and 'ATIVO' by using ilike or explicit OR
      if (statusVal === 'Ativo' || statusVal === 'ATIVO') {
        animaisQuery = animaisQuery.in('status', ['Ativo', 'ATIVO']);
      } else {
        animaisQuery = animaisQuery.eq('status', statusVal);
      }
    }
    // Sexo filter
    if (filters.sexo && filters.sexo !== 'all') {
      animaisQuery = animaisQuery.eq('sexo', String(filters.sexo));
    }
    // Raças filter (array)
    if (Array.isArray(filters.racas) && (filters.racas as string[]).length > 0) {
      animaisQuery = animaisQuery.in('raca', filters.racas as string[]);
    }
    // Min weight filter
    if (filters.minWeight && Number(filters.minWeight) > 0) {
      animaisQuery = animaisQuery.gte('peso_atual', Number(filters.minWeight));
    }
    // Search term filter (brinco or raca)
    if (filters.searchTerm && String(filters.searchTerm).trim()) {
      const term = String(filters.searchTerm).trim();
      animaisQuery = animaisQuery.or(`brinco.ilike.%${term}%,raca.ilike.%${term}%`);
    }

    let sanidadeQuery = supabase
      .from('sanidade')
      .select('animal_id, lote_id, data_manejo, carencia_dias, status')
      .eq('status', 'REALIZADO')
      .gt('carencia_dias', 0);
    sanidadeQuery = applyScope(sanidadeQuery, tenantId, fazendaId);

    const [dataRes, statsRes, sanidadeRes, gmdRes] = await Promise.all([
      withTimeout(
        animaisQuery
          .order('created_at', { ascending: false })
          .range(from, to) as unknown as Promise<any>
      ),
      withTimeout(
        supabase.rpc('get_animal_stats', {
          p_tenant_id: tenantId,
          p_fazenda_id: fazendaId,
        }) as unknown as Promise<any>
      ),
      withTimeout(sanidadeQuery as unknown as Promise<any>),
      withTimeout(
        supabase.rpc('calculate_herd_gmd', {
          p_tenant_id: tenantId,
          p_fazenda_id: fazendaId,
        }) as unknown as Promise<any>
      ),
    ]);

    if (dataRes.error) {
      throw dataRes.error;
    }

    const totalAnimals = dataRes.count || 0;
    const activeAnimals = Number(statsRes.data?.active || 0);
    const deadAnimals = Number(statsRes.data?.dead || 0);
    const soldAnimals = Number(statsRes.data?.sold || 0);
    const gmdGlobal = Number(gmdRes.data || 0);

    // ── Peso Médio: usar RPC se disponível; fallback JS excluindo zeros ─────
    // Bug fix: avg_weight from RPC may include animals with peso=0 (no weighing)
    // Correct: compute from page data rows with peso > 0 as JS fallback
    const rpcAvgWeight = Number(statsRes.data?.avg_weight || 0);
    const pageRows: any[] = dataRes.data || [];
    const rowsWithWeight = pageRows.filter((a: any) => (a.peso_atual || a.peso_inicial || 0) > 0);
    const jsAvgWeight = rowsWithWeight.length > 0
      ? rowsWithWeight.reduce((s: number, a: any) => s + Number(a.peso_atual || a.peso_inicial || 0), 0) / rowsWithWeight.length
      : 0;
    // Prefer RPC value if it looks correct (> 50kg); otherwise use JS calc
    const avgWeight = (rpcAvgWeight > 50) ? rpcAvgWeight : jsAvgWeight;

    // Carências ativas: calcular quais animais/lotes estão em período de carência
    const activeSanidades = (sanidadeRes?.data || []).filter((s: any) => {
      if (!s.data_manejo || !s.carencia_dias) {
        return false;
      }
      const releaseDate = new Date(s.data_manejo);
      releaseDate.setDate(releaseDate.getDate() + Number(s.carencia_dias));
      return releaseDate > new Date();
    });

    const _lastAnimalDate = pageRows[0]?.created_at
      ? fmtDateBR(pageRows[0].created_at)
      : null;
    const blockedAnimalIds = new Set(
      activeSanidades.filter((s: any) => s.animal_id).map((s: any) => s.animal_id)
    );
    const blockedLoteIds = new Set(
      activeSanidades.filter((s: any) => s.lote_id).map((s: any) => s.lote_id)
    );

    // Arroba padrão CEPEA: 1@ = 30 kg (peso vivo comercial)
    const ARROBA_DIVISOR = 30;
    const totalArrobas = avgWeight > 0 && activeAnimals > 0
      ? ((avgWeight * activeAnimals) / ARROBA_DIVISOR).toFixed(0)
      : null;

    return {
      data: pageRows.map((a: any) => ({
        ...a,
        lote: a.lotes?.nome || '---',
        isSanitaryBlocked:
          blockedAnimalIds.has(a.id) || (a.lote_id && blockedLoteIds.has(a.lote_id)),
      })),
      columns,
      stats: [
        {
          label: 'Total Rebanho',
          subtitle: _lastAnimalDate
            ? `Último cadastro em ${_lastAnimalDate}`
            : `Inventário em ${todayBR()}`,
          sparkline: buildSparkline(pageRows, 'created_at', null),
          value: totalAnimals > 0 ? totalAnimals.toLocaleString() : '---',
          change: activeAnimals > 0 ? `${activeAnimals} ativos` : 'Sem animais',
          trend: 'neutral' as const,
          icon: Beef,
          color: 'hsl(var(--brand))',
        },
        {
          label: 'Peso Médio',
          subtitle: avgWeight > 50
            ? `≈ ${(avgWeight / ARROBA_DIVISOR).toFixed(1)}@ por cabeça (CEPEA)`
            : 'Cadastre pesagens para calcular',
          sparkline: buildSparkline(pageRows, 'created_at', 'peso_atual'),
          value: avgWeight > 0 ? `${avgWeight.toFixed(1)} kg` : '---',
          change: totalArrobas
            ? `${totalArrobas}@ total estimado`
            : 'Sem pesagens registradas',
          trend: avgWeight > 50 ? ('up' as const) : ('neutral' as const),
          icon: Scale,
          color: 'hsl(var(--warning))',
        },
        {
          label: 'Abatidos / Vendidos',
          subtitle: `Saídas registradas até ${todayBR()}`,
          sparkline: buildSparkline(pageRows, 'created_at', null),
          value: (deadAnimals + soldAnimals) > 0 ? String(deadAnimals + soldAnimals) : '0',
          change: deadAnimals > 0 || soldAnimals > 0
            ? `${deadAnimals} abatidos · ${soldAnimals} vendidos`
            : 'Nenhuma saída registrada',
          trend: 'neutral' as const,
          icon: Skull,
          color: 'hsl(var(--danger))',
        },
        {
          label: 'GMD Médio',
          subtitle: gmdGlobal > 0 ? 'Últimas pesagens do rebanho' : 'Cadastre pesagens para calcular',
          sparkline: buildSparkline(pageRows, 'created_at', null),
          value: gmdGlobal > 0 ? `${gmdGlobal.toFixed(3)} kg/dia` : '---',
          change: gmdGlobal > 0 ? 'Base: histórico de pesagens' : 'Sem pesagens registradas',
          trend: gmdGlobal > 0 ? ('up' as const) : ('neutral' as const),
          icon: TrendingUp,
          color: 'hsl(var(--success))',
        },
      ],
      totalCount: totalAnimals,
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

// ─────────────────────────────────────────────────────────────
// Pecuária: Gestão de Lotes
// ─────────────────────────────────────────────────────────────
export const lotes: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 20) => {
  const columns = [
    { header: 'Nome do Lote', accessor: 'nome' },
    {
      header: 'Animais',
      accessor: (row: any) =>
        row.quantidade_animais > 0 ? `${row.quantidade_animais} cab` : '---',
    },
    { header: 'Fase', accessor: (row: any) => row.fase || '---' },
    { header: 'Status', accessor: (row: any) => row.status || '---' },
  ];

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('lotes').select('*, animais(count)', { count: 'exact' });
    query = applyScope(query, tenantId, fazendaId);

    const { data, count, error } = await withTimeout(
      query.order('created_at', { ascending: false }).range(from, to) as unknown as Promise<any>
    );
    if (error) {
      throw error;
    }

    const mappedData = (data || []).map((l: any) => {
      const animalCount = Array.isArray(l.animais)
        ? l.animais[0]?.count || 0
        : l.animais?.count || 0;
      return { ...l, quantidade_animais: animalCount };
    });

    // KPIs calculados dos dados reais
    const activeLots = mappedData.filter(
      (l: any) => l.status?.toUpperCase() !== 'ARQUIVADO'
    ).length;
    const totalAnimalsInLots = mappedData.reduce(
      (acc: number, l: any) => acc + (l.quantidade_animais || 0),
      0
    );

    const _lastLoteDate = mappedData.length > 0 ? fmtDateBR(mappedData[0].created_at) : null;

    // Taxa de ocupação = lotes com animais / total de lotes
    const lotesComAnimais = mappedData.filter((l: any) => l.quantidade_animais > 0).length;
    const taxaOcupacao =
      count && count > 0 ? `${((lotesComAnimais / count) * 100).toFixed(0)}%` : '---';

    return {
      data: mappedData,
      columns,
      stats: [
        {
          label: 'Lotes Operacionais',
          subtitle: _lastLoteDate
            ? `Último cadastro em ${_lastLoteDate}`
            : `Status em ${todayBR()}`,
          sparkline: buildSparkline(mappedData, 'created_at', null),
          value: count !== null && count > 0 ? String(count) : '---',
          change: activeLots > 0 ? `${activeLots} ativos` : 'Sem lotes',
          trend: 'neutral' as const,
          icon: MapIcon,
          color: 'hsl(var(--brand))',
        },
        {
          label: 'Taxa de Ocupação',
          subtitle: `Verificado em ${todayBR()}`,
          sparkline: buildSparkline(mappedData, 'created_at', 'quantidade_animais'),
          value: taxaOcupacao,
          change: taxaOcupacao !== '---' ? 'Lotes com animais' : 'Sem dados',
          trend: 'neutral' as const,
          icon: Activity,
          color: 'hsl(var(--success))',
        },
        {
          label: 'Animais Totais',
          subtitle: `Inventário em ${todayBR()}`,
          sparkline: buildSparkline(mappedData, 'created_at', 'quantidade_animais'),
          value: totalAnimalsInLots > 0 ? totalAnimalsInLots.toLocaleString() : '---',
          change: totalAnimalsInLots > 0 ? 'Em lotes ativos' : 'Sem animais',
          trend: 'neutral' as const,
          icon: Beef,
          color: 'hsl(var(--brand))',
        },
        {
          label: 'Uniformidade Lotes',
          subtitle: 'Calcular via pesagens do rebanho',
          sparkline: buildSparkline(mappedData, 'created_at', null),
          value: '---',
          change: 'Calcular via pesagens',
          trend: 'neutral' as const,
          icon: TrendingUp,
          color: 'hsl(var(--warning))',
        },
      ],
      totalCount: count || 0,
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

// ─────────────────────────────────────────────────────────────
// Pecuária: Gestão de Reprodução
// ─────────────────────────────────────────────────────────────
export const reproducao: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 20) => {
  const columns = [
    {
      header: 'Matriz / Brinco',
      accessor: (row: any) => (row.animais?.brinco ? `#${row.animais.brinco}` : '---'),
    },
    { header: 'Tipo Evento', accessor: 'tipo_evento' },
    {
      header: 'Data Evento',
      accessor: (row: any) =>
        row.data_evento ? new Date(row.data_evento).toLocaleDateString('pt-BR') : '---',
    },
    { header: 'Resultado', accessor: 'resultado' },
    {
      header: 'Dias de Gestação',
      accessor: (row: any) =>
        row.resultado === 'Prenha' ? `${row.diasGestacao || 0} dias` : '---',
    },
    {
      header: 'Previsão Parto',
      accessor: (row: any) =>
        row.previsaoParto ? new Date(row.previsaoParto).toLocaleDateString('pt-BR') : '---',
    },
    { header: 'Touro/Sêmen', accessor: (row: any) => row.touro || row.partida_semen || '---' },
    { header: 'Inseminador', accessor: (row: any) => row.tecnico || '---' },
    { header: 'Cria', accessor: (row: any) => row.sexo_cria ? `${row.sexo_cria} ${row.peso_nascimento ? `(${row.peso_nascimento}kg)` : ''}` : '---' },
    {
      header: 'Observações',
      accessor: (row: any) => row.observacoes || '---',
    },
    {
      header: 'Progresso Gestação',
      accessor: (row: any) =>
        row.resultado === 'Prenha' ? `${Number(row.progressoGestacao || 0).toFixed(0)}%` : '---',
    },
  ];

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('eventos_reprodutivos')
      .select('*, animais(id, brinco)', { count: 'exact' });
    query = applyScope(query, tenantId, fazendaId);

    const { data, count, error } = await withTimeout(
      query.order('data_evento', { ascending: false }).range(from, to) as unknown as Promise<any>
    );
    if (error) {
      throw error;
    }

    const rawData = data || [];
    const gestacaoMedia = 285; // dias de gestação bovina padrão

    const enrichedData = rawData.map((item: any) => {
      let previsaoParto = null;
      let progressoGestacao = 0;
      let diasGestacao = 0;

      if (item.resultado === 'Prenha' && item.data_evento) {
        const dataConcepcao = new Date(item.data_evento);
        previsaoParto = new Date(dataConcepcao);
        previsaoParto.setDate(previsaoParto.getDate() + gestacaoMedia);
        const diffTime = Math.max(0, new Date().getTime() - dataConcepcao.getTime());
        diasGestacao = Math.floor(diffTime / 86400000);
        progressoGestacao = Math.min(100, (diasGestacao / gestacaoMedia) * 100);
      }

      const animal = Array.isArray(item.animais) ? item.animais[0] : item.animais;
      return { ...item, previsaoParto, progressoGestacao, diasGestacao, animais: animal };
    });

    const _lastEventDate = rawData.length > 0 ? fmtDateBR(rawData[0].data_evento) : null;

    // KPIs calculados dos dados reais
    const prenhas = rawData.filter((r: any) => r.resultado === 'Prenha').length;
    const totalEventos = count || rawData.length;
    const taxaPrenhez =
      totalEventos > 0 ? `${((prenhas / totalEventos) * 100).toFixed(1)}%` : '---';

    // Partos previstos nos próximos 30 dias
    const hoje = new Date();
    const daqui30 = new Date();
    daqui30.setDate(daqui30.getDate() + 30);
    const partosPrevistosProximo = enrichedData.filter(
      (e: any) => e.previsaoParto && e.previsaoParto >= hoje && e.previsaoParto <= daqui30
    ).length;

    return {
      data: enrichedData,
      columns,
      stats: [
        {
          label: 'Taxa de Prenhez',
          subtitle: _lastEventDate
            ? `Último evento em ${_lastEventDate}`
            : `Apurada em ${todayBR()}`,
          sparkline: buildSparkline(rawData, 'data_evento', null),
          value: taxaPrenhez,
          change: totalEventos > 0 ? `${prenhas} prenhas de ${totalEventos}` : 'Sem eventos',
          trend: prenhas > 0 ? ('up' as const) : ('neutral' as const),
          icon: TrendingUp,
          color: 'hsl(var(--success))',
        },
        {
          label: 'Partos Previstos (30d)',
          subtitle: 'Previsão: próximos 30 dias',
          sparkline: buildSparkline(rawData, 'data_evento', null),
          value: totalEventos > 0 ? String(partosPrevistosProximo) : '---',
          change: partosPrevistosProximo > 0 ? 'Próximos 30 dias' : 'Nenhum previsto',
          trend: 'neutral' as const,
          icon: Calendar,
          color: 'hsl(var(--brand))',
        },
        {
          label: 'Total Prenhas',
          subtitle: _lastEventDate
            ? `Base: evento de ${_lastEventDate}`
            : `Inventário em ${todayBR()}`,
          sparkline: buildSparkline(rawData, 'data_evento', null),
          value: prenhas > 0 ? String(prenhas) : '---',
          change: prenhas > 0 ? 'Em gestação' : 'Sem prenhas',
          trend: 'neutral' as const,
          icon: Activity,
          color: 'hsl(var(--warning))',
        },
        {
          label: 'Intervalo Entre Partos',
          subtitle: 'Requer histórico de partos registrados',
          sparkline: buildSparkline(rawData, 'data_evento', null),
          value: '---',
          change: 'Requer histórico de partos',
          trend: 'neutral' as const,
          icon: Scale,
          color: 'hsl(var(--brand))',
        },
      ],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('[Reproducao] Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};

// ─────────────────────────────────────────────────────────────
// Pecuária: Gestão de Pesagens
// ─────────────────────────────────────────────────────────────
export const pesagens: ReportHandler = async (tenantId, fazendaId, page = 1, pageSize = 20) => {
  const columns = [
    {
      header: 'Brinco',
      accessor: (row: any) => (row.animais?.brinco ? `#${row.animais.brinco}` : '---'),
    },
    {
      header: 'Peso',
      accessor: (row: any) => (row.peso ? `${Number(row.peso).toFixed(1)} kg` : '---'),
    },
    {
      header: 'GMD Calculado',
      accessor: (row: any) =>
        row.gmd !== null && row.gmd !== undefined ? `${Number(row.gmd).toFixed(3)} kg/dia` : '---',
    },
    {
      header: 'Data da Pesagem',
      accessor: (row: any) =>
        row.data_pesagem ? new Date(row.data_pesagem).toLocaleDateString('pt-BR') : '---',
    },
  ];

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;


    const [pesagensRes, gmdRes, weightRes] = await Promise.all([
      withTimeout(
        applyScope(
          supabase.from('pesagens').select('*, animais(id, brinco, lote_id)', { count: 'exact' }),
          tenantId,
          fazendaId
        )
          .order('data_pesagem', { ascending: false })
          .range(from, to) as unknown as Promise<any>
      ),
      withTimeout(
        supabase.rpc('calculate_herd_gmd', {
          p_tenant_id: tenantId,
          p_fazenda_id: fazendaId,
        }) as unknown as Promise<any>
      ),
      withTimeout(
        supabase.rpc('get_herd_total_weight', {
          p_tenant_id: tenantId,
          p_fazenda_id: fazendaId,
        }) as unknown as Promise<any>
      ),
    ]);

    if (pesagensRes.error) {
      throw pesagensRes.error;
    }

    const data = pesagensRes.data || [];
    const gmdGlobal = Number(gmdRes.data || 0);
    const pesoTotal = Number(weightRes.data || 0);

    // GMD por pesagem: diferença em relação à pesagem anterior do mesmo animal
    const enrichedData = data.map((curr: any, idx: number) => {
      const prev = data.slice(idx + 1).find((w: any) => w.animal_id === curr.animal_id);
      let gmd: number | null = null;
      if (prev) {
        const days =
          (new Date(curr.data_pesagem).getTime() - new Date(prev.data_pesagem).getTime()) /
          86400000;
        if (days > 0) {
          gmd = (Number(curr.peso) - Number(prev.peso)) / days;
        }
      }
      const animal = Array.isArray(curr.animais) ? curr.animais[0] : curr.animais;
      return { ...curr, gmd, animais: animal };
    });

    const _lastPesagemDate = data.length > 0 ? fmtDateBR(data[0].data_pesagem) : null;

    // Peso médio dos dados da página atual
    const pesoMedioPagina =
      data.length > 0
        ? data.reduce((a: number, p: any) => a + Number(p.peso || 0), 0) / data.length
        : 0;

    return {
      data: enrichedData,
      columns,
      stats: [
        {
          label: 'Total de Pesagens',
          subtitle: _lastPesagemDate ? `Última pesagem em ${_lastPesagemDate}` : 'Sem pesagens',
          sparkline: buildSparkline(data, 'data_pesagem', null),
          value:
            pesagensRes.count !== null && pesagensRes.count > 0
              ? pesagensRes.count.toLocaleString()
              : '---',
          change: pesagensRes.count > 0 ? 'Registros no banco' : 'Sem pesagens',
          trend: 'neutral' as const,
          icon: Scale,
          color: 'hsl(var(--brand))',
        },
        {
          label: 'GMD Médio Global',
          subtitle: _lastPesagemDate
            ? `Base: pesagem de ${_lastPesagemDate}`
            : 'Sem base de cálculo',
          sparkline: buildSparkline(data, 'data_pesagem', 'peso'),
          value: gmdGlobal > 0 ? `${gmdGlobal.toFixed(3)} kg/dia` : '---',
          change: gmdGlobal > 0 ? 'Rebanho completo' : 'Sem base de cálculo',
          trend: gmdGlobal > 0 ? ('up' as const) : ('neutral' as const),
          icon: TrendingUp,
          color: 'hsl(var(--success))',
        },
        {
          label: 'Peso Total Rebanho',
          subtitle: _lastPesagemDate
            ? `Apurado em ${_lastPesagemDate}`
            : `Inventário em ${todayBR()}`,
          sparkline: buildSparkline(data, 'data_pesagem', 'peso'),
          value: pesoTotal > 0 ? `${(pesoTotal / 1000).toFixed(1)} ton` : '---',
          change: pesoTotal > 0 ? 'Soma última pesagem' : 'Sem dados',
          trend: 'neutral' as const,
          icon: Beef,
          color: 'hsl(var(--brand))',
        },
        {
          label: 'Peso Médio (Página)',
          subtitle: _lastPesagemDate
            ? `Última pesagem: ${_lastPesagemDate}`
            : `Média em ${todayBR()}`,
          sparkline: buildSparkline(data, 'data_pesagem', 'peso'),
          value: pesoMedioPagina > 0 ? `${pesoMedioPagina.toFixed(1)} kg` : '---',
          change: pesoMedioPagina > 0 ? `${data.length} registros exibidos` : 'Sem dados',
          trend: 'neutral' as const,
          icon: Activity,
          color: 'hsl(var(--warning))',
        },
      ],
      totalCount: pesagensRes.count || 0,
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { data: [], stats: [], columns, totalCount: 0 };
  }
};
