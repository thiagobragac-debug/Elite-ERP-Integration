/**
 * Payment Modal Component
 * Handles batch liquidation and history modals
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { BatchLiquidationModal } from '../../../components/Modals/BatchLiquidationModal';
import { HistoryModal } from '../../../components/Modals/HistoryModal';
import type { Account, HistoryItem } from './types';

interface PaymentModalProps {
  isBatchModalOpen: boolean;
  onCloseBatchModal: () => void;
  selectedBill: Account | null;
  selectedItems: (string | number)[];
  onBatchSuccess: () => void;
  isHistoryModalOpen: boolean;
  onCloseHistoryModal: () => void;
  historyItems: HistoryItem[];
  historyLoading: boolean;
  onClearSelection: () => void;
  onOpenBatchModal: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isBatchModalOpen,
  onCloseBatchModal,
  selectedBill,
  selectedItems,
  onBatchSuccess,
  isHistoryModalOpen,
  onCloseHistoryModal,
  historyItems,
  historyLoading,
  onClearSelection,
  onOpenBatchModal,
}) => {
  return (
    <>
      <BatchLiquidationModal
        isOpen={isBatchModalOpen}
        onClose={onCloseBatchModal}
        onSuccess={onBatchSuccess}
        selectedIds={selectedBill ? [selectedBill.id] : selectedItems}
        type="payable"
        title={selectedBill ? 'Baixa Individual' : 'Baixa em Lote'}
        subtitle={
          selectedBill
            ? `Liquidando título: ${selectedBill.descricao}`
            : `Liquidando ${selectedItems.length} títulos selecionados.`
        }
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={onCloseHistoryModal}
        title="Dossiê do Título"
        subtitle="Rastreabilidade completa da obrigação financeira"
        items={historyItems}
        loading={historyLoading}
      />

      <AnimatePresence>
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="tauze-batch-actions-bar"
          >
            <div className="batch-info">
              <div className="batch-count">{selectedItems.length}</div>
              <div className="batch-text">Títulos Selecionados</div>
            </div>
            <div className="batch-actions">
              <button className="batch-btn secondary" onClick={onClearSelection}>
                CANCELAR
              </button>
              <button className="batch-btn success" onClick={onOpenBatchModal}>
                <Check size={18} />
                LIQUIDAR EM LOTE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
