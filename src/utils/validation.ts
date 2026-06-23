/**
 * Valida se uma string é um UUID válido (v4 ou similar).
 * Essencial para evitar erros "invalid input syntax for type uuid" no Supabase.
 */
export const isValidUUID = (uuid: string | null | undefined): boolean => {
  if (!uuid) {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Filtra parâmetros de consulta para garantir que apenas UUIDs válidos sejam enviados.
 * Retorna null se o ID for inválido.
 */
export const cleanUUID = (id: string | null | undefined): string | null => {
  if (isValidUUID(id)) {
    return id as string;
  }
  return null;
};

export const isValidCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/[^\d]+/g, '');
  if (cleanCPF.length !== 11 || !!cleanCPF.match(/(\d)\1{10}/)) {
    return false;
  }
  const cpfArray = cleanCPF.split('').map((el) => +el);
  const rest = (count: number) =>
    ((cpfArray.slice(0, count - 12).reduce((soma, el, index) => soma + el * (count - index), 0) *
      10) %
      11) %
    10;
  return rest(10) === cpfArray[9] && rest(11) === cpfArray[10];
};

export const isValidCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/[^\d]+/g, '');
  if (cleanCNPJ.length !== 14 || !!cleanCNPJ.match(/(\d)\1{13}/)) {
    return false;
  }
  let tamanho = cleanCNPJ.length - 2;
  let numeros = cleanCNPJ.substring(0, tamanho);
  const digitos = cleanCNPJ.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) {
    return false;
  }
  tamanho = tamanho + 1;
  numeros = cleanCNPJ.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) {
    return false;
  }
  return true;
};

export const isValidDocument = (doc: string): boolean => {
  const clean = doc.replace(/[^\d]+/g, '');
  if (!clean) {
    return true;
  } // Let required validation handle empty fields if necessary
  if (clean.length === 11) {
    return isValidCPF(clean);
  }
  if (clean.length === 14) {
    return isValidCNPJ(clean);
  }
  return false;
};

/**
 * Valida se uma string é um email válido.
 * Usa regex padrão para validação de email.
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Valida se uma string é um telefone brasileiro válido.
 * Aceita formatos: (XX) XXXXX-XXXX, (XX) XXXX-XXXX, ou apenas números (10 ou 11 dígitos).
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone) {
    return false;
  }
  const cleanPhone = phone.replace(/[^\d]+/g, '');
  // Telefone fixo: 10 dígitos (XX) XXXX-XXXX
  // Celular: 11 dígitos (XX) XXXXX-XXXX
  return cleanPhone.length === 10 || cleanPhone.length === 11;
};
