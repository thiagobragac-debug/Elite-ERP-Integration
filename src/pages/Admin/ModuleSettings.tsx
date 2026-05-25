import React, { useState } from 'react';
import { Settings, Plus, Search } from 'lucide-react';
import { CategorySettingsTab } from './CategoryManagement';
import { SystemSettingsTab } from './SystemSettingsTab';
import { RoleSettingsTab } from './RoleManagement';
import { NcmSettingsTab } from '../Inventory/InventorySettings';

export const ModuleSettings: React.FC = () => {
  const [activeModule, setActiveModule] = useState('sistema');
  const [activeSetting, setActiveSetting] = useState('system');
  const [searchTerm, setSearchTerm] = useState('');
  const [triggerCreate, setTriggerCreate] = useState(0);
  const [triggerImport, setTriggerImport] = useState(0);
  const [systemIsSaving, setSystemIsSaving] = useState(false);
  const [systemSaveSuccess, setSystemSaveSuccess] = useState(false);

  const modules = [
    { id: 'sistema', label: 'Geral & Sistema' },
    { id: 'pecuaria', label: 'Pecuária' },
    { id: 'estoque', label: 'Estoque' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'compras', label: 'Compras & Suprimentos' },
    { id: 'frota', label: 'Máquina & Frota' },
    { id: 'parceiros', label: 'Comercial & Parceiros' }
  ];

  const getSettingsForModule = (modId: string) => {
    switch(modId) {
      case 'sistema':
        return [
          { id: 'system', label: 'Parâmetros' },
          { id: 'cargos', label: 'Cargos Corporativos' },
          { id: 'governance', label: 'Políticas' },
          { id: 'bi', label: 'BI' },
          { id: 'canvas', label: 'Canvas' }
        ];
      case 'estoque':
        return [
          { id: 'categorias', label: 'Categorias de Insumo' },
          { id: 'unidades', label: 'Unidades de Medida' },
          { id: 'ncms', label: 'Tabela de NCMs' }
        ];
      case 'financeiro':
        return [
          { id: 'categorias', label: 'Categorias Financeiras' },
          { id: 'planos', label: 'Plano de Contas (Em Breve)' }
        ];
      case 'pecuaria':
        return [
          { id: 'categorias', label: 'Categorias de Animais' },
          { id: 'racas', label: 'Raças' }
        ];
      case 'compras':
        return [
          { id: 'categorias', label: 'Tipos de Fornecedor' },
          { id: 'regras', label: 'Regras de Cotação (Em Breve)' }
        ];
      case 'frota':
        return [
          { id: 'categorias', label: 'Categorias de Máquina' },
          { id: 'manutencao', label: 'Tipos de Manutenção' }
        ];
      case 'parceiros':
        return [
          { id: 'categorias', label: 'Tipos de Parceiro' },
          { id: 'regras', label: 'Regras Comerciais (Em Breve)' }
        ];
      default:
        return [];
    }
  };

  const currentSettings = getSettingsForModule(activeModule);

  const handleModuleSwitch = (modId: string) => {
    setActiveModule(modId);
    setActiveSetting(getSettingsForModule(modId)[0].id);
    setSearchTerm('');
  };

  const getActionLabel = () => {
    if (activeModule === 'sistema') {
      return systemIsSaving ? 'SINCRONIZANDO...' : systemSaveSuccess ? 'CONFIGURAÇÕES SALVAS' : 'SALVAR ALTERAÇÕES';
    }
    if (activeSetting === 'ncms') return 'NOVO NCM';
    return 'NOVA CATEGORIA';
  };

  return (
    <div className="admin-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge" style={{ background: 'hsl(var(--bg-sidebar))', color: 'hsl(var(--brand))', border: '1px solid hsl(var(--brand) / 0.3)' }}>
            <Settings size={14} fill="currentColor" />
            <span>CENTRAL DE GOVERNANÇA v5.0</span>
          </div>
          <h1 className="page-title">Configuração de Módulos</h1>
          <p className="page-subtitle">Centralize parâmetros, categorias e regras fiscais de todos os módulos.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {activeSetting === 'ncms' && (
            <button className="secondary-btn" onClick={() => setTriggerImport(prev => prev + 1)}>
              <Search size={18} />
              <span>IMPORTAR DA RECEITA</span>
            </button>
          )}
          <button 
            className={`primary-btn ${activeModule === 'sistema' && systemSaveSuccess ? 'success' : ''}`} 
            onClick={() => setTriggerCreate(prev => prev + 1)}
            disabled={activeModule === 'sistema' && systemIsSaving}
          >
            {activeModule === 'sistema' ? (
              systemIsSaving ? <Settings size={18} className="animate-spin" /> : 
              systemSaveSuccess ? <Settings size={18} /> : <Settings size={18} />
            ) : <Plus size={18} />}
            <span>{getActionLabel()}</span>
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', background: 'hsl(var(--bg-card))', padding: '16px', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '8px' }}>
            Módulos do Sistema
          </h3>
          {modules.map(mod => (
            <button
              key={mod.id}
              onClick={() => handleModuleSwitch(mod.id)}
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: '8px',
                background: activeModule === mod.id ? 'hsl(var(--brand) / 0.1)' : 'transparent',
                color: activeModule === mod.id ? 'hsl(var(--brand))' : 'hsl(var(--text-main))',
                fontWeight: activeModule === mod.id ? 700 : 500,
                border: activeModule === mod.id ? '1px solid hsl(var(--brand) / 0.2)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: activeModule === mod.id ? 'hsl(var(--brand))' : 'transparent',
                transition: 'all 0.2s ease'
              }} />
              {mod.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Top Settings Tabs */}
          <div className="tauze-controls-row" style={{ marginBottom: '24px' }}>
            <div className="tauze-tab-group">
              {currentSettings.map(setting => (
                <button
                  key={setting.id}
                  className={`tauze-tab-item ${activeSetting === setting.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSetting(setting.id);
                    setSearchTerm('');
                  }}
                >
                  <span>{setting.label}</span>
                </button>
              ))}
            </div>
            {activeModule !== 'sistema' && (
              <div className="tauze-search-wrapper" style={{ marginLeft: 'auto' }}>
                <Search size={18} className="s-icon" />
                <input 
                  type="text" 
                  className="tauze-search-input"
                  placeholder={`Pesquisar...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Settings Content */}
          {activeModule === 'sistema' && (
            <SystemSettingsTab 
              activeTab={activeSetting} 
              triggerSave={triggerCreate} 
              onSaveStatus={(saving, success) => {
                setSystemIsSaving(saving);
                setSystemSaveSuccess(success);
              }}
            />
          )}
          {activeSetting === 'cargos' && <RoleSettingsTab searchTerm={searchTerm} triggerCreate={triggerCreate} />}
          {activeSetting === 'categorias' && <CategorySettingsTab modulo={activeModule} searchTerm={searchTerm} triggerCreate={triggerCreate} />}
          {activeSetting === 'racas' && <CategorySettingsTab modulo="racas" searchTerm={searchTerm} triggerCreate={triggerCreate} />}
          {activeSetting === 'unidades' && <CategorySettingsTab modulo="unidades" searchTerm={searchTerm} triggerCreate={triggerCreate} />}
          {activeSetting === 'ncms' && <NcmSettingsTab searchTerm={searchTerm} triggerCreate={triggerCreate} triggerImport={triggerImport} />}
          {(activeSetting === 'planos' || activeSetting === 'regras' || activeSetting === 'manutencao') && (
            <div className="hub-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
              <div>
                <Settings size={32} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p>Esta configuração estará disponível nas próximas atualizações.</p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
