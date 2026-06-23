import React from 'react';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { SidePanel } from '../../../components/Layout/SidePanel';

interface DeletePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  planToDelete: any;
  deleteConfirmationInput: string;
  setDeleteConfirmationInput: (val: string) => void;
  isDeleting: boolean;
}

export const DeletePlanModal: React.FC<DeletePlanModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  planToDelete,
  deleteConfirmationInput,
  setDeleteConfirmationInput,
  isDeleting,
}) => {
  if (!planToDelete) {
    return null;
  }

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        if (deleteConfirmationInput.trim().toLowerCase() === planToDelete.name.trim().toLowerCase()) {
          onConfirmDelete();
        }
      }}
      title="Excluir Plano"
      subtitle="Esta ação é 100% irreversível!"
      icon={AlertCircle}
      submitLabel="Excluir Definitivamente"
      size="small"
      loading={isDeleting}
      submitDisabled={deleteConfirmationInput.trim().toLowerCase() !== planToDelete.name.trim().toLowerCase()}
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
          Você está prestes a excluir definitivamente o plano{' '}
          <strong style={{ color: '#0f172a' }}>"{planToDelete.name}"</strong>. Os clientes que já assinaram não perderão acesso, mas este plano deixará de estar disponível para novas contratações ou edições.
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
          Para confirmar, digite o nome exato do plano abaixo:
        </label>
        <input
          type="text"
          value={deleteConfirmationInput}
          onChange={(e) => setDeleteConfirmationInput(e.target.value)}
          placeholder={planToDelete.name}
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
      </div>
    </SidePanel>
  );
};
