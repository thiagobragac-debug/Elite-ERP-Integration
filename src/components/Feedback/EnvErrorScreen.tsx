/**
 * Tela de erro para variáveis de ambiente ausentes
 * Exibida quando a validação de environment variables falha no startup
 */

import { AlertCircle, FileText, Terminal, RefreshCw } from 'lucide-react';
import './EnvErrorScreen.css';

interface EnvErrorScreenProps {
  missingVars: string[];
}

export default function EnvErrorScreen({ missingVars }: EnvErrorScreenProps) {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="env-error-screen">
      <div className="env-error-container">
        <div className="env-error-icon">
          <AlertCircle size={64} />
        </div>

        <h1 className="env-error-title">Configuração Incompleta</h1>

        <p className="env-error-description">
          O aplicativo não pode iniciar porque algumas variáveis de ambiente obrigatórias estão
          ausentes.
        </p>

        <div className="env-error-missing">
          <h2>Variáveis Ausentes:</h2>
          <ul>
            {missingVars.map((varName) => (
              <li key={varName}>
                <code>{varName}</code>
              </li>
            ))}
          </ul>
        </div>

        <div className="env-error-steps">
          <h2>Como Corrigir:</h2>
          <ol>
            <li>
              <FileText size={18} />
              <div>
                <strong>Copie o arquivo de exemplo:</strong>
                <code className="env-error-command">cp .env.example .env</code>
              </div>
            </li>
            <li>
              <Terminal size={18} />
              <div>
                <strong>Edite o arquivo .env:</strong>
                <p>Preencha as variáveis obrigatórias com os valores corretos.</p>
              </div>
            </li>
            <li>
              <RefreshCw size={18} />
              <div>
                <strong>Reinicie o servidor:</strong>
                <p>Pare o servidor de desenvolvimento e inicie novamente.</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="env-error-actions">
          <button onClick={handleReload} className="env-error-reload-btn" type="button">
            <RefreshCw size={16} />
            Recarregar Página
          </button>
        </div>

        <div className="env-error-footer">
          <p>
            💡 <strong>Dica:</strong> Consulte o arquivo <code>.env.example</code> para ver todas as
            variáveis disponíveis e suas descrições.
          </p>
        </div>
      </div>
    </div>
  );
}
