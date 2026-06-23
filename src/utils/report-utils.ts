/**
 * report-utils.ts
 * ─────────────────────────────────────────────────────────────
 * Utilitários compartilhados por todos os report-handlers.
 * Centraliza funções que estavam duplicadas em 7 arquivos,
 * reduzindo o bundle e garantindo comportamento consistente.
 *
 * @module report-utils
 */

// ─── Tipos base ────────────────────────────────────────────

/**
 * Representa um registro genérico vindo do banco de dados Supabase.
 * Usamos Record<string, unknown> em vez de `any` para forçar acessos
 * explícitos com coerção de tipo (Number(), String(), etc.).
 */
export type DbRecord = Record<string, unknown>;

/**
 * Alias para a API de query do Supabase.
 * Evita depender do tipo exato do Supabase que pode mudar entre versões.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseQuery = any;

// ─── Constantes ──────────────────────────────────────────────
export const REPORT_TIMEOUT_MS = 30_000;

export const PENDING_STATUSES = ['PENDENTE', 'pendente', 'aberto', 'ABERTO'] as const;
export const PAID_STATUSES = [
  'PAGO',
  'pago',
  'LIQUIDADO',
  'liquidado',
  'RECEBIDO',
  'recebido',
] as const;

// ─── Formatação de datas (pt-BR) ─────────────────────────────

/** Data de hoje no formato dd/mm/aaaa */
export const todayBR = (): string =>
  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Mês e ano atual no formato "jan. 2025" */
export const monthYearBR = (): string =>
  new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

/** Período do mês atual "01/06 – 18/06" */
export const periodoBR = (): string => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} – ${todayBR()}`;
};

/**
 * Formata uma data ISO/string para dd/mm/aaaa.
 * Retorna todayBR() se a data for nula ou inválida.
 */
export const fmtDateBR = (dateStr?: string | null): string => {
  if (!dateStr) return todayBR();
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return todayBR();
  }
};

/** Retorna a data mais recente (formatada em pt-BR) de um array de registros. */
export const latestDate = (records: DbRecord[], dateField: string): string | null => {
  if (!records || records.length === 0) return null;
  const sorted = [...records]
    .filter((r) => r[dateField])
    .sort((a, b) => new Date(b[dateField] as string).getTime() - new Date(a[dateField] as string).getTime());
  return sorted.length > 0 ? fmtDateBR(sorted[0][dateField] as string) : null;
};

/** Retorna a data do registro pendente mais antigo (formatada em pt-BR). */
export const earliestPending = (
  records: DbRecord[],
  dateField: string,
  pendingStatuses: string[] = [...PENDING_STATUSES]
): string | null => {
  const pending = records.filter((r) => r[dateField] && pendingStatuses.includes(String(r.status ?? '')));
  if (pending.length === 0) return null;
  const sorted = pending.sort(
    (a, b) => new Date(a[dateField] as string).getTime() - new Date(b[dateField] as string).getTime()
  );
  return fmtDateBR(sorted[0][dateField] as string);
};

/** Retorna a data do registro pago mais recente (formatada em pt-BR). */
export const latestPaid = (
  records: DbRecord[],
  dateField: string,
  paidStatuses: string[] = [...PAID_STATUSES]
): string | null => {
  const paid = records.filter((r) => r[dateField] && paidStatuses.includes(String(r.status ?? '')));
  if (paid.length === 0) return null;
  const sorted = paid.sort(
    (a, b) => new Date(b[dateField] as string).getTime() - new Date(a[dateField] as string).getTime()
  );
  return fmtDateBR(sorted[0][dateField] as string);
};

// ─── Timeout wrapper ─────────────────────────────────────────

/**
 * Adiciona um timeout a qualquer Promise.
 * Rejeita com Error('TIMEOUT') se o timeout for atingido antes da resolução.
 *
 * @example
 * const result = await withTimeout(supabase.from('animais').select('*'), 10_000);
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = REPORT_TIMEOUT_MS
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    ),
  ]);
};

// ─── Sparkline ───────────────────────────────────────────────

export interface SparklinePoint {
  value: number;
  label: string;
}

/**
 * Gera dados de sparkline a partir de registros reais agrupados por período de tempo.
 * Nunca usa Math.random() — retorna [] quando não há dados suficientes.
 *
 * @param records  - Array de registros com dateField e opcionalmente valueField
 * @param dateField  - Nome do campo de data nos registros
 * @param valueField - Nome do campo numérico para soma; null para contagem
 * @param buckets  - Número de pontos do sparkline (padrão: 7)
 */
export function buildSparkline(
  records: DbRecord[],
  dateField: string,
  valueField: string | null,
  buckets: number = 7
): SparklinePoint[] {
  if (!records || records.length === 0) return [];

  const sorted = [...records]
    .filter((r) => r[dateField])
    .sort((a, b) => new Date(a[dateField] as string).getTime() - new Date(b[dateField] as string).getTime());

  if (sorted.length === 0) return [];

  const first = new Date(sorted[0][dateField] as string).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField] as string).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;

  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter((r) => {
      const t = new Date(r[dateField] as string).getTime();
      return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd;
    });

    const v =
      inBucket.length === 0
        ? 0
        : valueField
          ? inBucket.reduce((s, r) => s + Number(r[valueField] ?? 0), 0)
          : inBucket.length;

    const d =
      i === buckets - 1 && inBucket.length > 0
        ? new Date(inBucket[inBucket.length - 1][dateField] as string)
        : i === 0 && inBucket.length > 0
          ? new Date(inBucket[0][dateField] as string)
          : new Date(bStart + bucketMs / 2);

    return {
      value: Number(v.toFixed(2)),
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    };
  });
}

// ─── Formatação de valores ───────────────────────────────────

/** Formata número como BRL (R$ 1.234,56) */
export const fmtBRL = (val: number): string =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Aplica escopo de tenant/fazenda a uma query Supabase */
export const applyScope = (query: SupabaseQuery, tenantId: string, fazendaId?: string | null): SupabaseQuery => {
  if (fazendaId) return query.eq('fazenda_id', fazendaId);
  return query.eq('tenant_id', tenantId);
};
