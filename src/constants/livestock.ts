/**
 * livestock.ts
 * Constantes centralizadas do módulo de pecuária.
 * Todos os componentes que precisam de listas de status, forrageiras,
 * tipos de solo etc. devem importar DAQUI — nunca redefinir localmente.
 */

// ---------------------------------------------------------------------------
// Status do Pasto
// ---------------------------------------------------------------------------

export const PASTURE_STATUS = {
  GRAZING: 'grazing',
  RESTING: 'resting',
  DEGRADED: 'degraded',
  RENOVATION: 'renovation',
} as const;

export type PastureStatusKey = (typeof PASTURE_STATUS)[keyof typeof PASTURE_STATUS];

export const PASTURE_STATUS_LABEL: Record<PastureStatusKey, string> = {
  grazing: 'Em Pastejo',
  resting: 'Em Descanso',
  degraded: 'Degradado',
  renovation: 'Em Reforma',
};

// Aliases usados historicamente no banco (normalizar gradualmente)
export const PASTURE_STATUS_ALIASES: Record<string, PastureStatusKey> = {
  descanso: 'resting',
  degradado: 'degraded',
  reforma: 'renovation',
  em_reforma: 'renovation',
  free: 'grazing',
  occupied: 'grazing',
};

/** Resolve qualquer variação de string de status para o enum canônico */
export function normalizePastureStatus(raw: string): PastureStatusKey {
  const lower = (raw ?? '').toLowerCase();
  return (
    (PASTURE_STATUS_ALIASES[lower] as PastureStatusKey) ??
    (Object.values(PASTURE_STATUS).includes(lower as PastureStatusKey)
      ? (lower as PastureStatusKey)
      : 'grazing')
  );
}

// ---------------------------------------------------------------------------
// Forrageiras / Variedades de Capim
// Mantida em sync com PastureFilterModal chips
// ---------------------------------------------------------------------------

export const FORRAGEIRAS: { value: string; label: string; grupo: string }[] = [
  // Brachiaria
  { value: 'Brachiaria brizantha', label: 'Brachiaria brizantha (Marandu/Piatã)', grupo: 'Brachiaria' },
  { value: 'Brachiaria decumbens', label: 'Brachiaria decumbens', grupo: 'Brachiaria' },
  { value: 'Brachiaria ruziziensis', label: 'Brachiaria ruziziensis', grupo: 'Brachiaria' },
  // Panicum
  { value: 'Mombaça', label: 'Mombaça (Panicum maximum)', grupo: 'Panicum' },
  { value: 'Tanzânia', label: 'Tanzânia (Panicum maximum)', grupo: 'Panicum' },
  { value: 'Zuri', label: 'Zuri (Panicum maximum)', grupo: 'Panicum' },
  { value: 'Quênia', label: 'Quênia (Megathyrsus maximus)', grupo: 'Panicum' },
  // Cynodon
  { value: 'Tifton 85', label: 'Tifton 85 (Cynodon sp.)', grupo: 'Cynodon' },
  { value: 'Estrela', label: 'Estrela (Cynodon nlemfuensis)', grupo: 'Cynodon' },
  { value: 'Bermuda', label: 'Bermuda (Cynodon dactylon)', grupo: 'Cynodon' },
  // Andropogon
  { value: 'Andropogon gayanus', label: 'Andropogon (Colonião)', grupo: 'Andropogon' },
  // Outros
  { value: 'Napier / Elefante', label: 'Napier / Elefante (Pennisetum purpureum)', grupo: 'Outros' },
  { value: 'Sorgo Forrageiro', label: 'Sorgo Forrageiro', grupo: 'Outros' },
  { value: 'Cana-de-açúcar', label: 'Cana-de-açúcar (corte)', grupo: 'Outros' },
  { value: 'Milheto', label: 'Milheto (Pennisetum americanum)', grupo: 'Outros' },
];

/** Opções simples para SearchableSelect */
export const FORRAGEIRAS_OPTIONS = FORRAGEIRAS.map((f) => ({
  value: f.value,
  label: f.label,
}));

/** Lista de nomes apenas — usada nos chips do FilterModal */
export const FORRAGEIRAS_NOMES = FORRAGEIRAS.map((f) => f.value);

// ---------------------------------------------------------------------------
// Sistemas de Pastejo
// ---------------------------------------------------------------------------

export const SISTEMAS_PASTEJO = [
  { value: 'Contínuo', label: 'Contínuo' },
  { value: 'Rotacionado', label: 'Rotacionado' },
  { value: 'Diferido', label: 'Diferido' },
  { value: 'Semiextensivo', label: 'Semiextensivo' },
];

