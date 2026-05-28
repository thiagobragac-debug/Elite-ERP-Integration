export const fetchCNPJData = async (cnpj: string) => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) {
    throw new Error('CNPJ deve ter 14 dígitos');
  }

  const tryBrasilAPI = async () => {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
    if (!response.ok) throw new Error('BrasilAPI failed');
    const data = await response.json();
    return {
      razao_social: data.razao_social || '',
      nome_fantasia: data.nome_fantasia || data.razao_social || '',
      cep: data.cep?.replace(/\D/g, '') || '',
      tipo_logradouro: data.descricao_tipo_de_logradouro || '',
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
      email: data.email || '',
      telefone: data.ddd_telefone_1 || data.ddd_telefone_2 || '',
      natureza_juridica: data.natureza_juridica || ''
    };
  };

  const tryReceitaWS = async () => {
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCNPJ}`);
    if (!response.ok) throw new Error('ReceitaWS failed');
    const data = await response.json();
    if (data.status === 'ERROR') throw new Error(data.message || 'ReceitaWS error');
    
    return {
      razao_social: data.nome || '',
      nome_fantasia: data.fantasia || data.nome || '',
      cep: data.cep?.replace(/\D/g, '') || '',
      tipo_logradouro: '', 
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
      email: data.email || '',
      telefone: data.telefone?.split('/')[0]?.trim() || '',
      natureza_juridica: data.natureza_juridica || ''
    };
  };

  try {
    return await tryBrasilAPI();
  } catch (err1) {
    console.warn('[CNPJ] BrasilAPI falhou, tentando ReceitaWS...', err1);
    try {
      return await tryReceitaWS();
    } catch (err2) {
      console.error('[CNPJ] Todas as APIs falharam:', { err1, err2 });
      throw new Error('CNPJ não encontrado ou indisponível no momento.');
    }
  }
};
