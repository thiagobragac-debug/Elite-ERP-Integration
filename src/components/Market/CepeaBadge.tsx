import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import './CepeaBadge.css';

// A tabela do widget CEPEA tem colunas: Data | Produto | Valor
const CEPEA_BADGE_HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; }
  body { background: transparent; overflow: hidden; }
</style>
</head>
<body>
<script type="text/javascript"
  src="https://cepea.org.br/br/widgetproduto.js.php?fonte=arial&tamanho=10&largura=400px&corfundo=transparent&cortexto=333333&corlinha=cccccc&id_indicador[]=2">
</script>
<script>
function tryExtract() {
  var rows = document.querySelectorAll('tr');
  // Pula a linha de cabeçalho (i=0 e i=1 dependendo da tabela) e procura os dados
  for (var i = 0; i < rows.length; i++) {
    var cells = rows[i].querySelectorAll('td');
    if (cells.length >= 3) {
      var data = cells[0] ? cells[0].innerText.trim() : '';
      var prod = cells[1] ? cells[1].innerText.trim() : '';
      var val  = cells[2] ? cells[2].innerText.trim() : '';
      
      // Limpa o valor para pegar só o número, ex: "R$ 345,10" -> "345,10"
      val = val.replace(/R\\$\\s*/i, '').trim();

      if (val && /\\d/.test(val) && val.indexOf(',') > -1) {
        window.parent.postMessage({
          type: 'cepea_badge',
          valor: val,
          data: data
        }, '*');
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

interface CepeaData {
  valor: string;
  data: string;
}

export const CepeaBadge: React.FC = () => {
  const [data, setData] = useState<CepeaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 8000);

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'cepea_badge') {
        setData({
          valor: String(e.data.valor || ''),
          data:  String(e.data.data  || ''),
        });
        setLoading(false);
        clearTimeout(timeout);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="cepea-badge" title="Última cotação Boi Gordo · CEPEA/ESALQ">
      {/* iframe oculto — extrai valor e data via postMessage */}
      <iframe
        srcDoc={CEPEA_BADGE_HTML}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', border: 'none' }}
        title="cepea-extractor"
        sandbox="allow-scripts allow-same-origin"
      />

      <div className="cepea-badge-icon">@</div>

      <div className="cepea-badge-content">
        <span className="cepea-badge-label">BOI GORDO · CEPEA</span>

        {loading ? (
          <span className="cepea-badge-value loading">
            <span className="cepea-dot" />
            <span className="cepea-dot" />
            <span className="cepea-dot" />
          </span>
        ) : data ? (
          <>
            <span className="cepea-badge-value">
              R$ {data.valor}
            </span>
            {data.data && (
              <span className="cepea-badge-date">
                <Calendar size={9} />
                {data.data}
              </span>
            )}
          </>
        ) : (
          <a
            href="https://www.cepea.esalq.usp.br/br/indicador/boi-gordo.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="cepea-badge-link"
          >
            Ver CEPEA ↗
          </a>
        )}
      </div>
    </div>
  );
};
