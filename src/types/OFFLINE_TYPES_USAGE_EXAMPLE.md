# Offline Types Usage Examples

This document demonstrates how to use the offline queue operation types defined in `src/types/offline.ts`.

## Basic Usage

### Importing Types

```typescript
import {
  QueuedOperation,
  OperationType,
  QueueOperationStatus,
  CreateOperation,
  UpdateOperation,
  DeleteOperation,
  isCreateOperation,
  isUpdateOperation,
  isDeleteOperation,
  DEFAULT_SYNC_CONFIG,
  QueueStats,
  SyncResult,
} from '@/types/offline';
```

### Creating Queued Operations

#### CREATE Operation
```typescript
const createAnimalOp: QueuedOperation = {
  id: crypto.randomUUID(),
  type: 'CREATE',
  table: 'animais',
  payload: {
    brinco: '123456',
    raca: 'Nelore',
    sexo: 'Macho',
    peso_atual: 350,
    tenant_id: 'tenant-123',
  },
  timestamp: Date.now(),
  retryCount: 0,
  status: 'pending',
};
```

#### UPDATE Operation
```typescript
const updatePesagemOp: UpdateOperation = {
  id: crypto.randomUUID(),
  type: 'UPDATE',
  table: 'pesagens',
  payload: {
    id: 'pesagem-abc-123', // ID is required for updates
    peso: 450,
    data: '2024-01-15',
  },
  timestamp: Date.now(),
  retryCount: 0,
  status: 'pending',
};
```

#### DELETE Operation
```typescript
const deleteAbastecimentoOp: DeleteOperation = {
  id: crypto.randomUUID(),
  type: 'DELETE',
  table: 'abastecimentos',
  payload: {
    id: 'abast-xyz-789', // Only ID is needed for deletes
  },
  timestamp: Date.now(),
  retryCount: 0,
  status: 'pending',
};
```

## Using Type Guards

Type guards help you safely work with different operation types:

```typescript
function processOperation(operation: QueuedOperation) {
  if (isCreateOperation(operation)) {
    // TypeScript knows this is a CreateOperation
    console.log('Creating new record:', operation.payload);
  } else if (isUpdateOperation(operation)) {
    // TypeScript knows this is an UpdateOperation with id in payload
    console.log('Updating record:', operation.payload.id);
  } else if (isDeleteOperation(operation)) {
    // TypeScript knows this is a DeleteOperation
    console.log('Deleting record:', operation.payload.id);
  }
}
```

## Queue Statistics

Track metrics about your offline queue:

```typescript
function calculateQueueStats(operations: QueuedOperation[]): QueueStats {
  const pending = operations.filter(op => op.status === 'pending').length;
  const syncing = operations.filter(op => op.status === 'syncing').length;
  const failed = operations.filter(op => op.status === 'failed').length;
  const completed = operations.filter(op => op.status === 'completed').length;

  const timestamps = operations.map(op => op.timestamp);
  
  return {
    total: operations.length,
    pending,
    syncing,
    failed,
    completed,
    oldestTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
    newestTimestamp: timestamps.length > 0 ? Math.max(...timestamps) : undefined,
  };
}
```

## Sync Results

Track the results of sync operations:

```typescript
async function syncQueue(operations: QueuedOperation[]): Promise<SyncResult> {
  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  const failures: SyncResult['failures'] = [];

  for (const operation of operations) {
    try {
      await syncOperation(operation);
      successCount++;
    } catch (error) {
      failureCount++;
      failures.push({
        operation,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    successCount,
    failureCount,
    skippedCount: 0,
    failures,
    duration: Date.now() - startTime,
  };
}
```

## Configuration

Use the default configuration or customize it:

```typescript
import { DEFAULT_SYNC_CONFIG, OfflineSyncConfig } from '@/types/offline';

// Use defaults
const config = DEFAULT_SYNC_CONFIG;

// Or customize
const customConfig: OfflineSyncConfig = {
  ...DEFAULT_SYNC_CONFIG,
  maxRetries: 5,
  retryBaseDelay: 2000,
  batchSize: 20,
};
```

## Integration with OfflineSyncContext

Here's how to update the OfflineSyncContext to use these types:

```typescript
import { QueuedOperation, OperationType, SupportedTableName } from '@/types/offline';

interface OfflineSyncContextType {
  isOnline: boolean;
  queuedOperations: QueuedOperation[];
  queueMutation: (
    table: SupportedTableName,
    payload: Record<string, any>,
    operation: OperationType
  ) => Promise<void>;
  syncQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
  getQueueStats: () => QueueStats;
}
```

## Filtering Operations by Table

```typescript
function getOperationsByTable(
  operations: QueuedOperation[],
  table: SupportedTableName
): QueuedOperation[] {
  return operations.filter(op => op.table === table);
}

// Example: Get all pending animal operations
const animalOps = getOperationsByTable(queue, 'animais').filter(
  op => op.status === 'pending'
);
```

## Retry Logic with Exponential Backoff

```typescript
import { DEFAULT_SYNC_CONFIG } from '@/types/offline';

function calculateRetryDelay(retryCount: number): number {
  const { retryBaseDelay, retryMaxDelay } = DEFAULT_SYNC_CONFIG;
  
  // Exponential backoff: baseDelay * 2^retryCount
  const delay = retryBaseDelay * Math.pow(2, retryCount);
  
  // Cap at maxDelay
  return Math.min(delay, retryMaxDelay);
}

// Example usage:
// Retry 0: 1000ms (1s)
// Retry 1: 2000ms (2s)
// Retry 2: 4000ms (4s)
// Retry 3: 8000ms (8s)
// Retry 4+: 30000ms (30s - capped)
```

## Photo Upload Queue

For background photo synchronization:

```typescript
import { QueuedPhotoUpload } from '@/types/offline';

const photoUpload: QueuedPhotoUpload = {
  id: crypto.randomUUID(),
  file: photoBlob,
  bucket: 'animal-photos',
  path: `animals/${animalId}/photo.jpg`,
  entityType: 'animal',
  entityId: animalId,
  timestamp: Date.now(),
  status: 'pending',
  progress: 0,
  retryCount: 0,
};
```

## Best Practices

1. **Always generate unique IDs** for operations using `crypto.randomUUID()`
2. **Use type guards** (`isCreateOperation`, etc.) when processing operations
3. **Track retry counts** to avoid infinite retry loops
4. **Store timestamps** as numbers (milliseconds since epoch) for easy comparison
5. **Use the status field** to track operation lifecycle
6. **Handle errors gracefully** and store error messages in the `error` field
7. **Batch operations** when syncing to improve performance
8. **Implement exponential backoff** for retry logic

## TypeScript Benefits

These types provide:
- **Compile-time type safety** for all offline operations
- **IntelliSense support** in VS Code and other editors
- **Refactoring safety** when changing operation structures
- **Documentation** through JSDoc comments
- **Type narrowing** with type guards for safer code
