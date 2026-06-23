import React from 'react';
import { X, Filter, Check, Droplets, Truck, Clock, DollarSign, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { DateInput } from '../../../components/Form/DateInput';

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
  setFilters,
}) => {
  if (!isOpen) {
    return null;
  }

  const fuelTypes = ['Diesel S10', 'Diesel S500', 'Gasolina', 'Etanol', 'Arla 32'];
  const statusOptions = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'efficient', label: 'Alta Eficiência', icon: Droplets },
    { id: 'high-consumption', label: 'Alto Consumo', icon: AlertTriangle },
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
      dateEnd: '',
    });
  };

  return createPortal(
    <div
      className="tauze-sidebar-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="tauze-sidebar-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tauze-sidebar-header">
          <div
            className="header-content"
            style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
          >
            <div
              className="icon-wrapper primary"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '10px',
                borderRadius: '12px',
                color: '#10b981',
              }}
            >
              <Droplets size={20} />
            </div>
            <div>
              <h3>Filtros de Abastecimento</h3>
              <p>Analise consumo e performance energética.</p>
            </div>
          </div>
          <button
            style={{
              color: '#94a3b8',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
            }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="tauze-sidebar-body">
          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Perfil de Eficiência <Clock size={14} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {statusOptions.map((s) => (
                <button
                  key={s.id}
                  style={{
                    padding: '12px 16px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: filters.status === s.id ? '#10b981' : 'hsl(var(--text-muted))',
                    background: filters.status === s.id ? '#f0fdf4' : 'transparent',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#10b981' : 'hsl(var(--border))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                  onClick={() => setFilters({ ...filters, status: s.id })}
                >
                  <s.icon size={14} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Tipos de Combustível <Check size={14} />
            </label>
            <div className="tauze-tag-cloud">
              {fuelTypes.map((type) => (
                <button
                  key={type}
                  className={`tauze-tag-chip ${filters.fuelTypes?.includes(type) ? 'active' : ''}`}
                  onClick={() => toggleFuelType(type)}
                  style={{
                    borderColor: filters.fuelTypes?.includes(type)
                      ? '#10b981'
                      : 'hsl(var(--border))',
                    background: filters.fuelTypes?.includes(type)
                      ? '#10b981'
                      : 'hsl(var(--bg-card))',
                    color: filters.fuelTypes?.includes(type) ? 'white' : 'hsl(var(--text-muted))',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Volume Abastecido (L) <DollarSign size={14} />
            </label>
            <div
              className="integrity-slider-container"
              style={{ padding: '20px', background: 'hsl(var(--bg-main))', borderRadius: '16px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#10b981' }}>
                  {filters.maxLiters}
                </span>
                <span
                  style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}
                >
                  Capacidade Máx (L)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={filters.maxLiters}
                onChange={(e) => setFilters({ ...filters, maxLiters: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#10b981', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Período de Telemetria <Calendar size={14} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <DateInput
                type="date"
                className="tauze-input"
                value={filters.dateStart}
                onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
                style={{ height: '40px', fontSize: '12px' }}
              />
              <DateInput
                type="date"
                className="tauze-input"
                value={filters.dateEnd}
                onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
                style={{ height: '40px', fontSize: '12px' }}
              />
            </div>
          </div>
        </div>

        <div className="tauze-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>
            LIMPAR
          </button>
          <button
            className="primary-btn"
            style={{ flex: 1, background: '#10b981' }}
            onClick={onClose}
          >
            APLICAR
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

const AlertTriangle = ({ size }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);
