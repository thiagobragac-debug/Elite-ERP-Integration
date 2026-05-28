import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface CepeaLiveData {
  valor: string;       // ex: "348,30"
  valorNum: number;    // ex: 348.30
  data: string;        // ex: "27/05/2026" (vinda da CEPEA)
  isoDate: string;     // ex: "2026-05-27" (para upsert no banco)
  capturedAt: Date;
}

interface CepeaContextType {
  live: CepeaLiveData | null;
  loading: boolean;
}

const CepeaContext = createContext<CepeaContextType>({ live: null, loading: true });

export const useCepea = () => useContext(CepeaContext);

/**
 * Converte "27/05/2026" → "2026-05-27"
 * Aceita também formatos como "27/05/26" ou "27/05/2026"
 */
function parseIsoDate(cepeaDate: string): string {
  // Formato esperado: DD/MM/AAAA ou DD/MM/AA
  const parts = cepeaDate.split('/');
  if (parts.length !== 3) return new Date().toISOString().split('T')[0];
  const [day, month, year] = parts;
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Converte "348,30" → 348.30
 */
function parseValor(val: string): number {
  return parseFloat(val.replace('.', '').replace(',', '.'));
}

const INDICATOR = 'boi_gordo_cepea';

// iFrame HTML que carrega o widget CEPEA e extrai via postMessage
const CEPEA_BADGE_HTML = `<!DOCTYPE html>
<html>
<head><style>* { margin: 0; padding: 0; } body { background: transparent; overflow: hidden; }</style></head>
<body>
<script type="text/javascript"
  src="https://cepea.org.br/br/widgetproduto.js.php?fonte=arial&tamanho=10&largura=400px&corfundo=transparent&cortexto=333333&corlinha=cccccc&id_indicador[]=2">
</script>
<script>
function tryExtract() {
  var rows = document.querySelectorAll('tr');
  for (var i = 0; i < rows.length; i++) {
    var cells = rows[i].querySelectorAll('td');
    if (cells.length >= 3) {
      var data = cells[0] ? cells[0].innerText.trim() : '';
      var val  = cells[2] ? cells[2].innerText.trim() : '';
      val = val.replace(/R\\$\\s*/i, '').trim();
      if (val && /\\d/.test(val) && val.indexOf(',') > -1) {
        window.parent.postMessage({ type: 'cepea_badge', valor: val, data: data }, '*');
        return true;
      }
    }
  }
  return false;
}
var attempts = 0;
var timer = setInterval(function() {
  attempts++;
  if (tryExtract() || attempts >= 15) clearInterval(timer);
}, 500);
</script>
</body>
</html>`;

export const CepeaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [live, setLive] = useState<CepeaLiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const savedRef = useRef<Set<string>>(new Set()); // evita upsert duplo na mesma sessão

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 9000);

    const handleMessage = async (e: MessageEvent) => {
      if (e.data?.type !== 'cepea_badge') return;

      const valor = String(e.data.valor || '');
      const data  = String(e.data.data  || '');
      const valorNum = parseValor(valor);
      const isoDate  = parseIsoDate(data);

      if (!valor || isNaN(valorNum) || valorNum <= 0) return;

      const liveData: CepeaLiveData = {
        valor,
        valorNum,
        data,
        isoDate,
        capturedAt: new Date(),
      };

      setLive(liveData);
      setLoading(false);
      clearTimeout(timeout);

      // ── Persistir no banco (upsert) ──────────────────────────────────────
      const key = `${INDICATOR}-${isoDate}`;
      if (!savedRef.current.has(key)) {
        savedRef.current.add(key);
        try {
          const { error } = await supabase
            .from('market_quotes')
            .upsert(
              { indicator: INDICATOR, date: isoDate, value: valorNum },
              { onConflict: 'indicator,date' }   // constraint única no banco
            );

          if (error) {
            console.warn('[CepeaProvider] Upsert falhou:', error.message);
          } else {
            console.info(`[CepeaProvider] ✅ Cotação ${isoDate} R$ ${valorNum} salva no histórico.`);
          }
        } catch (err) {
          console.warn('[CepeaProvider] Erro ao salvar cotação:', err);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <CepeaContext.Provider value={{ live, loading }}>
      {/* iFrame oculto — extrai cotação do widget CEPEA */}
      <iframe
        srcDoc={CEPEA_BADGE_HTML}
        style={{ position: 'fixed', width: 1, height: 1, opacity: 0, pointerEvents: 'none', border: 'none', top: 0, left: 0, zIndex: -1 }}
        title="cepea-extractor-global"
        sandbox="allow-scripts allow-same-origin"
      />
      {children}
    </CepeaContext.Provider>
  );
};
