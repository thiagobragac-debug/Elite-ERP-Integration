import React from 'react';
import { X, Filter, Check, Wrench, Truck, Clock, DollarSign, Calendar, User, Settings, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface MaintenanceFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const MaintenanceFilterModal: React.FC<MaintenanceFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const maintenanceTypes = ['Preventiva', 'Corretiva', 'Preditiva', 'Revisão', 'Pneus', 'Lubrificação'];
  const statusOptions = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'open', label: 'Pendentes', icon: Clock },
    { id: 'in_progress', label: 'Em Oficina', icon: Settings },
    { id: 'completed', label: 'Concluídas', icon: Check }
  ];

  const toggleType = (type: string) => {
    const newTypes = filters.types?.includes(type)
      ? filters.types.filter((t: string) => t !== type)
      : [...(filters.types || []), type];
    setFilters({ ...filters, types: newTypes });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      types: [],
      maxCost: 50000,
      dateStart: '',
      dateEnd: '',
      onlyHighCost: false
    });
  };

  return createPortal(
    <div className="elite-sidebar-overlay" onClick={onClose}>
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="elite-sidebar-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="elite-sidebar-header">
          <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-wrapper primary" style={{ background: 'rgba(237, 108, 2, 0.1)', padding: '10px', borderRadius: '12px', color: '#ed6c02' }}>
              <Wrench size={20} />
            </div>
            <div>
              <h3>Filtros de Manutenção</h3>
              <p>Rastreabilidade de intervenções técnicas.</p>
            </div>
          </div>
          <button 
            style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="elite-sidebar-body">
          <div className="elite-filter-section">
            <label className="elite-filter-label">Status da Ordem <Clock size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {statusOptions.map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#ed6c02' : '#64748b', 
                    background: filters.status === s.id ? '#fff7ed' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#ed6c02' : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => setFilters({ ...filters, status: s.id })}
                >
                  <s.icon size={12} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Tipologia Mecânica <Settings size={14} /></label>
            <div className="elite-tag-cloud">
              {maintenanceTypes.map(type => (
                <button 
                  key={type}
                  className={`elite-tag-chip ${filters.types?.includes(type) ? 'active' : ''}`}
                  onClick={() => toggleType(type)}
                  style={{ 
                    borderColor: filters.types?.includes(type) ? '#ed6c02' : '#e2e8f0', 
                    background: filters.types?.includes(type) ? '#ed6c02' : 'white',
                    color: filters.types?.includes(type) ? 'white' : '#64748b'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Custo TCO Acumulado <DollarSign size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#ed6c02' }}>{filters.maxCost.toLocaleString('pt-BR')}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Teto Orçamentário</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="50000" 
                step="1000"
                value={filters.maxCost}
                onChange={e => setFilters({ ...filters, maxCost: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#ed6c02', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Período de Intervenção <Calendar size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input 
                type="date" 
                className="elite-input" 
                value={filters.dateStart}
                onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
                style={{ height: '40px', fontSize: '12px' }}
              />
              <input 
                type="date" 
                className="elite-input" 
                value={filters.dateEnd}
                onChange={e => setFilters({ ...filters, dateEnd: e.target.value })}
                style={{ height: '40px', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#ed6c02' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
