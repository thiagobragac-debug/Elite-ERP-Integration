import React from 'react';
import { Zap, CheckCircle } from 'lucide-react';
import { SidePanel } from '../../../components/Layout/SidePanel';

interface CreateDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  demoTenantName: string;
  setDemoTenantName: (val: string) => void;
  isSaving: boolean;
}

export const CreateDemoModal: React.FC<CreateDemoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  demoTenantName,
  setDemoTenantName,
  isSaving
}) => {
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      title="Nova Base de Demonstração"
      subtitle="Criada a partir do Template Master"
      icon={Zap}
      submitLabel="Criar Base Demo"
      size="small"
      loading={isSaving}
    >
      <div style={{ padding: '24px 0' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Nome da Base Demo</label>
        <input 
          type="text" 
          value={demoTenantName}
          onChange={(e) => setDemoTenantName(e.target.value)}
          placeholder="Ex: TBC Agro Demo"
          style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600, color: '#0f172a', outline: 'none' }}
          autoFocus
        />
        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600, lineHeight: 1.4 }}>
            Esta base herdará automaticamente todos os Cargos, Categorias e Perfis de Permissão configurados no seu **Template Master**.
          </span>
        </div>
      </div>
    </SidePanel>
  );
};
