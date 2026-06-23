import React, { useState } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import './ModernTable.css';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface ModernTableProps<T> {
  title?: string;
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  onExport?: () => void;
  actions?: (item: T) => React.ReactNode;
  searchPlaceholder?: string;
  loading?: boolean;
  hideHeader?: boolean;
  selectable?: boolean;
  isSelectable?: (item: T) => boolean;
  selectedItems?: (string | number)[];
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  // Server-side pagination support
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  onlyPagination?: boolean;
  emptyState?: React.ReactNode;
}

import { EmptyState } from '../Feedback/EmptyState';
import { formatNumber } from '../../utils/format';

function ModernTableComponent<T extends { id: string | number }>({
  title: _title,
  data,
  columns,
  onRowClick,
  onExport,
  actions,
  searchPlaceholder = 'Buscar registros...',
  loading = false,
  hideHeader = true,
  selectable = false,
  isSelectable = () => true,
  selectedItems = [],
  onSelectionChange,
  totalCount,
  currentPage: externalPage,
  onPageChange,
  itemsPerPage = 10,
  onlyPagination = false,
  emptyState,
}: ModernTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [internalPage, setInternalPage] = useState(1);

  const currentPage = externalPage ?? internalPage;
  const setCurrentPage = onPageChange ?? setInternalPage;

  // Reset internal pagination when search term changes
  React.useEffect(() => {
    if (!onPageChange) {
      setInternalPage(1);
    }
  }, [searchTerm, onPageChange]);

  const safeData = Array.isArray(data) ? data : [];

  // Only filter client-side if we are NOT using server-side pagination
  const filteredData = React.useMemo(() => {
    if (onPageChange) {
      return safeData;
    }
    return safeData.filter((item) => {
      if (!item) {
        return false;
      }
      const lowerSearch = searchTerm.toLowerCase();
      return Object.values(item).some(
        (val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch)
      );
    });
  }, [safeData, searchTerm, onPageChange]);

  const effectiveTotal = totalCount ?? filteredData.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / itemsPerPage));

  const paginatedData = onPageChange
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleToggleAll = () => {
    if (!onSelectionChange) {
      return;
    }
    const selectableItems = paginatedData.filter((item) => isSelectable(item));
    if (selectedItems.length === selectableItems.length && selectableItems.length > 0) {
      onSelectionChange([]);
    } else {
      onSelectionChange(selectableItems.map((item) => item.id));
    }
  };

  const handleToggleRow = (id: string | number) => {
    if (!onSelectionChange) {
      return;
    }
    const newSelection = selectedItems.includes(id)
      ? selectedItems.filter((item) => item !== id)
      : [...selectedItems, id];
    onSelectionChange(newSelection);
  };

  const renderValue = (item: T, col: Column<T>) => {
    const rawValue =
      typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as any);

    if (typeof rawValue === 'number') {
      return formatNumber(rawValue);
    }
    return rawValue;
  };

  if (onlyPagination) {
    return (
      <div
        className="modern-table-container animate-slide-up"
        style={{ background: 'transparent', boxShadow: 'none', padding: 0, border: 'none' }}
      >
        <div className="table-pagination" style={{ border: 'none', padding: 0 }}>
          <span className="pagination-info">
            Mostrando <b>{effectiveTotal > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</b>-
            <b>{Math.min(effectiveTotal, currentPage * itemsPerPage)}</b> de <b>{effectiveTotal}</b>
          </span>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="pages">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    className={`page-btn ${currentPage === p ? 'active' : ''}`}
                    onClick={() => setCurrentPage(p)}
                    disabled={loading}
                  >
                    {p}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="dots">...</span>}
              {totalPages > 5 && (
                <button
                  className={`page-btn ${currentPage === totalPages ? 'active' : ''}`}
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={loading}
                >
                  {totalPages}
                </button>
              )}
            </div>
            <button
              className="pagination-btn"
              disabled={currentPage === totalPages || totalPages === 0 || loading}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-table-container animate-slide-up">
      {!hideHeader && (
        <div className="table-header-row">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="table-actions">
            <button className="icon-btn-secondary" title="Filtros Avançados">
              <Filter size={20} />
            </button>
            {onExport && (
              <button className="icon-btn-secondary" title="Exportar para Excel" onClick={onExport}>
                <Download size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={
                      paginatedData.length > 0 && selectedItems.length === paginatedData.length
                    }
                    onChange={handleToggleAll}
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`align-${col.align || 'left'}`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
              {actions && <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(itemsPerPage)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={`skeleton-${i}`} className="skeleton-row">
                      {columns.map((_, j) => (
                        <td key={j}>
                          <div className="skeleton-line" />
                        </td>
                      ))}
                      {actions && (
                        <td>
                          <div className="skeleton-line" />
                        </td>
                      )}
                    </tr>
                  ))
              : paginatedData.map((item, _idx) => (
                  <tr
                    key={item.id}
                    onClick={() => onRowClick?.(item)}
                    className={`${onRowClick ? 'clickable' : ''} ${selectedItems.includes(item.id) ? 'selected' : ''}`}
                  >
                    {selectable && (
                      <td
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelectable(item)) {
                            handleToggleRow(item.id);
                          }
                        }}
                      >
                        {isSelectable(item) ? (
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => {}}
                          />
                        ) : (
                          <div style={{ width: '16px', height: '16px' }} />
                        )}
                      </td>
                    )}
                    {columns.map((col, j) => (
                      <td key={j} className={`align-${col.align || 'left'}`}>
                        {renderValue(item, col)}
                      </td>
                    ))}
                    {actions && (
                      <td className="actions-cell">
                        <div className="actions-wrapper" onClick={(e) => e.stopPropagation()}>
                          {actions(item)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading &&
          paginatedData.length === 0 &&
          (emptyState ? (
            emptyState
          ) : (
            <div style={{ padding: '40px 0' }}>
              <EmptyState
                icon={Search}
                title="Nenhum registro encontrado"
                description={
                  searchTerm
                    ? 'Tente ajustar seus filtros de busca para encontrar o que procura.'
                    : 'Ainda não há dados disponíveis para exibição.'
                }
              />
            </div>
          ))}
      </div>

      <div className="table-pagination">
        <span className="pagination-info">
          Mostrando <b>{effectiveTotal > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</b>-
          <b>{Math.min(effectiveTotal, currentPage * itemsPerPage)}</b> de <b>{effectiveTotal}</b>
        </span>
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="pages">
            {/* Generate a limited page range if many pages exist */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  className={`page-btn ${currentPage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                  disabled={loading}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 5 && <span className="dots">...</span>}
            {totalPages > 5 && (
              <button
                className={`page-btn ${currentPage === totalPages ? 'active' : ''}`}
                onClick={() => setCurrentPage(totalPages)}
                disabled={loading}
              >
                {totalPages}
              </button>
            )}
          </div>
          <button
            className="pagination-btn"
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export const ModernTable = React.memo(ModernTableComponent) as <T extends { id: string | number }>(
  props: ModernTableProps<T>
) => React.ReactElement;
