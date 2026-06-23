/**
 * Form component for creating/editing receivables
 */

import React from 'react';
import { TransactionForm } from '../../../components/Forms/TransactionForm';
import type { Receivable, ReceivableFormData } from './types';

interface ReceivableFormProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: number;
  selectedInvoice: Receivable | null;
  onSubmit: (data: ReceivableFormData) => void;
}

export function ReceivableForm({
  isOpen,
  onClose,
  actionId,
  selectedInvoice,
  onSubmit,
}: ReceivableFormProps) {
  return (
    <TransactionForm
      isOpen={isOpen}
      onClose={onClose}
      actionId={actionId}
      type="receivable"
      initialData={selectedInvoice}
      onSubmit={onSubmit}
    />
  );
}
