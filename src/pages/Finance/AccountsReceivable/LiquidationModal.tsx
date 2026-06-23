/**
 * Modal component for handling receivable liquidation
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { BatchLiquidationModal } from '../../../components/Modals/BatchLiquidationModal';
import { HistoryModal } from '../../../components/Modals/HistoryModal';
import type { Receivable, HistoryItem } from './types';

interface LiquidationModalProps {
  isBatchModalOpen: boolean;
  onCloseBatchModal: () => void;
  selectedInvoice: Receivable | null;
  selectedItems: (string | number)[];
  onBatchSuccess: () => void;
  isHistoryModalOpen: boolean;
  onCloseHistoryModal: () => void;
  historyItems: HistoryItem[];
  historyLoading: boolean;
  onClearSelection: () => void;
  onOpenBatchModal: () => void;
}

export function LiquidationModal({
  isBatchModalOpen,
  onCloseBatchModal,
  selectedInvoice,
  selectedItems,
  onBatchSuccess,
  isHistoryModalOpen,
  onCloseHistoryModal,
  historyItems,
  historyLoading,
  onClearSelection,
  onOpenBatchModal,
}: LiquidationModalProps) {
  return (
    <>
      <BatchLiquidationModal
        isOpen={isBatchModalOpen}
        onClose={onCloseBatchModal}
        onSuccess={onBatchSuccess}
        selectedIds={selectedInvoice ? [selectedInvoice.id] : selectedItems}
        type="receivable"
        title={selectedInvoice ? 'Baixa Individual' : 'Baixa em Lote'}
        subtitle={
          selectedInvoice
            ? `Liquidando título: ${selectedInvoice.descricao}`
            : `Liquidando ${selectedItems.length} títulos selecionados.`
        }
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={onCloseHistoryModal}
        title="Dossiê da Receita"
        subtitle="Rastreabilidade completa do recebível"
        items={historyItems as any}
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
}
