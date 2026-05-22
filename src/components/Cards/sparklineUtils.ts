/**
 * Normaliza um array de sparkline:
 * 1. Garante que todos os pontos tenham label (string vazia se ausente)
 * 2. Garante que values sejam números finitos
 * 3. Interpola para no mínimo 15 pontos se o array for muito curto
 */
export function normalizeSparkline(
  input?: { value: number; label?: string }[]
): { value: number; label: string }[] {
  if (!input || input.length === 0) return [];

  const withLabels = input.map(s => ({
    value: typeof s.value === 'number' && isFinite(s.value) ? s.value : 0,
    label: s.label ?? ''
  }));

  if (withLabels.length >= 5) return withLabels;

  const targetCount = 15;

  if (withLabels.length === 1) {
    return Array(targetCount).fill(null).map(() => ({ ...withLabels[0] }));
  }

  const result: { value: number; label: string }[] = [];
  for (let i = 0; i < targetCount; i++) {
    const t = i / (targetCount - 1);
    const srcIdx = t * (withLabels.length - 1);
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, withLabels.length - 1);
    const frac = srcIdx - lo;
    const interpolatedValue = withLabels[lo].value + (withLabels[hi].value - withLabels[lo].value) * frac;
    result.push({
      value: interpolatedValue,
      label: withLabels[hi].label || withLabels[lo].label || ''
    });
  }
  return result;
}
