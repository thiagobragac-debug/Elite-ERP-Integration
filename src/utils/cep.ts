export const fetchCEPData = async (cep: string) => {
  const cleanCEP = cep.replace(/\D/g, '');

  if (cleanCEP.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos');
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCEP}`);

    if (!response.ok) {
      throw new Error('CEP não encontrado');
    }

    const data = await response.json();

    const rawStreet = data.street || '';
    const firstSpaceIndex = rawStreet.indexOf(' ');
    let tipoLogradouro = '';
    let logradouro = rawStreet;

    if (firstSpaceIndex > 0) {
      tipoLogradouro = rawStreet.substring(0, firstSpaceIndex);
      logradouro = rawStreet.substring(firstSpaceIndex + 1);
    }

    return {
      cep: data.cep,
      state: (data.state || '').toUpperCase(),
      city: (data.city || '').toUpperCase(),
      neighborhood: (data.neighborhood || '').toUpperCase(),
      street: logradouro.toUpperCase(),
      tipo_logradouro: tipoLogradouro.toUpperCase(),
      location: data.location, // might contain coordinates
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
};
