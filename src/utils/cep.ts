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
    
    return {
      cep: data.cep,
      state: data.state,
      city: data.city,
      neighborhood: data.neighborhood,
      street: data.street,
      location: data.location // might contain coordinates
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
};
