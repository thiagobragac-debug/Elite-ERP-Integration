/**
 * Hook for managing filter state and logic
 */

import { useState } from 'react';
import { usePersistentState } from '../../../hooks/usePersistentState';
import type { FilterValues, TabType } from './types';

export function useFilters() {
  const [activeTab, setActiveTab] = useState<TabType>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState(
    'AccountsPayable_showAdvancedFilters',
    false
  );
  const [filterValues, setFilterValues] = useState<FilterValues>({
    status: 'all',
    minAmount: 0,
    maxAmount: 1000000,
    dateStart: '',
    dateEnd: '',
  });

  const handleTabChange = (tab: TabType, resetPage: () => void) => {
    setActiveTab(tab);
    resetPage();
  };

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    showAdvancedFilters,
    setShowAdvancedFilters,
    filterValues,
    setFilterValues,
    handleTabChange,
  };
}
