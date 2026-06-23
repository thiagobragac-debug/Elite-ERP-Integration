/**
 * Hook for managing filter state and URL synchronization
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePersistentState } from '../../../hooks/usePersistentState';
import type { FilterValues, TabType } from './types';

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'TODAS';

  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'AccountsReceivable_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = useState<FilterValues>({
    status: 'all',
    minAmount: 0,
    maxAmount: 1000000,
    dateStart: '',
    dateEnd: '',
  });

  const handleTabChange = (tab: string, callback?: () => void) => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set('tab', tab);
        return n;
      },
      { replace: true }
    );
    if (callback) callback();
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
