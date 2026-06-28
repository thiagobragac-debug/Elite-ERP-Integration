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
