import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface CepeaLiveData {
  valor: string;       // ex: "348,30"
  valorNum: number;    // ex: 348.30
  data: string;        // ex: "27/05/2026" (vinda da CEPEA)
  isoDate: string;     // ex: "2026-05-27"
  capturedAt: Date;
}

interface CepeaContextType {
  live: CepeaLiveData | null;
  loading: boolean;
}

const CepeaContext = createContext<CepeaContextType>({ live: null, loading: true });

export const useCepea = () => useContext(CepeaContext);

const INDICATOR = 'boi_gordo_cepea';

export const CepeaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [live, setLive] = useState<CepeaLiveData | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch initial latest quote
  const fetchLatestQuote = async () => {
    try {
      const { data, error } = await supabase
        .from('market_quotes')
        .select('*')
        .eq('indicator', INDICATOR)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setLive({
          valor: data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          valorNum: data.value,
          data: data.date.split('T')[0].split('-').reverse().join('/'),
          isoDate: data.date,
          capturedAt: new Date(data.created_at || new Date()),
        });
      }
    } catch (err) {
      console.warn('[CepeaProvider] Erro ao buscar última cotação:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestQuote();

    // 2. Subscribe to realtime updates for market_quotes
    const channel = supabase.channel('market-quotes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'market_quotes', filter: `indicator=eq.${INDICATOR}` },
        (payload) => {
          if (payload.new && 'value' in payload.new) {
            const row = payload.new as any;
            setLive({
              valor: row.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
              valorNum: row.value,
              data: row.date.split('T')[0].split('-').reverse().join('/'),
              isoDate: row.date,
              capturedAt: new Date(row.created_at || new Date()),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <CepeaContext.Provider value={{ live, loading }}>
      {children}
    </CepeaContext.Provider>
  );
};
