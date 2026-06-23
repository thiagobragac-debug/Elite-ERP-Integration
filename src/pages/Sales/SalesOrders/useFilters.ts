/**
 * Hook for managing filters and search state
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePersistentState } from '../../../hooks/usePersistentState';
import type { SalesFilterValues, SalesTabType } from './types';

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as SalesTabType) || 'OPEN';

  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'SalesOrders_showAdvancedFilters',
    false
  );

  const [filterValues, setFilterValues] = useState<SalesFilterValues>({
    status: 'all',
    clientTypes: [],
    minMargin: 0,
    maxMargin: 100,
    dateStart: '',
    dateEnd: '',
    onlyHighRisk: false,
    missingGta: false,
  });

  const handleTabChange = (tab: SalesTabType) => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set('tab', tab);
        return n;
      },
      { replace: true }
    );
  };

  return {
    activeTab,
    searchTerm,
    setSearchTerm,
    showAdvancedFilters,
    setShowAdvancedFilters,
    filterValues,
    setFilterValues,
    handleTabChange,
  };
}
