export const geocodeAddress = async (
  addressStr: string
): Promise<{ latitude: number | null; longitude: number | null }> => {
  if (!addressStr || addressStr.trim() === '') {
    return { latitude: null, longitude: null };
  }

  try {
    const query = encodeURIComponent(addressStr);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'pt-BR,pt;q=0.9',
        // O Nominatim exige um User-Agent descritivo
        'User-Agent': 'Elite-ERP-Integration/1.0 (admin@eliteerp.com)',
      },
    });

    if (!response.ok) {
      console.warn(`[Geocoding] Falha na API: ${response.statusText}`);
      return { latitude: null, longitude: null };
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }

    return { latitude: null, longitude: null };
  } catch (err) {
    console.error('[Geocoding] Erro ao buscar geolocalização:', err);
    return { latitude: null, longitude: null };
  }
};
