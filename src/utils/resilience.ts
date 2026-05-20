import { AlertCircle } from 'lucide-react';
import type { ReportData } from '../types/reports';

/**
 * Padrão Diamond Precision 5.0 de Resiliência de Rede
 * Implementa Promise.race com timeout de 3s e fallback para dados mockados em caso de latência.
 */

export const withTimeoutResilience = async (
  fetchPromise: Promise<ReportData>,
  mockFallback: ReportData,
  timeoutMs: number = 30000
): Promise<ReportData> => {
  const timeoutPromise = new Promise<ReportData>((_, reject) =>
    setTimeout(() => {
      console.warn(`[Resilience] Timeout de ${timeoutMs}ms atingido.`);
      reject(new Error('TIMEOUT'));
    }, timeoutMs)
  );

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err: any) {
    if (err.message === 'TIMEOUT') {
      return {
        ...mockFallback,
        error: 'O servidor demorou muito para responder. Por favor, tente novamente.'
      };
    }
    throw err;
  }
};

export const getGenericMockData = (_reportId: string): ReportData => {
  return {
    data: [],
    stats: [],
    columns: [],
    loading: false,
    error: 'Não foi possível carregar os dados no tempo hábil.'
  };
};
