/**
 * Utilitários de domínio da Pecuária (Tauze ERP)
 */

/**
 * Calcula a idade em meses a partir da data de nascimento.
 * @param dataNascimento - string no formato YYYY-MM-DD
 * @returns Idade em meses (number)
 */
export function calculateIdadeMeses(dataNascimento: string | null | undefined): number {
  if (!dataNascimento) return 0;
  const birthDate = new Date(dataNascimento);
  if (isNaN(birthDate.getTime())) return 0;
  
  return Math.floor(
    (new Date().getTime() - birthDate.getTime()) / (1000 * 3600 * 24 * 30.44)
  );
}

/**
 * Calcula a categoria zootécnica do animal com base no sexo, peso atual e idade.
 * Os limites podem ser sobrescritos pelas configurações da fazenda.
 * @param sexo - 'M' ou 'F'
 * @param pesoAtual - peso do animal em Kg
 * @param idadeMeses - idade do animal em meses
 * @param config - Configurações zootécnicas da fazenda (opcional)
 * @returns Categoria ('Boi Gordo', 'Bezerro', 'Garrote', 'Vaca', 'Bezerra', 'Novilha', 'N/I')
 */
export function calculateAnimalCategory(
  sexo: string,
  pesoAtual: number,
  idadeMeses: number,
  config?: { pesoBoiGordo?: number; idadeBoiGordo?: number; pesoVaca?: number; idadeVaca?: number }
): string {
  const pesoBoiGordo = config?.pesoBoiGordo || 500;
  const idadeBoiGordo = config?.idadeBoiGordo || 36;
  const pesoVaca = config?.pesoVaca || 450;
  const idadeVaca = config?.idadeVaca || 36;

  if (sexo === 'M') {
    if (pesoAtual > pesoBoiGordo || idadeMeses > idadeBoiGordo) {
      return 'Boi Gordo';
    } else if (idadeMeses <= 12) {
      return 'Bezerro';
    } else {
      return 'Garrote';
    }
  } else if (sexo === 'F') {
    if (pesoAtual > pesoVaca || idadeMeses > idadeVaca) {
      return 'Vaca';
    } else if (idadeMeses <= 12) {
      return 'Bezerra';
    } else {
      return 'Novilha';
    }
  }
  return 'N/I';
}

/**
 * Calcula o Ganho Médio Diário (GMD) em kg/dia.
 * @param pesoInicial - peso base (kg)
 * @param pesoAtual - peso mais recente (kg)
 * @param dias - intervalo em dias entre as pesagens
 */
export function calculateGMD(pesoInicial: number, pesoAtual: number, dias: number): number {
  if (dias <= 0 || pesoAtual <= pesoInicial) return 0;
  return Number(((pesoAtual - pesoInicial) / dias).toFixed(3));
}

/**
 * Projeta a data ou dias restantes para atingir o peso de abate.
 * @param pesoAtual - peso atual (kg)
 * @param pesoMeta - peso de abate desejado (kg)
 * @param gmdMedio - GMD histórico ou esperado (kg/dia)
 */
export function calculateDiasParaAbate(pesoAtual: number, pesoMeta: number, gmdMedio: number): number {
  if (pesoAtual >= pesoMeta) return 0;
  if (gmdMedio <= 0) return 999; // Indefinido se não há ganho
  return Math.ceil((pesoMeta - pesoAtual) / gmdMedio);
}

/**
 * Retorna o cálculo do Custo por Arroba (@) Produzida
 * @param custoTotal - soma dos custos (nutrição, sanidade, reprodução)
 * @param pesoGanhoKg - total de kg ganhos no período
 * @param rendimentoCarcaca - Rendimento percentual da carcaça (ex: 50 para 50%). Padrão é 50.
 */
export function calculateCustoArrobaProduzida(custoTotal: number, pesoGanhoKg: number, rendimentoCarcaca: number = 50): number {
  if (pesoGanhoKg <= 0) return 0;
  
  // Exemplo: se rendimento = 50%, multiplicador = 0.5. Arroba padrão = 15kg carcaça.
  // 1 Arroba (15kg) / 0.5 = 30kg de peso vivo para gerar 1 Arroba.
  const kgVivoPorArroba = 15 / (rendimentoCarcaca / 100); 
  const arrobasPuxadas = pesoGanhoKg / kgVivoPorArroba;
  
  return Number((custoTotal / arrobasPuxadas).toFixed(2));
}
