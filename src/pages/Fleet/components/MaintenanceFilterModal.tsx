import React from 'react';
import { X, Filter, Check, Wrench, Truck, Clock, DollarSign, Calendar, User, Settings, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { DateInput } from '../../../components/Form/DateInput';


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
    <div className="tauze-sidebar-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="tauze-sidebar-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="tauze-sidebar-header">
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

        <div className="tauze-sidebar-body">
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Status da Ordem <Clock size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {statusOptions.map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#ed6c02' : 'hsl(var(--text-muted))', 
                    background: filters.status === s.id ? '#fff7ed' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#ed6c02' : 'hsl(var(--border))',
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

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Tipologia Mecânica <Settings size={14} /></label>
            <div className="tauze-tag-cloud">
              {maintenanceTypes.map(type => (
                <button 
                  key={type}
                  className={`tauze-tag-chip ${filters.types?.includes(type) ? 'active' : ''}`}
                  onClick={() => toggleType(type)}
                  style={{ 
                    borderColor: filters.types?.includes(type) ? '#ed6c02' : 'hsl(var(--border))', 
                    background: filters.types?.includes(type) ? '#ed6c02' : 'hsl(var(--bg-card))',
                    color: filters.types?.includes(type) ? 'white' : 'hsl(var(--text-muted))'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Custo TCO Acumulado <DollarSign size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: 'hsl(var(--bg-main))', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#ed6c02' }}>{filters.maxCost.toLocaleString('pt-BR')}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>Teto Orçamentário</span>
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

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Período de Intervenção <Calendar size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <DateInput 
                type="date" 
                className="tauze-input" 
                value={filters.dateStart}
                onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
                style={{ height: '40px', fontSize: '12px' }}
              />
              <DateInput 
                type="date" 
                className="tauze-input" 
                value={filters.dateEnd}
                onChange={e => setFilters({ ...filters, dateEnd: e.target.value })}
                style={{ height: '40px', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>

        <div className="tauze-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#ed6c02' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
