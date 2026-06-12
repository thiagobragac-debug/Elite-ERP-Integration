import React from 'react';
import { X, Filter, Check, Users, Scale, TrendingUp, Calendar, Clock, DollarSign, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { DateInput } from '../../../components/Form/DateInput';


interface RomaneioFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const RomaneioFilterModal: React.FC<RomaneioFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const statusOptions = [
    { id: 'all', label: 'Todos' },
    { id: 'Concluído', label: 'Concluído' },
    { id: 'Em Trânsito', label: 'Em Trânsito' },
    { id: 'Pendente', label: 'Pendente' },
    { id: 'Cancelado', label: 'Cancelado' }
  ];

  const handleClear = () => {
    setFilters({
      status: 'all',
      dateStart: '',
      dateEnd: '',
      minAnimais: '',
      maxAnimais: '',
      minValor: '',
      maxValor: ''
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
            <div className="icon-wrapper primary" style={{ background: 'hsl(var(--brand)/0.1)', padding: '10px', borderRadius: '12px', color: 'hsl(var(--brand))' }}>
              <Truck size={20} />
            </div>
            <div>
              <h3>Filtros de Romaneios</h3>
              <p>Refine a busca de lotes despachados.</p>
            </div>
          </div>
          <button 
            className="icon-btn-secondary"
            style={{ padding: '8px' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="tauze-sidebar-body">
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Status do Embarque <Clock size={14} /></label>
            <div className="tauze-tag-cloud">
              {statusOptions.map(s => (
                <button 
                  key={s.id}
                  className={`tauze-tag-chip ${filters.status === s.id ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, status: s.id })}
                >
                  {s.label}
                  {filters.status === s.id && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Volume de Animais (cbç) <Users size={14} /></label>
            <div className="date-range-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input 
                type="number" 
                placeholder="Mínimo"
                className="tauze-input" 
                value={filters.minAnimais}
                onChange={e => setFilters({ ...filters, minAnimais: e.target.value })}
              />
              <input 
                type="number" 
                placeholder="Máximo"
                className="tauze-input" 
                value={filters.maxAnimais}
                onChange={e => setFilters({ ...filters, maxAnimais: e.target.value })}
              />
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Valor Estimado (R$) <DollarSign size={14} /></label>
            <div className="date-range-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input 
                type="number" 
                placeholder="Mínimo"
                className="tauze-input" 
                value={filters.minValor}
                onChange={e => setFilters({ ...filters, minValor: e.target.value })}
              />
              <input 
                type="number" 
                placeholder="Máximo"
                className="tauze-input" 
                value={filters.maxValor}
                onChange={e => setFilters({ ...filters, maxValor: e.target.value })}
              />
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">Data de Embarque <Calendar size={14} /></label>
            <div className="date-range-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <DateInput 
                type="date" 
                className="tauze-input" 
                value={filters.dateStart}
                onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
              />
              <DateInput 
                type="date" 
                className="tauze-input" 
                value={filters.dateEnd}
                onChange={e => setFilters({ ...filters, dateEnd: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="tauze-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1 }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
