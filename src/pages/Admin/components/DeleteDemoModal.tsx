import React from 'react';
import { AlertCircle } from 'lucide-react';
import { SidePanel } from '../../../components/Layout/SidePanel';

interface DeleteDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  tenantToDelete: any;
  deleteConfirmationInput: string;
  setDeleteConfirmationInput: (val: string) => void;
  isDeleting: boolean;
}

export const DeleteDemoModal: React.FC<DeleteDemoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tenantToDelete,
  deleteConfirmationInput,
  setDeleteConfirmationInput,
  isDeleting,
}) => {
  if (!tenantToDelete) {
    return null;
  }

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        if (deleteConfirmationInput === tenantToDelete.name) {
          onSubmit();
        }
      }}
      title="Excluir Base de Demonstração"
      subtitle="Esta ação é 100% irreversível!"
      icon={AlertCircle}
      submitLabel="Excluir Definitivamente"
      size="small"
      loading={isDeleting}
    >
      <div style={{ padding: '24px 0' }}>
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '13px',
            color: '#475569',
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          Você está prestes a excluir definitivamente a base de demonstração{' '}
          <strong style={{ color: '#0f172a' }}>"{tenantToDelete.name}"</strong>. Todos os dados,
          fazendas, lançamentos e configurações vinculados serão completamente apagados.
        </p>
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 800,
            color: '#475569',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Para confirmar, digite o nome exato da base abaixo:
        </label>
        <input
          type="text"
          value={deleteConfirmationInput}
          onChange={(e) => setDeleteConfirmationInput(e.target.value)}
          placeholder={tenantToDelete.name}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            fontSize: '13px',
            fontWeight: 700,
            color: '#991b1b',
            outline: 'none',
          }}
          autoFocus
        />

        {/* Adiciona um estilo inline temporário para sobrescrever a cor do botão primário do SidePanel caso esteja validado */}
        <style>{`
          .tauze-sidepanel-footer .primary-btn {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
            opacity: ${deleteConfirmationInput === tenantToDelete.name ? '1' : '0.6'} !important;
            pointer-events: ${deleteConfirmationInput === tenantToDelete.name ? 'auto' : 'none'} !important;
          }
        `}</style>
      </div>
    </SidePanel>
  );
};
