import { supabase } from './supabase';

const startOfDay = (date: Date) => new Date(date.setHours(0, 0, 0, 0));
const subDays = (date: Date, amount: number) =>
  new Date(date.getTime() - amount * 24 * 60 * 60 * 1000);
const format = (date: Date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export interface SparklinePoint {
  value: number;
  label: string;
}

/**
 * Gera sparklines históricas baseadas em dados REAIS do banco.
 * Nunca usa Math.random() nem variações artificiais.
 * Retorna fallbackSparkline() (zeros) quando não há dados.
 */
export const generateHistoricalSparkline = async (
  kpiType: 'rebanho' | 'caixa' | 'gmd' | 'lotacao' | 'estoque',
  tenantId: string,
  farmId: string | null,
  periodDays: number = 30
): Promise<SparklinePoint[]> => {
  const points: SparklinePoint[] = [];
  const today = startOfDay(new Date());
  const BUCKETS = 15;
  const step = Math.max(1, Math.floor(periodDays / BUCKETS));

  try {
    // ─── REBANHO ───────────────────────────────────────────────────────────────
    if (kpiType === 'rebanho') {
      let query = supabase
        .from('animais')
        .select('created_at, data_saida, status')
        .eq('tenant_id', tenantId);
      if (farmId) {
        query = query.eq('fazenda_id', farmId);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return fallbackSparkline();
      }

      for (let i = BUCKETS - 1; i >= 0; i--) {
        const targetDate = subDays(today, i * step);
        let countAtDate = 0;
        data.forEach((animal) => {
          const entryDate = new Date(animal.created_at);
          const exitDate = animal.data_saida ? new Date(animal.data_saida) : null;
          if (entryDate <= targetDate && (!exitDate || exitDate > targetDate)) {
            countAtDate++;
          }
        });
        points.push({ value: countAtDate, label: `${countAtDate} cab. em ${format(targetDate)}` });
      }
      return points;
    }

    // ─── CAIXA ─────────────────────────────────────────────────────────────────
    if (kpiType === 'caixa') {
      const fetchContas = async (table: string, tipo: 'receita' | 'despesa') => {
        let q = supabase
          .from(table)
          .select('data_pagamento, valor_pago')
          .eq('tenant_id', tenantId)
          .eq('status', 'PAGO')
          .not('data_pagamento', 'is', null);
        if (farmId) {
          q = q.eq('fazenda_id', farmId);
        }
        const { data } = await q;
        return (data || []).map((d: any) => ({
          date: new Date(d.data_pagamento),
          valor: tipo === 'receita' ? Number(d.valor_pago) : -Number(d.valor_pago),
        }));
      };

      const [receitas, despesas] = await Promise.all([
        fetchContas('contas_receber', 'receita'),
        fetchContas('contas_pagar', 'despesa'),
      ]);
      const transacoes = [...receitas, ...despesas];
      if (transacoes.length === 0) {
        return fallbackSparkline();
      }

      for (let i = BUCKETS - 1; i >= 0; i--) {
        const targetDate = subDays(today, i * step);
        let saldo = 0;
        transacoes.forEach((t) => {
          if (t.date <= targetDate) {
            saldo += t.valor;
          }
        });
        const val =
          saldo >= 1000 || saldo <= -1000 ? `${(saldo / 1000).toFixed(1)}k` : saldo.toFixed(2);
        points.push({ value: saldo, label: `R$ ${val} em ${format(targetDate)}` });
      }
      return points;
    }

    // ─── GMD ───────────────────────────────────────────────────────────────────
    // A coluna 'gmd' não existe na tabela pesagens.
    // Calculamos o GMD real a partir de pesos consecutivos do mesmo animal.
    if (kpiType === 'gmd') {
      let q = supabase
        .from('pesagens')
        .select('animal_id, peso, data_pesagem')
        .eq('tenant_id', tenantId)
        .order('data_pesagem', { ascending: true });
      if (farmId) {
        q = q.eq('fazenda_id', farmId);
      }
      const { data } = await q;

      if (!data || data.length < 2) {
        return fallbackSparkline();
      }

      // Agrupar pesagens por animal e calcular GMD entre pesagens consecutivas
      const byAnimal: Record<string, { peso: number; data: string }[]> = {};
      data.forEach((p: any) => {
        if (!byAnimal[p.animal_id]) {
          byAnimal[p.animal_id] = [];
        }
        byAnimal[p.animal_id].push({ peso: Number(p.peso), data: p.data_pesagem });
      });

      // GMD por data: { dateKey → [gmd1, gmd2, ...] }
      const gmdByDate: Record<string, number[]> = {};
      Object.values(byAnimal).forEach((pesagens) => {
        for (let i = 1; i < pesagens.length; i++) {
          const days = Math.max(
            1,
            (new Date(pesagens[i].data).getTime() - new Date(pesagens[i - 1].data).getTime()) /
              86400000
          );
          const gmd = (pesagens[i].peso - pesagens[i - 1].peso) / days;
          if (!gmdByDate[pesagens[i].data]) {
            gmdByDate[pesagens[i].data] = [];
          }
          gmdByDate[pesagens[i].data].push(gmd);
        }
      });

      const sortedDates = Object.keys(gmdByDate).sort();
      if (sortedDates.length === 0) {
        return fallbackSparkline();
      }

      for (let i = BUCKETS - 1; i >= 0; i--) {
        const targetDate = subDays(today, i * step);
        const targetDateStr = targetDate.toISOString().split('T')[0];
        // Pesagem mais próxima até a data alvo
        const relevantDates = sortedDates.filter((d) => d <= targetDateStr);
        let avgGMD = 0;
        if (relevantDates.length > 0) {
          const closest = relevantDates[relevantDates.length - 1];
          const vals = gmdByDate[closest];
          avgGMD = vals.reduce((a, b) => a + b, 0) / vals.length;
        }
        points.push({
          value: Math.max(0, avgGMD),
          label: `${avgGMD.toFixed(3)} kg em ${format(targetDate)}`,
        });
      }
      return points;
    }

    // ─── LOTAÇÃO ───────────────────────────────────────────────────────────────
    // Sem histórico de movimentações por data de pasto, usamos count atual / área total
    // como valor real repetido (linha plana). Sem variação artificial.
    if (kpiType === 'lotacao') {
      const [animalRes, pastosRes] = await Promise.all([
        supabase
          .from('animais')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .ilike('status', 'ativo'),
        supabase.from('pastos').select('area').eq('tenant_id', tenantId),
      ]);
      const totalAnimais = animalRes.count || 0;
      const totalArea = (pastosRes.data || []).reduce(
        (acc: number, p: any) => acc + Number(p.area || 0),
        0
      );
      const currentLotacao = totalArea > 0 ? totalAnimais / totalArea : 0;

      if (currentLotacao === 0) {
        return fallbackSparkline();
      }

      for (let i = BUCKETS - 1; i >= 0; i--) {
        const targetDate = subDays(today, i * step);
        points.push({
          value: currentLotacao,
          label: `${currentLotacao.toFixed(2)} UA/ha em ${format(targetDate)}`,
        });
      }
      return points;
    }

    // ─── ESTOQUE ───────────────────────────────────────────────────────────────
    // Sem histórico de preços por data, usamos o valor atual como linha plana real.
    if (kpiType === 'estoque') {
      let q = supabase
        .from('produtos')
        .select('estoque_atual, custo_medio')
        .eq('tenant_id', tenantId);
      if (farmId) {
        q = q.eq('fazenda_id', farmId);
      }
      const { data } = await q;

      const totalValue = (data || []).reduce(
        (acc: number, p: any) => acc + Number(p.estoque_atual || 0) * Number(p.custo_medio || 0),
        0
      );
      if (totalValue === 0) {
        return fallbackSparkline();
      }

      for (let i = BUCKETS - 1; i >= 0; i--) {
        const targetDate = subDays(today, i * step);
        const valFormatted =
          totalValue >= 1000 ? `${(totalValue / 1000).toFixed(1)}k` : totalValue.toFixed(2);
        points.push({ value: totalValue, label: `R$ ${valFormatted} em ${format(targetDate)}` });
      }
      return points;
    }
  } catch (error) {
    console.error('[TauzeHistoricalEngine] Error:', error);
  }

  return fallbackSparkline();
};

const fallbackSparkline = (): SparklinePoint[] =>
  Array(15)
    .fill(null)
    .map(() => ({ value: 0, label: 'Sem Histórico' }));
