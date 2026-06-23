import React, { useState, useRef } from 'react';
import { FileText } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

interface ExportDropdownProps {
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
  className?: string;
  tooltip?: string;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({ 
  onExport, 
  className = 'icon-btn-secondary',
  tooltip = 'Exportar'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const handleExportClick = (format: 'csv' | 'excel' | 'pdf') => {
    onExport(format);
    setIsOpen(false);
  };

  return (
    <div className="export-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className={`${className} ${isOpen ? 'active' : ''}`}
        title={tooltip}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FileText size={20} />
      </button>
      
      {isOpen && (
        <div 
          className="export-menu active" 
          style={{ 
            display: 'flex', 
            position: 'absolute', 
            top: 'calc(100% + 8px)', 
            right: 0,
            zIndex: 50,
            animation: 'fadeIn 0.2s ease-out forwards'
          }}
        >
          <button onClick={() => handleExportClick('csv')}>
            Excel (.CSV)
          </button>
          <button onClick={() => handleExportClick('excel')}>
            Excel (.xlsx)
          </button>
          <button onClick={() => handleExportClick('pdf')}>
            PDF
          </button>
        </div>
      )}
    </div>
  );
};
