/**
 * Validates a Brazilian CPF using a mathematical algorithm.
 */
export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/[^\d]+/g, '');
  if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) return false;

  const calcDigit = (slice: string, maxMultiplier: number) => {
    let sum = 0;
    for (let i = 0; i < slice.length; i++) {
      sum += parseInt(slice[i]) * (maxMultiplier - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 || remainder === 11 ? 0 : remainder;
  };

  const digit1 = calcDigit(cleanCPF.substring(0, 9), 10);
  const digit2 = calcDigit(cleanCPF.substring(0, 9) + digit1, 11);

  return digit1 === parseInt(cleanCPF[9]) && digit2 === parseInt(cleanCPF[10]);
}

/**
 * Validates a Brazilian CNPJ using a mathematical algorithm.
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/[^\d]+/g, '');
  if (cleanCNPJ.length !== 14 || !!cleanCNPJ.match(/(\d)\1{13}/)) return false;

  const calcDigit = (slice: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < slice.length; i++) {
      sum += parseInt(slice[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const digit1 = calcDigit(cleanCNPJ.substring(0, 12), weights1);

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const digit2 = calcDigit(cleanCNPJ.substring(0, 12) + digit1, weights2);

  return digit1 === parseInt(cleanCNPJ[12]) && digit2 === parseInt(cleanCNPJ[13]);
}

/**
 * Formats a string to CPF or CNPJ based on its length.
 */
export function formatCpfCnpj(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    return clean
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  }
}
