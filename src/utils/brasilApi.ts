export interface BrasilApiCnpjResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  descricao_situacao_cadastral: string;
  data_situacao_cadastral: string;
  motivo_situacao_cadastral: string;
  nome_cidade_no_exterior: string;
  pais: string;
  codigo_natureza_juridica: number;
  data_inicio_atividade: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  descricao_tipo_de_logradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  municipio: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  ddd_fax: string;
}

/**
 * Fetches company details using the BrasilAPI CNPJ endpoint.
 * @param cnpj The CNPJ string (with or without mask)
 * @returns A promise that resolves to the company data or throws an error
 */
export async function fetchCNPJ(cnpj: string): Promise<BrasilApiCnpjResponse> {
  const cleanCnpj = cnpj.replace(/[^\d]+/g, '');
  
  if (cleanCnpj.length !== 14) {
    throw new Error('CNPJ inválido para busca.');
  }

  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('CNPJ não encontrado na Receita Federal.');
    }
    throw new Error('Erro ao buscar dados do CNPJ.');
  }

  const data: BrasilApiCnpjResponse = await response.json();
  return data;
}
