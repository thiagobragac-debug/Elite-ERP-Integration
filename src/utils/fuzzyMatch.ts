/**
 * fuzzyMatch.ts
 * Algoritmo Jaro-Winkler + normalização de texto para mapeamento inteligente
 * de itens de XML fiscal contra o catálogo interno de insumos.
 */

const STOPWORDS = new Set([
  'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'para', 'por', 'com', 'sem', 'um', 'uma', 'e', 'ou', 'a', 'o',
  'ao', 'as', 'os', 'se', 'que', 'kg', 'g', 'ml', 'l', 'un', 'cx',
  'sc', 'lt', 'bd', 'pc', 'pct', 'cx', 'gl', 'cb', 'fdo'
]);

/**
 * Normaliza string: remove acentos, lowercase, remove stopwords e pontuação
 */
export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s]/g, ' ')   // remove pontuação
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w))
    .join(' ')
    .trim();
}

/**
 * Calcula similaridade Jaro entre duas strings (0–1)
 */
function jaro(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matchDist = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    matches / len1 +
    matches / len2 +
    (matches - transpositions / 2) / matches
  ) / 3;
}

/**
 * Jaro-Winkler: boost para prefixos comuns (0–1)
 */
function jaroWinkler(s1: string, s2: string, p = 0.1): number {
  const j = jaro(s1, s2);
  let prefixLen = 0;
  const maxPre = Math.min(4, Math.min(s1.length, s2.length));
  while (prefixLen < maxPre && s1[prefixLen] === s2[prefixLen]) prefixLen++;
  return j + prefixLen * p * (1 - j);
}

/**
 * Dice Coefficient: baseado em bigramas — bom para texto com muitas palavras (0–1)
 */
function diceCoefficient(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const getBigrams = (str: string) => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bg = str.substring(i, i + 2);
      bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);
  let intersection = 0;

  bigrams1.forEach((count, bg) => {
    const count2 = bigrams2.get(bg) || 0;
    intersection += Math.min(count, count2);
  });

  return (2 * intersection) / (s1.length - 1 + s2.length - 1);
}

/**
 * Score combinado: média ponderada Jaro-Winkler + Dice (0–100)
 * Jaro-Winkler é melhor para palavras curtas/siglas, Dice para frases longas
 */
function combinedScore(norm1: string, norm2: string): number {
  const jw = jaroWinkler(norm1, norm2);
  const dc = diceCoefficient(norm1, norm2);
  // Peso: 40% Jaro-Winkler + 60% Dice (frases longas são mais comuns em XML)
  return Math.round((jw * 0.4 + dc * 0.6) * 100);
}

export interface FuzzyMatchResult {
  product: {
    id: string;
    nome: string;
    unidade_medida?: string;
    preco_custo?: number;
  };
  score: number;
  normalizedQuery: string;
  normalizedTarget: string;
}

/**
 * Encontra os melhores matches de um nome XML contra o catálogo de produtos
 * @param xmlName - nome do produto no XML (xProd)
 * @param products - lista de produtos do catálogo interno
 * @param minScore - score mínimo para incluir no resultado (0–100)
 * @returns lista ordenada por score (maior primeiro)
 */
export function findBestMatches(
  xmlName: string,
  products: { id: string; nome: string; unidade_medida?: string; preco_custo?: number }[],
  minScore = 30
): FuzzyMatchResult[] {
  const normQuery = normalizeText(xmlName);
  if (!normQuery) return [];

  return products
    .map(product => {
      const normTarget = normalizeText(product.nome);
      const score = combinedScore(normQuery, normTarget);
      return { product, score, normalizedQuery: normQuery, normalizedTarget: normTarget };
    })
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

/**
 * Status de match baseado no score
 */
export type MatchStatus = 'confirmed' | 'suggested' | 'weak' | 'unmatched' | 'manual';

export function getMatchStatus(score: number | undefined, hasDePara: boolean): MatchStatus {
  if (hasDePara) return 'confirmed';
  if (score === undefined) return 'unmatched';
  if (score >= 70) return 'suggested';
  if (score >= 45) return 'weak';
  return 'unmatched';
}

export const MATCH_STATUS_CONFIG: Record<MatchStatus, { label: string; color: string; bg: string; icon: string }> = {
  confirmed:  { label: 'Vinculado',    color: '#059669', bg: 'rgba(5,150,105,0.10)',  icon: '✓' },
  suggested:  { label: 'Sugerido',     color: '#d97706', bg: 'rgba(217,119,6,0.10)',  icon: '⚠' },
  weak:       { label: 'Fraco',        color: '#ea580c', bg: 'rgba(234,88,12,0.10)',  icon: '~' },
  unmatched:  { label: 'Sem vínculo',  color: '#dc2626', bg: 'rgba(220,38,38,0.10)',  icon: '✗' },
  manual:     { label: 'Manual',       color: '#6366f1', bg: 'rgba(99,102,241,0.10)', icon: '✎' },
};
