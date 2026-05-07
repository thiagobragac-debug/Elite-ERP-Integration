export const fetchCNPJData = async (cnpj: string) => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) {
    throw new Error('CNPJ deve ter 14 dígitos');
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
    
    if (!response.ok) {
      throw new Error('CNPJ não encontrado ou erro na Receita');
    }

    const data = await response.json();
    
    return {
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia || data.razao_social,
      cep: data.cep,
      tipo_logradouro: data.descricao_tipo_de_logradouro || '',
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento || '',
      bairro: data.bairro,
      municipio: data.municipio,
      uf: data.uf,
      email: data.email,
      telefone: data.ddd_telefone_1 || data.ddd_telefone_2,
      natureza_juridica: data.natureza_juridica
    };
  } catch (error) {
    console.error('Erro ao buscar CNPJ:', error);
    throw error;
  }
};
