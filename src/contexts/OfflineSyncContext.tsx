import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { get, set } from 'idb-keyval';
import { supabase } from '../lib/supabase';

interface OfflineSyncContextType {
  isOnline: boolean;
  queueMutation: (table: string, payload: any, operation?: 'INSERT' | 'UPDATE' | 'DELETE') => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({ 
  isOnline: true,
  queueMutation: async () => {} 
});

export const useOfflineSync = () => useContext(OfflineSyncContext);

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const syncQueue = async () => {
    try {
      const queue: any[] = (await get('offline_mutation_queue')) || [];
      if (queue.length === 0) return;

      toast.loading('Sincronizando dados offline...', { id: 'offline-sync' });

      for (const item of queue) {
        if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
          await supabase.from(item.table).upsert(item.payload);
        } else if (item.operation === 'DELETE') {
          await supabase.from(item.table).delete().match(item.payload);
        }
      }

      await set('offline_mutation_queue', []);
      toast.success('Sincronização offline concluída!', { id: 'offline-sync' });
    } catch (error) {
      console.error('Failed to sync offline data', error);
      toast.error('Erro ao sincronizar dados offline. Tentaremos novamente depois.', { id: 'offline-sync' });
    }
  };

  const queueMutation = async (table: string, payload: any, operation: 'INSERT' | 'UPDATE' | 'DELETE' = 'UPSERT' as any) => {
    if (isOnline) {
      // If online, bypass queue and execute directly
      if (operation === 'DELETE') {
        await supabase.from(table).delete().match(payload);
      } else {
        await supabase.from(table).upsert(payload);
      }
      return;
    }

    // Save to IndexedDB
    const queue = (await get('offline_mutation_queue')) || [];
    queue.push({ table, payload, operation, timestamp: new Date().toISOString() });
    await set('offline_mutation_queue', queue);
    
    toast.success('Ação salva offline. Será sincronizada assim que a rede voltar.');
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restabelecida. Sincronizando dados...', { duration: 4000 });
      syncQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Você está offline. O sistema entrou em modo agritech.', { duration: 5000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if loaded with pending items
    if (navigator.onLine) {
      syncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <OfflineSyncContext.Provider value={{ isOnline, queueMutation }}>
      {children}
    </OfflineSyncContext.Provider>
  );
};
