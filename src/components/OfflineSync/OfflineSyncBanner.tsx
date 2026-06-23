/**
 * OfflineSyncBanner Component
 * 
 * Displays offline status banner with pending operations count.
 * 
 * **Validates: Requirement 9.3**
 * - THE PWA SHALL display a banner showing "Você está offline" with the number of pending operations
 * 
 * Usage:
 * ```tsx
 * import { OfflineSyncBanner } from './components/OfflineSync/OfflineSyncBanner';
 * 
 * function App() {
 *   return (
 *     <>
 *       <OfflineSyncBanner />
 *       {/* rest of app *\/}
 *     </>
 *   );
 * }
 * ```
 */

import React from 'react';
import { useOfflineSync } from '../../contexts/OfflineSyncContext';
import { WifiOff, RefreshCw, Trash2 } from 'lucide-react';

export const OfflineSyncBanner: React.FC = () => {
  const { isOnline, pendingCount, syncQueue } = useOfflineSync();

  // Don't show banner when online and no pending operations
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-sm ${
        isOnline
          ? 'bg-blue-500 text-white'
          : 'bg-yellow-500 text-gray-900'
      } shadow-md`}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>
            {isOnline
              ? `Você está online. ${pendingCount} operação(ões) pendente(s) de sincronização.`
              : `Você está offline. ${pendingCount} operação(ões) serão sincronizadas quando voltar online.`}
          </span>
        </div>
        
        {isOnline && pendingCount > 0 && (
          <button
            onClick={() => syncQueue()}
            className="flex items-center gap-1 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Sincronizar Agora
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * OfflineSyncManager Component
 * 
 * Provides UI for managing queued offline operations.
 * Allows users to manually retry or discard individual operations.
 * 
 * **Validates: Requirement 9.5**
 * - WHEN the operations list is visible, THE PWA SHALL allow the user to manually retry or discard individual queued operations
 */
export const OfflineSyncManager: React.FC = () => {
  const { queuedOperations, retryOperation, discardOperation, clearQueue, isOnline } = useOfflineSync();

  if (queuedOperations.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Nenhuma operação pendente de sincronização.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Operações Pendentes ({queuedOperations.length})
        </h3>
        <button
          onClick={() => {
            if (confirm(`Descartar todas as ${queuedOperations.length} operações pendentes?`)) {
              clearQueue();
            }
          }}
          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          Limpar Tudo
        </button>
      </div>

      <div className="space-y-2">
        {queuedOperations.map((operation) => (
          <div
            key={operation.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{operation.operation}</span>
                <span className="text-gray-500">→</span>
                <span className="text-gray-700">{operation.table}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(operation.timestamp).toLocaleString('pt-BR')}
                {operation.retries > 0 && (
                  <span className="ml-2 text-orange-600">
                    ({operation.retries} tentativa{operation.retries > 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOnline && (
                <button
                  onClick={() => retryOperation(operation.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Tentar novamente"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm('Descartar esta operação?')) {
                    discardOperation(operation.id);
                  }
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Descartar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
