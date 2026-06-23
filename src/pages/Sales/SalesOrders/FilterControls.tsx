/**
 * FilterControls Component - Search, tabs, and filter controls for sales orders
 */

import React from 'react';
import { Search, Filter, FileText, List as ListIcon, LayoutGrid } from 'lucide-react';
import type { SalesFilterValues, SalesTabType } from './types';

interface FilterControlsProps {
  activeTab: SalesTabType;
  onTabChange: (tab: SalesTabType) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: 'list' | 'kanban';
  onViewModeChange: (mode: 'list' | 'kanban') => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  onExport,
}) => {
  return (
    <div className="tauze-controls-row">
      <div className="tauze-tab-group">
        <button
          className={`tauze-tab-item ${activeTab === 'OPEN' ? 'active' : ''}`}
          onClick={() => onTabChange('OPEN')}
        >
          Mapas Ativos
        </button>
        <button
          className={`tauze-tab-item ${activeTab === 'CLOSED' ? 'active' : ''}`}
          onClick={() => onTabChange('CLOSED')}
        >
          Encerrados
        </button>
      </div>

      <div className="tauze-search-wrapper">
        <Search size={18} className="s-icon" />
        <input
          type="text"
          className="tauze-search-input"
          placeholder="Pesquisar por número do pedido ou parceiro..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div
        className="view-mode-toggle"
        style={{
          display: 'flex',
          background: 'hsl(var(--bg-main))',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px',
          margin: '0 16px',
        }}
      >
        <button
          type="button"
          className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => onViewModeChange('list')}
          title="Visualização em Lista"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'list' ? 'hsl(var(--bg-card))' : 'transparent',
            color: viewMode === 'list' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
            cursor: 'pointer',
            boxShadow: viewMode === 'list' ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
            transition: '0.2s',
          }}
        >
          <ListIcon size={18} />
        </button>
        <button
          type="button"
          className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
          onClick={() => onViewModeChange('kanban')}
          title="Quadro Kanban"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'kanban' ? 'hsl(var(--bg-card))' : 'transparent',
            color: viewMode === 'kanban' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
            cursor: 'pointer',
            boxShadow: viewMode === 'kanban' ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
            transition: '0.2s',
          }}
        >
          <LayoutGrid size={18} />
        </button>
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
              const menu = document.getElementById('export-menu-sales');
              if (menu) menu.classList.toggle('active');
            }}
          >
            <FileText size={20} />
          </button>
          <div id="export-menu-sales" className="export-menu">
            <button
              onClick={() => {
                onExport('csv');
                document.getElementById('export-menu-sales')?.classList.remove('active');
              }}
            >
              Excel (.CSV)
            </button>
            <button
              onClick={() => {
                onExport('excel');
                document.getElementById('export-menu-sales')?.classList.remove('active');
              }}
            >
              Excel (.xlsx)
            </button>
            <button
              onClick={() => {
                onExport('pdf');
                document.getElementById('export-menu-sales')?.classList.remove('active');
              }}
            >
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
