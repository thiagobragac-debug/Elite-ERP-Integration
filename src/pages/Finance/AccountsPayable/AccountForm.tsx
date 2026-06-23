/**
 * Account Form Component
 * Wraps TransactionForm for account creation/editing
 */

import React from 'react';
import { TransactionForm } from '../../../components/Forms/TransactionForm';
import type { Account, AccountFormData } from './types';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: number;
  selectedBill: Account | null;
  onSubmit: (formData: AccountFormData) => Promise<void>;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  isOpen,
  onClose,
  actionId,
  selectedBill,
  onSubmit,
}) => {
  return (
    <TransactionForm
      isOpen={isOpen}
      onClose={onClose}
      actionId={actionId}
      type="payable"
      initialData={selectedBill}
      onSubmit={onSubmit}
    />
  );
};
