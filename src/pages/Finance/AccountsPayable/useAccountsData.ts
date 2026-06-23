/**
 * Hook for fetching and managing accounts payable data
 */

import { useState } from 'react';
import { useReportData } from '../../../hooks/useReportData';
import { useDebounce } from '../../../hooks/useDebounce';
import type { Account, FilterValues, TabType } from './types';

interface UseAccountsDataParams {
  activeTab: TabType;
  searchTerm: string;
  filterValues: FilterValues;
}

export function useAccountsData({ activeTab, searchTerm, filterValues }: UseAccountsDataParams) {
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: rawBills,
    stats,
    totalCount,
    loading,
    error,
    refresh,
  } = useReportData('contas-pagar', {
    page,
    pageSize,
    filters: {
      ...filterValues,
      status: activeTab,
      search: debouncedSearch,
    },
  });

  const bills = (rawBills || []) as unknown as Account[];

  return {
    bills,
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
