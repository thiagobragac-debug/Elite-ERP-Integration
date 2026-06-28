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
 * @param sexo - 'M' ou 'F'
 * @param pesoAtual - peso do animal em Kg
 * @param idadeMeses - idade do animal em meses
 * @returns Categoria ('Boi Gordo', 'Bezerro', 'Garrote', 'Vaca', 'Bezerra', 'Novilha', 'N/I')
 */
export function calculateAnimalCategory(sexo: string, pesoAtual: number, idadeMeses: number): string {
  if (sexo === 'M') {
    if (pesoAtual > 500 || idadeMeses > 36) {
      return 'Boi Gordo';
    } else if (idadeMeses <= 12) {
      return 'Bezerro';
    } else {
      return 'Garrote';
    }
  } else if (sexo === 'F') {
    if (pesoAtual > 450 || idadeMeses > 36) {
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
 */
export function calculateCustoArrobaProduzida(custoTotal: number, pesoGanhoKg: number): number {
  if (pesoGanhoKg <= 0) return 0;
  const arrobasPuxadas = pesoGanhoKg / 30; // Rendimento de carcaça aproximado (50% de 30kg = 15kg/arroba) -> Ganho em carcaça. Uma arroba = 15kg de carcaça ou 30kg de peso vivo.
  return Number((custoTotal / arrobasPuxadas).toFixed(2));
}
