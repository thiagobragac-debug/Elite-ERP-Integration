import React, { useState } from 'react';
import { Shield, Activity, Eye, Database, Lock } from 'lucide-react';
import { SidePanel } from '../../../components/Layout/SidePanel';

interface RetentionPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => Promise<void>;
  initialSettings: any;
}

export const RetentionPolicyModal: React.FC<RetentionPolicyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSettings,
}) => {
  const [retentionSettings, setRetentionSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
          await onSave(retentionSettings);
        } finally {
          setIsSaving(false);
        }
      }}
      title="Políticas de Retenção"
      subtitle="Governança de Inadimplência & Suspensão"
      icon={Shield}
      submitLabel="Salvar Alterações"
      size="medium"
      loading={isSaving}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Visual Timeline Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '24px',
              left: '10%',
              right: '10%',
              height: '2px',
              background: 'hsl(var(--bg-main))',
              zIndex: 0,
            }}
          />
          {[
            { label: 'Alertas', icon: Activity },
            { label: 'Leitura', icon: Eye },
            { label: 'Pecuária', icon: Database },
            { label: 'Bloqueio', icon: Lock },
          ].map((step, i) => (
            <div
              key={i}
              style={{
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'hsl(var(--bg-card))',
                  border: '2px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                }}
              >
                <step.icon size={18} />
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 900,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                }}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Início de Alertas (D+)
            </label>
            <input
              type="number"
              value={retentionSettings.alertDays}
              onChange={(e) =>
                setRetentionSettings({
                  ...retentionSettings,
                  alertDays: parseInt(e.target.value) || 0,
                })
              }
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontWeight: 700,
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Modo Leitura Global (D+)
            </label>
            <input
              type="number"
              value={retentionSettings.readOnlyDays}
              onChange={(e) =>
                setRetentionSettings({
                  ...retentionSettings,
                  readOnlyDays: parseInt(e.target.value) || 0,
                })
              }
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontWeight: 700,
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Restrição Pecuária (D+)
            </label>
            <input
              type="number"
              value={retentionSettings.pecuariaOnlyDays}
              onChange={(e) =>
                setRetentionSettings({
                  ...retentionSettings,
                  pecuariaOnlyDays: parseInt(e.target.value) || 0,
                })
              }
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontWeight: 700,
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Portal de Pagamento (D+)
            </label>
            <input
              type="number"
              value={retentionSettings.forcedPaymentDays}
              onChange={(e) =>
                setRetentionSettings({
                  ...retentionSettings,
                  forcedPaymentDays: parseInt(e.target.value) || 0,
                })
              }
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontWeight: 700,
              }}
            />
          </div>
        </div>

        <div
          style={{
            padding: '16px',
            background: '#fffbeb',
            borderRadius: '16px',
            border: '1px solid #fef3c7',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '11px',
              color: '#92400e',
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            * Na Fase 3, o usuário terá acesso apenas ao módulo Pecuária em modo leitura. Na Fase 4,
            qualquer acesso será redirecionado para o gateway de pagamento.
          </p>
        </div>
      </div>
    </SidePanel>
  );
};
