import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { get, set, createStore } from 'idb-keyval';
import { supabase } from '../lib/supabase';
import { listenToServiceWorkerMessages } from '../lib/photoSync';

interface QueuedOperation {
  id: string;
  table: string;
  payload: any;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  timestamp: string;
  retries: number;
}

interface OfflineSyncContextType {
  isOnline: boolean;
  pendingCount: number;
  queuedOperations: QueuedOperation[];
  queueMutation: (
    table: string,
    payload: any,
    operation?: 'INSERT' | 'UPDATE' | 'DELETE'
  ) => Promise<void>;
  syncQueue: () => Promise<void>;
  retryOperation: (id: string) => Promise<void>;
  discardOperation: (id: string) => Promise<void>;
  clearQueue: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({
  isOnline: true,
  pendingCount: 0,
  queuedOperations: [],
  queueMutation: async () => {},
  syncQueue: async () => {},
  retryOperation: async () => {},
  discardOperation: async () => {},
  clearQueue: async () => {},
});

export const useOfflineSync = () => useContext(OfflineSyncContext);

// Create a dedicated IndexedDB store for offline operations
const offlineStore = createStore('offline-sync-db', 'operations');

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedOperations, setQueuedOperations] = useState<QueuedOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Calculate exponential backoff delay
  const getBackoffDelay = (retries: number): number => {
    // 1s, 2s, 4s, 8s, 16s, 32s (max 32 seconds)
    return Math.min(1000 * Math.pow(2, retries), 32000);
  };

  // Load queued operations from IndexedDB
  const loadQueue = useCallback(async () => {
    try {
      const queue: QueuedOperation[] = (await get('offline_mutation_queue', offlineStore)) || [];
      setQueuedOperations(queue);
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }, []);

  // Save queued operations to IndexedDB
  const saveQueue = useCallback(async (queue: QueuedOperation[]) => {
    try {
      await set('offline_mutation_queue', queue, offlineStore);
      setQueuedOperations(queue);
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }, []);

  // Execute a single operation with retry logic
  const executeOperation = async (operation: QueuedOperation): Promise<boolean> => {
    try {
      if (operation.operation === 'INSERT' || operation.operation === 'UPDATE') {
        const { error } = await supabase.from(operation.table).upsert(operation.payload);
        if (error) throw error;
      } else if (operation.operation === 'DELETE') {
        const { error } = await supabase.from(operation.table).delete().match(operation.payload);
        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error(`Failed to execute operation ${operation.id}:`, error);
      return false;
    }
  };

  // Sync all queued operations
  const syncQueue = useCallback(async () => {
    if (isSyncing || !isOnline || queuedOperations.length === 0) {
      return;
    }

    setIsSyncing(true);
    toast.loading(`Sincronizando ${queuedOperations.length} operações...`, {
      id: 'offline-sync',
    });

    const remainingOperations: QueuedOperation[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const operation of queuedOperations) {
      const success = await executeOperation(operation);

      if (success) {
        successCount++;
      } else {
        failedCount++;
        // Increment retry count and add back to queue
        const updatedOperation = {
          ...operation,
          retries: operation.retries + 1,
        };

        // If max retries not exceeded (e.g., 5 attempts), keep in queue
        if (updatedOperation.retries < 5) {
          remainingOperations.push(updatedOperation);
        } else {
          console.warn(`Operation ${operation.id} exceeded max retries, discarding`);
        }
      }

      // Add a small delay between operations to avoid rate limiting
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
    }

    await saveQueue(remainingOperations);

    setIsSyncing(false);

    if (successCount > 0 && failedCount === 0) {
      toast.success(`${successCount} operações sincronizadas com sucesso!`, {
        id: 'offline-sync',
      });
    } else if (successCount > 0 && failedCount > 0) {
      toast.error(
        `${successCount} sincronizadas, ${failedCount} falharam. Tentaremos novamente.`,
        { id: 'offline-sync', duration: 5000 }
      );
    } else if (failedCount > 0) {
      toast.error(`Erro ao sincronizar ${failedCount} operações. Tentaremos novamente depois.`, {
        id: 'offline-sync',
        duration: 5000,
      });
    }
  }, [queuedOperations, isOnline, isSyncing, saveQueue]);

  // Queue a new mutation
  const queueMutation = useCallback(
    async (
      table: string,
      payload: any,
      operation: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT'
    ) => {
      if (isOnline) {
        // If online, bypass queue and execute directly
        if (operation === 'DELETE') {
          await supabase.from(table).delete().match(payload);
        } else {
          await supabase.from(table).upsert(payload);
        }
        return;
      }

      // Create new operation with unique ID
      const newOperation: QueuedOperation = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        table,
        payload,
        operation,
        timestamp: new Date().toISOString(),
        retries: 0,
      };

      const updatedQueue = [...queuedOperations, newOperation];
      await saveQueue(updatedQueue);

      toast.success(`Ação salva offline (${updatedQueue.length} pendentes). Será sincronizada quando voltar online.`);
    },
    [isOnline, queuedOperations, saveQueue]
  );

  // Retry a specific operation
  const retryOperation = useCallback(
    async (id: string) => {
      const operation = queuedOperations.find((op) => op.id === id);
      if (!operation || !isOnline) {
        return;
      }

      toast.loading('Tentando novamente...', { id: `retry-${id}` });

      const success = await executeOperation(operation);

      if (success) {
        // Remove from queue
        const updatedQueue = queuedOperations.filter((op) => op.id !== id);
        await saveQueue(updatedQueue);
        toast.success('Operação sincronizada!', { id: `retry-${id}` });
      } else {
        toast.error('Falha ao sincronizar. Tente novamente mais tarde.', { id: `retry-${id}` });
      }
    },
    [queuedOperations, isOnline, saveQueue]
  );

  // Discard a specific operation
  const discardOperation = useCallback(
    async (id: string) => {
      const updatedQueue = queuedOperations.filter((op) => op.id !== id);
      await saveQueue(updatedQueue);
      toast.success('Operação descartada');
    },
    [queuedOperations, saveQueue]
  );

  // Clear entire queue
  const clearQueue = useCallback(async () => {
    await saveQueue([]);
    toast.success('Fila de sincronização limpa');
  }, [saveQueue]);

  // Keep syncQueue and queuedOperations.length updated in refs to avoid re-binding window listeners
  const syncQueueRef = React.useRef(syncQueue);
  const queuedOperationsLengthRef = React.useRef(queuedOperations.length);

  useEffect(() => {
    syncQueueRef.current = syncQueue;
    queuedOperationsLengthRef.current = queuedOperations.length;
  }, [syncQueue, queuedOperations.length]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restabelecida. Sincronizando dados...', { duration: 4000 });
      syncQueueRef.current();
    };

    const handleOffline = () => {
      setIsOnline(false);
      const pendingCount = queuedOperationsLengthRef.current;
      if (pendingCount > 0) {
        toast.error(
          `Você está offline. ${pendingCount} operação(ões) pendente(s) serão sincronizadas quando voltar online.`,
          { duration: 6000 }
        );
      } else {
        toast.error('Você está offline. Operações serão salvas e sincronizadas quando voltar online.', {
          duration: 5000,
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load queue on mount and attempt initial sync
  useEffect(() => {
    Promise.resolve().then(() => {
      loadQueue().then(() => {
        if (navigator.onLine) {
          syncQueue();
        }
      });
    });
  }, [loadQueue, syncQueue]);

  // Register background sync if supported
  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register a sync event for background sync
        if (queuedOperations.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (registration as any).sync.register('offline-sync').catch((error: unknown) => {
            console.warn('Background sync registration failed:', error);
          });
        }
      });
    }
  }, [queuedOperations.length]);

  // Listen for service worker photo sync messages
  useEffect(() => {
    const cleanup = listenToServiceWorkerMessages((message) => {
      if (message.type === 'PHOTO_SYNC_COMPLETE') {
        const { successCount, failedCount } = message;
        
        if (successCount > 0 && failedCount === 0) {
          toast.success(
            `${successCount} foto(s) sincronizada(s) com sucesso!`,
            { duration: 4000 }
          );
        } else if (successCount > 0 && failedCount > 0) {
          toast.error(
            `${successCount} foto(s) sincronizada(s), ${failedCount} falharam.`,
            { duration: 5000 }
          );
        } else if (failedCount > 0) {
          toast.error(
            `Erro ao sincronizar ${failedCount} foto(s). Tentaremos novamente.`,
            { duration: 5000 }
          );
        }
      }
    });

    return cleanup;
  }, []);

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        pendingCount: queuedOperations.length,
        queuedOperations,
        queueMutation,
        syncQueue,
        retryOperation,
        discardOperation,
        clearQueue,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
};
