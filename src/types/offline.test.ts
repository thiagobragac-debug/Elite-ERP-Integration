import { describe, it, expect } from 'vitest';
import {
  OperationType,
  QueueOperationStatus,
  QueuedOperation,
  CreateOperation,
  UpdateOperation,
  DeleteOperation,
  isCreateOperation,
  isUpdateOperation,
  isDeleteOperation,
  DEFAULT_SYNC_CONFIG,
} from './offline';

describe('Offline Types', () => {
  describe('QueuedOperation interface', () => {
    it('should define a valid queued operation structure', () => {
      const operation: QueuedOperation = {
        id: 'test-id-123',
        type: 'CREATE',
        table: 'animais',
        payload: {
          brinco: '12345',
          raca: 'Nelore',
          sexo: 'Macho',
        },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      expect(operation.id).toBe('test-id-123');
      expect(operation.type).toBe('CREATE');
      expect(operation.table).toBe('animais');
      expect(operation.status).toBe('pending');
    });

    it('should support all operation types', () => {
      const createOp: OperationType = 'CREATE';
      const updateOp: OperationType = 'UPDATE';
      const deleteOp: OperationType = 'DELETE';

      expect(createOp).toBe('CREATE');
      expect(updateOp).toBe('UPDATE');
      expect(deleteOp).toBe('DELETE');
    });

    it('should support all status types', () => {
      const pending: QueueOperationStatus = 'pending';
      const syncing: QueueOperationStatus = 'syncing';
      const failed: QueueOperationStatus = 'failed';
      const completed: QueueOperationStatus = 'completed';

      expect(pending).toBe('pending');
      expect(syncing).toBe('syncing');
      expect(failed).toBe('failed');
      expect(completed).toBe('completed');
    });
  });

  describe('Specialized operation types', () => {
    it('should correctly identify CREATE operations', () => {
      const createOp: CreateOperation = {
        id: 'create-1',
        type: 'CREATE',
        table: 'animais',
        payload: { brinco: '123' },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      expect(isCreateOperation(createOp)).toBe(true);
      expect(isUpdateOperation(createOp)).toBe(false);
      expect(isDeleteOperation(createOp)).toBe(false);
    });

    it('should correctly identify UPDATE operations', () => {
      const updateOp: UpdateOperation = {
        id: 'update-1',
        type: 'UPDATE',
        table: 'animais',
        payload: { id: 'animal-123', peso_atual: 500 },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      expect(isCreateOperation(updateOp)).toBe(false);
      expect(isUpdateOperation(updateOp)).toBe(true);
      expect(isDeleteOperation(updateOp)).toBe(false);
    });

    it('should correctly identify DELETE operations', () => {
      const deleteOp: DeleteOperation = {
        id: 'delete-1',
        type: 'DELETE',
        table: 'animais',
        payload: { id: 'animal-123' },
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      expect(isCreateOperation(deleteOp)).toBe(false);
      expect(isUpdateOperation(deleteOp)).toBe(false);
      expect(isDeleteOperation(deleteOp)).toBe(true);
    });
  });

  describe('DEFAULT_SYNC_CONFIG', () => {
    it('should provide sensible default configuration values', () => {
      expect(DEFAULT_SYNC_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_SYNC_CONFIG.retryBaseDelay).toBe(1000);
      expect(DEFAULT_SYNC_CONFIG.retryMaxDelay).toBe(30000);
      expect(DEFAULT_SYNC_CONFIG.operationTimeout).toBe(10000);
      expect(DEFAULT_SYNC_CONFIG.batchSize).toBe(10);
      expect(DEFAULT_SYNC_CONFIG.autoSyncOnline).toBe(true);
      expect(DEFAULT_SYNC_CONFIG.backgroundSyncInterval).toBe(60000);
    });
  });

  describe('Type guards', () => {
    it('should handle mixed operation types correctly', () => {
      const operations: QueuedOperation[] = [
        {
          id: '1',
          type: 'CREATE',
          table: 'animais',
          payload: { brinco: '123' },
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        },
        {
          id: '2',
          type: 'UPDATE',
          table: 'pesagens',
          payload: { id: 'pesagem-1', peso: 450 },
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        },
        {
          id: '3',
          type: 'DELETE',
          table: 'abastecimentos',
          payload: { id: 'abast-1' },
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        },
      ];

      const createOps = operations.filter(isCreateOperation);
      const updateOps = operations.filter(isUpdateOperation);
      const deleteOps = operations.filter(isDeleteOperation);

      expect(createOps.length).toBe(1);
      expect(updateOps.length).toBe(1);
      expect(deleteOps.length).toBe(1);
    });
  });

  describe('Table names', () => {
    it('should support critical table names', () => {
      const tables = [
        'animais',
        'pesagens',
        'abastecimentos',
        'contas_pagar',
        'contas_receber',
        'insumos',
        'movimentacoes_estoque',
      ];

      tables.forEach((table) => {
        const op: QueuedOperation = {
          id: `op-${table}`,
          type: 'CREATE',
          table: table as any,
          payload: {},
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        };

        expect(op.table).toBe(table);
      });
    });
  });
});
