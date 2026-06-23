import { useState, useCallback } from 'react';

export interface PaginationResult {
  page: number;
  pageSize: number;
  totalCount: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalCount: (total: number) => void;
  getRange: () => { from: number; to: number };
}

export function useServerPagination(initialPageSize = 50): PaginationResult {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);

  const getRange = useCallback(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  }, [page, pageSize]);

  return {
    page,
    pageSize,
    totalCount,
    setPage,
    setPageSize,
    setTotalCount,
    getRange,
  };
}
