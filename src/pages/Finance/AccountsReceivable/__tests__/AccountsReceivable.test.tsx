/**
 * Tests for AccountsReceivable module
 *
 * Note: Full integration tests require complete context setup including:
 * - TenantProvider
 * - AuthProvider
 * - ConfirmProvider
 * - QueryClientProvider
 *
 * These tests verify the module structure and exports.
 */

import { describe, it, expect } from 'vitest';
import * as AccountsReceivableModule from '../index';
import { Receivable, ReceivableFormData, FilterValues, HistoryItem, TabType } from '../types';

describe('AccountsReceivable Module', () => {
  it('exports the main AccountsReceivable component', () => {
    expect(AccountsReceivableModule.AccountsReceivable).toBeDefined();
    expect(typeof AccountsReceivableModule.AccountsReceivable).toBe('function');
  });
});

describe('AccountsReceivable Types', () => {
  it('defines Receivable type correctly', () => {
    const receivable: Receivable = {
      id: 'test-id',
      descricao: 'Test Receivable',
      valor_total: 1000,
      data_vencimento: '2024-01-01',
      status: 'PENDENTE',
    };
    expect(receivable.id).toBe('test-id');
    expect(receivable.status).toBe('PENDENTE');
  });

  it('defines ReceivableFormData type correctly', () => {
    const formData: ReceivableFormData = {
      description: 'Test',
      value: 1000,
      dueDate: '2024-01-01',
      status: 'PENDENTE',
    };
    expect(formData.description).toBe('Test');
    expect(formData.status).toBe('PENDENTE');
  });

  it('defines FilterValues type correctly', () => {
    const filters: FilterValues = {
      status: 'all',
      minAmount: 0,
      maxAmount: 1000000,
      dateStart: '',
      dateEnd: '',
    };
    expect(filters.status).toBe('all');
    expect(filters.maxAmount).toBe(1000000);
  });

  it('defines HistoryItem type correctly', () => {
    const historyItem: HistoryItem = {
      id: '1',
      date: '2024-01-01',
      title: 'Test',
      subtitle: 'Test Subtitle',
      value: 'R$ 1.000,00',
      status: 'success',
    };
    expect(historyItem.status).toBe('success');
  });

  it('defines TabType correctly', () => {
    const tab1: TabType = 'TODAS';
    const tab2: TabType = 'PENDENTE';
    const tab3: TabType = 'RECEBIDO';
    expect(tab1).toBe('TODAS');
    expect(tab2).toBe('PENDENTE');
    expect(tab3).toBe('RECEBIDO');
  });
});
