import React, { useEffect, useState } from 'react';
import { TrendingUp, RefreshCw, ExternalLink, BarChart2 } from 'lucide-react';
import { MarketHistoryChart } from './MarketHistoryChart';
import { supabase } from '../../lib/supabase';
import './CepeaPanel.css';

interface QuoteData {
  date: string;
  value: number;
}

export const CepeaPanel: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [viewMode, setViewMode] = useState<'today' | 'history'>('today');
  const [recentQuotes, setRecentQuotes] = useState<QuoteData[]>([]);

  const fetchRecentQuotes = async () => {
    setLoaded(false);
    try {
      const { data, error } = await supabase
        .from('market_quotes')
        .select('date, value')
        .eq('indicator', 'boi_gordo_cepea')
        .order('date', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentQuotes(data || []);
      setLastUpdate(
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
    } catch (err) {
      console.error('Failed to fetch recent quotes:', err);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchRecentQuotes();
  }, []);

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
            onClick={fetchRecentQuotes}
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
        <div className="cepea-widget-wrapper">
          {!loaded ? (
            <div className="cepea-skeleton">
              <div className="cepea-skel-row header" />
              <div className="cepea-skel-row" />
              <div className="cepea-skel-row" style={{ opacity: 0.7 }} />
              <div className="cepea-skel-row" style={{ opacity: 0.4 }} />
            </div>
          ) : (
            <div className="cepea-native-table-container">
              <table className="cepea-native-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Valor R$</th>
                    <th>Variação</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuotes.map((quote, idx) => {
                    const prevQuote = recentQuotes[idx + 1];
                    const diff = prevQuote ? quote.value - prevQuote.value : 0;
                    const diffPercent = prevQuote && prevQuote.value > 0 ? (diff / prevQuote.value) * 100 : 0;
                    const isPositive = diff > 0;
                    const isNegative = diff < 0;
                    
                    return (
                      <tr key={quote.date}>
                        <td>{quote.date.split('T')[0].split('-').reverse().join('/')}</td>
                        <td style={{ fontWeight: 800 }}>R$ {quote.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className={isPositive ? 'var-pos' : isNegative ? 'var-neg' : 'var-neu'}>
                          {diffPercent === 0 ? '-' : `${isPositive ? '+' : ''}${diffPercent.toFixed(2)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
