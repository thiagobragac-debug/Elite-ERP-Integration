import React, { useState } from 'react';
import {
  Zap,
  CheckCircle,
  Clock,
  Database,
  CheckCircle2,
  MonitorPlay,
  PiggyBank,
  Briefcase,
} from 'lucide-react';
import { SidePanel } from '../../../components/Layout/SidePanel';
import { SearchableSelect } from '../../../components/Forms/SearchableSelect';

interface CreateDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: {
    name: string;
    trialDuration: number;
    seedData: boolean;
    modules: string[];
  }) => void;
  isSaving: boolean;
}

export const CreateDemoModal: React.FC<CreateDemoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
}) => {
  const [name, setName] = useState('');
  const [trialDuration, setTrialDuration] = useState('14');
  const [seedData, setSeedData] = useState(true);
  const [modules, setModules] = useState<string[]>([]);

  const availableModules = [
    {
      id: 'financial',
      name: 'Módulo Financeiro',
      icon: PiggyBank,
      desc: 'Ativa DRE e conciliação',
    },
    { id: 'b3', name: 'Calculadora B3', icon: MonitorPlay, desc: 'Mercado futuro e hedge' },
    { id: 'sales', name: 'Vendas CRM', icon: Briefcase, desc: 'Gestão comercial avançada' },
  ];

  const toggleModule = (modId: string) => {
    if (modules.includes(modId)) {
      setModules(modules.filter((m) => m !== modId));
    } else {
      setModules([...modules, modId]);
    }
  };

  // Reseta os dados ao fechar (via useEffect local seria ideal se fosse persistente)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      trialDuration: parseInt(trialDuration, 10),
      seedData,
      modules,
    });
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Nova Base de Demonstração"
      subtitle="Provisionar um tenant temporário para testes de clientes"
      icon={Zap}
      submitLabel="Criar Base Demo"
      size="xlarge"
      loading={isSaving}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingTop: '16px' }}>
        {/* PASSO 01: DADOS BÁSICOS */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 01</div>
            <h4 className="tauze-section-title">Dados Básicos</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="tauze-field-group">
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                NOME DA BASE DEMO (CLIENTE)
              </label>
              <input
                className="tauze-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: TBC Agro Demo"
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--bg-main))',
                }}
                autoFocus
              />
            </div>

            <div
              style={{
                background: 'hsl(var(--success)/0.1)',
                border: '1px solid hsl(var(--success)/0.3)',
                padding: '12px 16px',
                borderRadius: '10px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              <CheckCircle
                size={16}
                style={{ color: 'hsl(var(--success))', flexShrink: 0, marginTop: '2px' }}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: 'hsl(var(--text-main))',
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                Esta base herdará automaticamente todos os Cargos, Categorias e Perfis de Permissão
                configurados no seu <strong>Template Master</strong>.
              </span>
            </div>
          </div>
        </section>

        {/* PASSO 02: CONFIGURAÇÕES DA DEMONSTRAÇÃO */}
        <section className="tauze-form-section">
          <div className="tauze-section-header">
            <div className="tauze-section-badge">PASSO 02</div>
            <h4 className="tauze-section-title">Regras e Configurações</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="tauze-field-group">
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Clock size={12} /> DURAÇÃO DO TRIAL (DIAS)
              </label>
              <SearchableSelect
                value={trialDuration}
                onChange={(val: any) => setTrialDuration(val)}
                options={[
                  { value: '7', label: '7 Dias (Curta Duração)' },
                  { value: '14', label: '14 Dias (Padrão)' },
                  { value: '30', label: '30 Dias (Estendido)' },
                ]}
              />
              <p style={{ margin: '6px 0 0', fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
                A instância será suspensa automaticamente após o período.
              </p>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--bg-main))',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <h5
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Database size={14} color="hsl(var(--brand))" /> Popular com Dados (Seed)
                </h5>
                <label className="tauze-switch">
                  <input
                    type="checkbox"
                    checked={seedData}
                    onChange={(e) => setSeedData(e.target.checked)}
                  />
                  <span className="slider round" />
                </label>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                Injeta registros fictícios de vendas e faturas na instância para pronta
                demonstração.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'hsl(var(--text-muted))',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              MÓDULOS DE VITRINE (ENABLE ADD-ONS)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {availableModules.map((mod) => {
                const isActive = modules.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: `1px solid ${isActive ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                      background: isActive ? 'hsl(var(--brand)/0.05)' : 'hsl(var(--bg-main))',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {isActive && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          color: 'hsl(var(--brand))',
                        }}
                      >
                        <CheckCircle2 size={16} fill="hsl(var(--brand))" color="white" />
                      </div>
                    )}
                    <mod.icon
                      size={20}
                      color={isActive ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))'}
                      style={{ marginBottom: '12px' }}
                    />
                    <h5
                      style={{
                        margin: '0 0 4px',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: isActive ? 'hsl(var(--brand))' : 'hsl(var(--text-main))',
                      }}
                    >
                      {mod.name}
                    </h5>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '10px',
                        color: 'hsl(var(--text-muted))',
                        lineHeight: 1.4,
                      }}
                    >
                      {mod.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </SidePanel>
  );
};