// ---------------------------------------------------------------------------
// Topografia
// ---------------------------------------------------------------------------

export const TOPOGRAFIA_OPTIONS = [
  { value: 'Plano', label: 'Plano (< 3% de declive)' },
  { value: 'Levemente Ondulado', label: 'Levemente Ondulado (3–8%)' },
  { value: 'Ondulado', label: 'Ondulado (8–20%)' },
  { value: 'Fortemente Ondulado', label: 'Fortemente Ondulado (20–45%)' },
  { value: 'Montanhoso', label: 'Montanhoso (> 45%)' },
];

// ---------------------------------------------------------------------------
// Tipo de Solo
// ---------------------------------------------------------------------------

export const TIPO_SOLO_OPTIONS = [
  { value: 'Latossolo', label: 'Latossolo (Oxissol)' },
  { value: 'Argiloso', label: 'Argiloso' },
  { value: 'Arenoso', label: 'Arenoso' },
  { value: 'Misto', label: 'Misto (Argilo-Arenoso)' },
  { value: 'Neossolo', label: 'Neossolo Flúvico' },
];

// ---------------------------------------------------------------------------
// Recursos Hídricos
// ---------------------------------------------------------------------------

export const AGUA_OPTIONS = [
  { value: 'Natural (Rios/Nascentes)', label: 'Natural — Rios / Nascentes' },
  { value: 'Bebedouro Australiano', label: 'Bebedouro Australiano' },
  { value: 'Represa', label: 'Represa / Açude' },
  { value: 'Poço Artesiano', label: 'Poço Artesiano' },
  { value: 'Sem Acesso', label: 'Sem Acesso a Água' },
];

// ---------------------------------------------------------------------------
// Estado da Cerca
// ---------------------------------------------------------------------------

export const ESTADO_CERCA_OPTIONS = [
  { value: 'Bom', label: 'Bom — Sem reparos' },
  { value: 'Regular', label: 'Regular — Manutenção preventiva' },
  { value: 'Necessita Reparo', label: 'Necessita Reparo' },
  { value: 'Ruim', label: 'Ruim — Risco de fuga' },
];

// ---------------------------------------------------------------------------
// Sombreamento
// ---------------------------------------------------------------------------

export const SOMBREAMENTO_OPTIONS = [
  { value: 'Natural (Árvores)', label: 'Natural — Árvores' },
  { value: 'Artificial (Coberturas)', label: 'Artificial — Coberturas' },
  { value: 'Misto', label: 'Misto (Natural + Artificial)' },
  { value: 'Inexistente', label: 'Inexistente' },
];

// ---------------------------------------------------------------------------
// Plantas Daninhas / Invasoras
// ---------------------------------------------------------------------------

export const PLANTAS_DANINHAS_OPTIONS = [
  { value: 'Livre', label: 'Livre de invasoras' },
  { value: 'Baixa Infestação', label: 'Baixa Infestação (< 10%)' },
  { value: 'Média Infestação', label: 'Média Infestação (10–30%)' },
  { value: 'Alta Infestação', label: 'Alta Infestação (> 30%)' },
];

// ---------------------------------------------------------------------------
// Período de Carência Química (dias após fertilização)
// ---------------------------------------------------------------------------

export const CARENCIA_QUIMICA_DIAS = 30; // dias mínimos de carência
export const CARENCIA_ATENCAO_DIAS = 90; // dias para alerta de re-adubação

// ---------------------------------------------------------------------------
// Status do Animal (normalizados — evitar strings triplicadas no código)
// ---------------------------------------------------------------------------

/** Array para .in('status', ANIMAL_STATUS_ATIVO) — cobre variações históricas */
export const ANIMAL_STATUS_ATIVO = ['ATIVO', 'Ativo', 'ativo'] as const;

// ---------------------------------------------------------------------------
// Motivos de Remanejamento de Pasto
// Fonte única de verdade — compartilhada entre PastureRelocateForm e AssignToPastoForm
// ---------------------------------------------------------------------------

export const MOTIVOS_REMANEJAMENTO = [
  'Rotação de Pastejo',
  'Vazio Sanitário (Descanso)',
  'Separação por Categoria',
  'Separação por Sexo',
  'Superlotação',
  'Reagrupamento de Lote',
  'Transferência entre Fazendas',
  'Outro',
] as const;

export type MotivoRemanejamento = (typeof MOTIVOS_REMANEJAMENTO)[number];
