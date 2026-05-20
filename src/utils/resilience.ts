import { AlertCircle } from 'lucide-react';
import type { ReportData } from '../types/reports';

/**
 * Padrão Diamond Precision 5.0 de Resiliência de Rede
 * Implementa Promise.race com timeout de 3s e fallback para dados mockados em caso de latência.
 */

export const withTimeoutResilience = async (
  fetchPromise: Promise<ReportData>,
  mockFallback: ReportData,
  timeoutMs: number = 3000
): Promise<ReportData> => {
  const timeoutPromise = new Promise<ReportData>((_, reject) =>
    setTimeout(() => {
      console.warn(`[Resilience] Timeout de ${timeoutMs}ms atingido. Ativando fallback resiliente.`);
      reject(new Error('TIMEOUT'));
    }, timeoutMs)
  );

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err: any) {
    if (err.message === 'TIMEOUT') {
      return {
        ...mockFallback,
        error: 'Conexão instável. Exibindo dados de contingência.'
      };
    }
    throw err;
  }
};

export const getGenericMockData = (_reportId: string): ReportData => {
  return {
    data: [],
    stats: [
      { label: 'Status', value: 'Offline', change: '0%', trend: 'neutral', icon: AlertCircle, color: '#94a3b8' },
      { label: 'Modo', value: 'Contingência', change: 'Ativo', trend: 'neutral', icon: AlertCircle, color: '#94a3b8' }
    ],
    columns: [],
    loading: false,
    error: 'Modo de contingência ativado.'
  };
};
