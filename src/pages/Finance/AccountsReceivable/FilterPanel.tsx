/**
 * Filter panel for accounts receivable
 */

import React from 'react';
import { Search, Filter, FileText } from 'lucide-react';
import { ReceivableFilterModal } from '../components/ReceivableFilterModal';
import type { FilterValues, TabType } from './types';

interface FilterPanelProps {
  activeTab: TabType;
  onTabChange: (tab: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  filterValues: FilterValues;
  onFilterValuesChange: (values: FilterValues) => void;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
}

export function FilterPanel({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  filterValues,
  onFilterValuesChange,
  onExport,
}: FilterPanelProps) {
  return (
    <>
      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button
            className={`tauze-tab-item ${activeTab === 'TODAS' ? 'active' : ''}`}
            onClick={() => onTabChange('TODAS')}
          >
            Todas Receitas
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'PENDENTE' ? 'active' : ''}`}
            onClick={() => onTabChange('PENDENTE')}
          >
            Pendentes
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'RECEBIDO' ? 'active' : ''}`}
            onClick={() => onTabChange('RECEBIDO')}
          >
            Recebidas
          </button>
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Filtrar por descrição ou parceiro..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="tauze-filter-group">
          <button
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={onToggleAdvancedFilters}
          >
            <Filter size={20} />
          </button>
          <div className="export-dropdown-container">
            <button
              className="icon-btn-secondary"
              title="Exportar"
              onClick={() => {
                const menu = document.getElementById('export-menu-receivable');
                if (menu) menu.classList.toggle('active');
              }}
            >
              <FileText size={20} />
            </button>
            <div id="export-menu-receivable" className="export-menu">
              <button
                onClick={() => {
                  onExport('csv');
                  document.getElementById('export-menu-receivable')?.classList.remove('active');
                }}
              >
                Excel (.CSV)
              </button>
              <button
                onClick={() => {
                  onExport('excel');
                  document.getElementById('export-menu-receivable')?.classList.remove('active');
                }}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  onExport('pdf');
                  document.getElementById('export-menu-receivable')?.classList.remove('active');
                }}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReceivableFilterModal
        isOpen={showAdvancedFilters}
        onClose={onToggleAdvancedFilters}
        filters={filterValues}
        setFilters={onFilterValuesChange}
      />
    </>
  );
}
