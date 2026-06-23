import React from 'react';
import { Calendar } from 'lucide-react';
import { useCepea } from '../../contexts/CepeaContext';
import './CepeaBadge.css';

/**
 * Badge do header que exibe a cotação ao vivo do Boi Gordo (CEPEA).
 * A captura e persistência no banco são feitas pelo CepeaProvider (App.tsx).
 */
export const CepeaBadge: React.FC = () => {
  const { live, loading } = useCepea();

  return (
    <div className="cepea-badge" title="Última cotação Boi Gordo · CEPEA/ESALQ">
      <div className="cepea-badge-icon">@</div>

      <div className="cepea-badge-content">
        <span className="cepea-badge-label">BOI GORDO · CEPEA</span>

        {loading ? (
          <span className="cepea-badge-value loading">
            <span className="cepea-dot" />
            <span className="cepea-dot" />
            <span className="cepea-dot" />
          </span>
        ) : live ? (
          <>
            <span className="cepea-badge-value">R$ {live.valor}</span>
            {live.data && (
              <span className="cepea-badge-date">
                <Calendar size={9} />
                {live.data}
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
