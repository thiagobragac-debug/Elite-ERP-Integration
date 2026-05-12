import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
}

import { formatNumber } from '../../utils/format';

export function ModernTable<T extends { id: string | number }>({ 
  title,
  data, 
  columns, 
  onRowClick,
  onExport,
  actions,
  searchPlaceholder = "Buscar registros...",
  loading = false,
  hideHeader = false,
  selectable = false,
  isSelectable = () => true,
  selectedItems = [],
  onSelectionChange
}: ModernTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination when data changes to avoid empty pages
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handleToggleAll = () => {
    if (!onSelectionChange) return;
    const selectableItems = paginatedData.filter(item => isSelectable(item));
    if (selectedItems.length === selectableItems.length && selectableItems.length > 0) {
      onSelectionChange([]);
    } else {
      onSelectionChange(selectableItems.map(item => item.id));
    }
  };

  const handleToggleRow = (id: string | number) => {
    if (!onSelectionChange) return;
    const newSelection = selectedItems.includes(id)
      ? selectedItems.filter(item => item !== id)
      : [...selectedItems, id];
    onSelectionChange(newSelection);
  };

  const safeData = Array.isArray(data) ? data : [];
  const filteredData = safeData.filter(item => {
    if (!item) return false;
    return Object.values(item).some(val => 
      val !== null && val !== undefined && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const renderValue = (item: T, col: Column<T>) => {
    const rawValue = typeof col.accessor === 'function' 
      ? col.accessor(item) 
      : (item[col.accessor] as any);

    // If it's a number and not a special component, format it
    if (typeof rawValue === 'number') {
      return formatNumber(rawValue);
    }

    return rawValue;
  };

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
            <button className="icon-btn-secondary" title="Filtros Avançados"><Filter size={20} /></button>
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
                    checked={paginatedData.length > 0 && selectedItems.length === paginatedData.length}
                    onChange={handleToggleAll}
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th key={idx} style={{ width: col.width, textAlign: col.align || 'left' }}>
                  {col.header}
                </th>
              ))}
              {actions && <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="skeleton-row">
                    {columns.map((_, j) => <td key={j}><div className="skeleton-line"></div></td>)}
                    {actions && <td><div className="skeleton-line"></div></td>}
                  </tr>
                ))
              ) : paginatedData.map((item, idx) => (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                  onClick={() => onRowClick?.(item)}
                  className={`${onRowClick ? 'clickable' : ''} ${selectedItems.includes(item.id) ? 'selected' : ''}`}
                >
                  {selectable && (
                    <td onClick={(e) => { 
                      e.stopPropagation(); 
                      if (isSelectable(item)) handleToggleRow(item.id); 
                    }}>
                      {isSelectable(item) ? (
                        <input 
                          type="checkbox" 
                          checked={selectedItems.includes(item.id)}
                          onChange={() => {}} // Handled by td click
                        />
                      ) : (
                        <div style={{ width: '16px', height: '16px' }} />
                      )}
                    </td>
                  )}
                  {columns.map((col, j) => (
                    <td key={j} style={{ textAlign: col.align || 'left' }}>
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
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {!loading && paginatedData.length === 0 && (
          <div className="empty-state">
            <Search size={48} />
            <p>Nenhum registro encontrado para sua busca.</p>
          </div>
        )}
      </div>

      <div className="table-pagination">
        <span className="pagination-info">
          Mostrando <b>{filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</b>-<b>{Math.min(filteredData.length, currentPage * itemsPerPage)}</b> de <b>{filteredData.length}</b>
        </span>
        <div className="pagination-controls">
          <button 
            className="pagination-btn"
            disabled={currentPage === 1 || loading} 
            onClick={() => setCurrentPage(p => p - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="pages">
            {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(p => (
              <button 
                key={p} 
                className={`page-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
                disabled={loading}
              >
                {p}
              </button>
            ))}
          </div>
          <button 
            className="pagination-btn"
            disabled={currentPage === totalPages || totalPages === 0 || loading} 
            onClick={() => setCurrentPage(p => p + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
