import React from 'react';
import { X, Filter, Check, Droplets, Truck, Clock, DollarSign, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface FuelFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const FuelFilterModal: React.FC<FuelFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const fuelTypes = ['Diesel S10', 'Diesel S500', 'Gasolina', 'Etanol', 'Arla 32'];
  const statusOptions = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'efficient', label: 'Alta Eficiência', icon: Droplets },
    { id: 'high-consumption', label: 'Alto Consumo', icon: AlertTriangle }
  ];

  const toggleFuelType = (type: string) => {
    const newTypes = filters.fuelTypes?.includes(type)
      ? filters.fuelTypes.filter((t: string) => t !== type)
      : [...(filters.fuelTypes || []), type];
    setFilters({ ...filters, fuelTypes: newTypes });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      fuelTypes: [],
      minLiters: 0,
      maxLiters: 1000,
      dateStart: '',
      dateEnd: ''
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: '#10b981' }}>
              <Droplets size={20} />
            </div>
            <div>
              <h3>Filtros de Abastecimento</h3>
              <p>Analise consumo e performance energética.</p>
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
            <label className="elite-filter-label">Perfil de Eficiência <Clock size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {statusOptions.map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#10b981' : '#64748b', 
                    background: filters.status === s.id ? '#f0fdf4' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#10b981' : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onClick={() => setFilters({ ...filters, status: s.id })}
                >
                  <s.icon size={14} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Tipos de Combustível <Check size={14} /></label>
            <div className="elite-tag-cloud">
              {fuelTypes.map(type => (
                <button 
                  key={type}
                  className={`elite-tag-chip ${filters.fuelTypes?.includes(type) ? 'active' : ''}`}
                  onClick={() => toggleFuelType(type)}
                  style={{ 
                    borderColor: filters.fuelTypes?.includes(type) ? '#10b981' : '#e2e8f0', 
                    background: filters.fuelTypes?.includes(type) ? '#10b981' : 'white',
                    color: filters.fuelTypes?.includes(type) ? 'white' : '#64748b'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Volume Abastecido (L) <DollarSign size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#10b981' }}>{filters.maxLiters}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Capacidade Máx (L)</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000" 
                step="50"
                value={filters.maxLiters}
                onChange={e => setFilters({ ...filters, maxLiters: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#10b981', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Período de Telemetria <Calendar size={14} /></label>
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
          <button className="primary-btn" style={{ flex: 1, background: '#10b981' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

const AlertTriangle = ({ size }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);
