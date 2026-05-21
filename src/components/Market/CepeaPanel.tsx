import React, { useRef, useState } from 'react';
import { TrendingUp, RefreshCw, ExternalLink, BarChart2 } from 'lucide-react';
import { MarketHistoryChart } from './MarketHistoryChart';
import './CepeaPanel.css';

// Widget CEPEA com estilos inline adaptados ao tema escuro/claro do Tauze
// Usamos iframe srcdoc para que o document.write() do widget funcione corretamente
const buildIframeHtml = (isDark: boolean) => {
  const bg        = isDark ? '#1e293b' : '#f8fafc';
  const headerBg  = isDark ? '#0f172a' : '#f1f5f9';
  const text      = isDark ? '#e2e8f0' : '#1e293b';
  const headerTxt = isDark ? '#94a3b8' : '#475569';
  const border    = isDark ? '#334155' : '#e2e8f0';
  const rowHover  = isDark ? '#273449' : '#f0f4f8';
  const brand     = '#6366f1';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: ${bg};
    font-family: 'Arial', sans-serif;
    overflow: hidden;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    background: transparent !important;
  }
  td, th {
    padding: 9px 14px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    color: ${text} !important;
    border-bottom: 1px solid ${border} !important;
    background: transparent !important;
    font-family: 'Arial', sans-serif !important;
    white-space: nowrap;
  }
  /* Linha de cabeçalho */
  tr:first-child td, tr:first-child th {
    background: ${headerBg} !important;
    color: ${headerTxt} !important;
    font-size: 10px !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
    border-bottom: 2px solid ${brand} !important;
  }
  /* Hover nas linhas de dados */
  tr:not(:first-child):hover td {
    background: ${rowHover} !important;
  }
  /* Esconde link de copyright */
  a { display: none !important; }
  /* Esconde imagens */
  img { display: none !important; }
</style>
</head>
<body>
<script type="text/javascript"
  src="https://cepea.org.br/br/widgetproduto.js.php?fonte=arial&tamanho=10&largura=100%25&corfundo=transparent&cortexto=333333&corlinha=cccccc&id_indicador[]=2">
</script>
</body>
</html>`;
};

export const CepeaPanel: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'today' | 'history'>('today');

  // Detecta tema atual via data-theme no document
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    || document.body.getAttribute('data-theme') === 'dark'
    || window.matchMedia('(prefers-color-scheme: dark)').matches;

  const handleLoad = () => {
    // Pequeno delay para garantir que o script CEPEA terminou de escrever
    setTimeout(() => {
      setLoaded(true);
      setLastUpdate(
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
    }, 800);
  };

  const handleRefresh = () => {
    setLoaded(false);
    setLastUpdate('');
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="cepea-panel">
      {/* Header */}
      <div className="cepea-panel-header">
        <div className="cepea-panel-title">
          <div className="cepea-panel-icon">
            <TrendingUp size={16} />
          </div>
          <div>
            <span className="cepea-panel-label">MERCADO</span>
            <h3>Cotação CEPEA · Boi Gordo</h3>
          </div>
        </div>
        <div className="cepea-panel-meta">
          {lastUpdate && (
            <span className="cepea-update-time">
              <RefreshCw size={11} />
              Atualizado às {lastUpdate}
            </span>
          )}
          <button
            className="cepea-link-btn"
            onClick={handleRefresh}
            title="Atualizar cotação"
          >
            <RefreshCw size={13} className={!loaded ? 'spin' : ''} />
          </button>
          <a
            href="https://www.cepea.esalq.usp.br/br/indicador/boi-gordo.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="cepea-link-btn"
            title="Ver no site CEPEA"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Abas de Navegação (Tabs) */}
      <div className="cepea-tabs">
        <button 
          className={`cepea-tab ${viewMode === 'today' ? 'active' : ''}`}
          onClick={() => setViewMode('today')}
        >
          Hoje
        </button>
        <button 
          className={`cepea-tab ${viewMode === 'history' ? 'active' : ''}`}
          onClick={() => setViewMode('history')}
        >
          <BarChart2 size={12} />
          Histórico
        </button>
      </div>

      {viewMode === 'today' ? (
        <>
          {/* Skeleton enquanto carrega */}
          {!loaded && (
            <div className="cepea-skeleton" style={{ margin: '16px 20px' }}>
              <div className="cepea-skel-row header" />
              <div className="cepea-skel-row" />
              <div className="cepea-skel-row" style={{ opacity: 0.7 }} />
              <div className="cepea-skel-row" style={{ opacity: 0.4 }} />
            </div>
          )}

          {/* iframe com o widget CEPEA */}
          <iframe
            key={refreshKey}
            srcDoc={buildIframeHtml(isDark)}
            onLoad={handleLoad}
            title="Cotação CEPEA Boi Gordo"
            sandbox="allow-scripts allow-same-origin"
            scrolling="no"
            style={{
              border: 'none',
              width: '100%',
              height: loaded ? '130px' : '0',
              display: 'block',
              background: 'transparent',
              transition: 'height 0.3s ease',
              margin: loaded ? '10px 0' : 0
            }}
          />
        </>
      ) : (
        <div style={{ padding: '0 20px', minHeight: '160px' }}>
          <MarketHistoryChart />
        </div>
      )}

      {/* Rodapé */}
      <div className="cepea-panel-footer">
        <span>Fonte: CEPEA/ESALQ · USP</span>
        <span>Indicador: Boi Gordo · Preço à Vista (R$/@)</span>
      </div>
    </div>
  );
};
