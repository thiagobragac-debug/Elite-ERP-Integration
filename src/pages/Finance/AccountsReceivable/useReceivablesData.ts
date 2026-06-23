/**
 * Hook for fetching and managing accounts receivable data
 */

import { useState } from 'react';
import { useReportData } from '../../../hooks/useReportData';
import { useDebounce } from '../../../hooks/useDebounce';
import type { Receivable, FilterValues, TabType } from './types';

interface UseReceivablesDataParams {
  activeTab: TabType;
  searchTerm: string;
  filterValues: FilterValues;
}

export function useReceivablesData({
  activeTab,
  searchTerm,
  filterValues,
}: UseReceivablesDataParams) {
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: rawInvoices,
    stats,
    totalCount,
    loading,
    error,
    refresh,
  } = useReportData('contas-receber', {
    page,
    pageSize,
    filters: {
      ...filterValues,
      status: activeTab,
      search: debouncedSearch,
    },
  });

  const invoices = (rawInvoices || []) as unknown as Receivable[];

  return {
    invoices,
    stats,
    totalCount,
    loading,
    error,
    refresh,
    page,
    setPage,
    pageSize,
  };
}
