/**
 * Offline Queue Operation Types
 * 
 * Defines TypeScript types for offline queue operations (Requirement 9).
 * These types support queuing create/update/delete operations in IndexedDB
 * when the application is offline, with proper typing for sync mechanisms.
 */

/**
 * Operation types supported by the offline queue
 */
export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * Queue operation status states
 */
export type QueueOperationStatus = 'pending' | 'syncing' | 'failed' | 'completed';

/**
 * Supported table names for offline operations
 * Extends this union type as new tables are added to the system
 */
export type SupportedTableName =
  | 'animais'
  | 'pesagens'
  | 'abastecimentos'
  | 'contas_pagar'
  | 'contas_receber'
  | 'insumos'
  | 'movimentacoes_estoque'
  | 'maquinas'
  | 'manutencoes'
  | 'lotes'
  | 'pastos'
  | 'eventos_reprodutivos'
  | 'tratamentos_sanitarios'
  | 'dietas'
  | 'fornecedores'
  | 'clientes';

/**
 * Core queued operation interface
 * Represents a single offline operation waiting to be synced
 */
export interface QueuedOperation {
  /** Unique identifier for the queued operation */
  id: string;
  
  /** Type of database operation */
  type: OperationType;
  
  /** Target table/entity name */
  table: SupportedTableName;
  
  /** Operation payload data (the actual record to create/update/delete) */
  payload: Record<string, any>;
  
  /** Timestamp when the operation was queued (ISO 8601 format) */
  timestamp: number;
  
  /** Number of sync retry attempts */
  retryCount: number;
  
  /** Current status of the operation */
  status: QueueOperationStatus;
  
  /** Error message if the operation failed */
  error?: string;
  
  /** Timestamp of the last sync attempt */
  lastAttemptAt?: number;
}

/**
 * Helper type for creating a new queued operation (before ID assignment)
 */
export interface NewQueuedOperation {
  type: OperationType;
  table: SupportedTableName;
  payload: Record<string, any>;
  timestamp: number;
  retryCount?: number;
  status?: QueueOperationStatus;
  error?: string;
}

/**
 * Specialized operation types for better type safety
 */

/** CREATE operation - for inserting new records */
export interface CreateOperation extends QueuedOperation {
  type: 'CREATE';
}

/** UPDATE operation - for modifying existing records */
export interface UpdateOperation extends QueuedOperation {
  type: 'UPDATE';
  /** ID of the record being updated (must be in payload) */
  payload: Record<string, any> & { id: string };
}

/** DELETE operation - for removing records */
export interface DeleteOperation extends QueuedOperation {
  type: 'DELETE';
  /** ID of the record being deleted (must be in payload) */
  payload: { id: string };
}

/**
 * Union type for all operation types
 */
export type AnyQueuedOperation = CreateOperation | UpdateOperation | DeleteOperation;

/**
 * Queue statistics interface
 * Used to track and display offline queue metrics
 */
export interface QueueStats {
  /** Total number of operations in queue */
  total: number;
  
  /** Number of pending operations */
  pending: number;
  
  /** Number of operations currently syncing */
  syncing: number;
  
  /** Number of failed operations */
  failed: number;
  
  /** Number of completed operations */
  completed: number;
  
  /** Oldest operation timestamp */
  oldestTimestamp?: number;
  
  /** Newest operation timestamp */
  newestTimestamp?: number;
}

/**
 * Sync result interface
 * Returned after attempting to sync queued operations
 */
export interface SyncResult {
  /** Number of operations successfully synced */
  successCount: number;
  
  /** Number of operations that failed to sync */
  failureCount: number;
  
  /** Number of operations that were skipped */
  skippedCount: number;
  
  /** Array of failed operations with error details */
  failures: Array<{
    operation: QueuedOperation;
    error: string;
  }>;
  
  /** Total sync duration in milliseconds */
  duration: number;
}

/**
 * Offline sync configuration options
 */
export interface OfflineSyncConfig {
  /** Maximum number of retry attempts for failed operations */
  maxRetries: number;
  
  /** Base delay in milliseconds for exponential backoff */
  retryBaseDelay: number;
  
  /** Maximum delay in milliseconds between retries */
  retryMaxDelay: number;
  
  /** Timeout in milliseconds for individual sync operations */
  operationTimeout: number;
  
  /** Maximum number of operations to process in a single sync batch */
  batchSize: number;
  
  /** Whether to automatically sync when coming back online */
  autoSyncOnline: boolean;
  
  /** Interval in milliseconds for background sync attempts */
  backgroundSyncInterval: number;
}

/**
 * Default offline sync configuration
 */
export const DEFAULT_SYNC_CONFIG: OfflineSyncConfig = {
  maxRetries: 3,
  retryBaseDelay: 1000, // 1 second
  retryMaxDelay: 30000, // 30 seconds
  operationTimeout: 10000, // 10 seconds
  batchSize: 10,
  autoSyncOnline: true,
  backgroundSyncInterval: 60000, // 1 minute
};

/**
 * Helper type guards for operation types
 */
export const isCreateOperation = (op: QueuedOperation): op is CreateOperation => {
  return op.type === 'CREATE';
};

export const isUpdateOperation = (op: QueuedOperation): op is UpdateOperation => {
  return op.type === 'UPDATE' && 'id' in op.payload;
};

export const isDeleteOperation = (op: QueuedOperation): op is DeleteOperation => {
  return op.type === 'DELETE' && 'id' in op.payload;
};

/**
 * Background sync registration interface (for Service Worker Background Sync API)
 */
export interface BackgroundSyncRegistration {
  /** Unique tag identifier for the sync registration */
  tag: string;
  
  /** Operations to sync when background sync triggers */
  operations: QueuedOperation[];
  
  /** Timestamp when the sync was registered */
  registeredAt: number;
}

/**
 * Photo upload queue item (for background photo sync)
 */
export interface QueuedPhotoUpload {
  /** Unique identifier for the photo upload */
  id: string;
  
  /** File object or blob to upload */
  file: File | Blob;
  
  /** Target storage bucket */
  bucket: string;
  
  /** Storage path for the uploaded file */
  path: string;
  
  /** Reference to the entity this photo belongs to */
  entityType: 'animal' | 'maquina' | 'pasto' | 'auditoria';
  
  /** ID of the entity this photo belongs to */
  entityId: string;
  
  /** Timestamp when queued */
  timestamp: number;
  
  /** Current status */
  status: QueueOperationStatus;
  
  /** Upload progress (0-100) */
  progress: number;
  
  /** Error message if upload failed */
  error?: string;
  
  /** Number of retry attempts */
  retryCount: number;
}
