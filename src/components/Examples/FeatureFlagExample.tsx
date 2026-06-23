/**
 * Exemplo de uso de Feature Flags
 * Este arquivo demonstra as diferentes formas de usar feature flags
 */

import { useFeatureFlag, FeatureFlag, useFeatureFlags } from '../../lib/featureFlags';

/**
 * Exemplo 1: Usando hook
 */
export function DashboardExample() {
  const hasNewDashboard = useFeatureFlag('newDashboard');

  return <div>{hasNewDashboard ? <NewDashboard /> : <OldDashboard />}</div>;
}

/**
 * Exemplo 2: Usando componente wrapper
 */
export function AIExample() {
  return (
    <div>
      <h2>Análise de Dados</h2>

      {/* Feature flag com fallback */}
      <FeatureFlag flag="aiRecommendations" fallback={<p>Recomendações em breve...</p>}>
        <AIRecommendations />
      </FeatureFlag>
    </div>
  );
}

/**
 * Exemplo 3: Múltiplas flags
 */
export function AdvancedExample() {
  const flags = useFeatureFlags();

  return (
    <div>
      {flags.bulkImport && <BulkImportButton />}
      {flags.advancedExport && <AdvancedExportButton />}
      {flags.customReports && <CustomReportsLink />}
    </div>
  );
}

/**
 * Exemplo 4: Flag em configuração
 */
export function SettingsExample() {
  const hasWhatsApp = useFeatureFlag('whatsappIntegration');
  const hasBeta = useFeatureFlag('betaFeatures');

  return (
    <div className="settings-panel">
      <h3>Integrações</h3>

      {hasWhatsApp && (
        <div className="integration-card">
          <h4>WhatsApp Business</h4>
          <p>Configure notificações via WhatsApp</p>
          <button>Configurar</button>
        </div>
      )}

      {hasBeta && (
        <div className="beta-section">
          <h4>🧪 Features Beta</h4>
          <p>Você tem acesso a funcionalidades experimentais!</p>
        </div>
      )}
    </div>
  );
}

// Componentes de exemplo (substituir pelos reais)
function NewDashboard() {
  return <div>Dashboard v2 🎉</div>;
}
function OldDashboard() {
  return <div>Dashboard v1</div>;
}
function AIRecommendations() {
  return <div>🤖 Recomendações IA</div>;
}
function BulkImportButton() {
  return <button>Importação em Massa</button>;
}
function AdvancedExportButton() {
  return <button>Exportação Avançada</button>;
}
function CustomReportsLink() {
  return <a href="/relatorios/custom">Relatórios Customizados</a>;
}
