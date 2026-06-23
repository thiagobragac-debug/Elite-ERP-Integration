import React from 'react';
import {
  X,
  Filter,
  Check,
  Building2,
  Clock,
  Target,
  Scale,
  DollarSign,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ConfinementFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const ConfinementFilterModal: React.FC<ConfinementFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
}) => {
  if (!isOpen) {
    return null;
  }

  const statusOptions = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'ENGORDA', label: 'Engorda', icon: Activity },
    { id: 'TERMINACAO', label: 'Terminação (> 90% DOF)', icon: Target },
    { id: 'CHECKOUT', label: 'Pronto para Saída', icon: Scale },
  ];

  const handleClear = () => {
    setFilters({
      status: 'all',
      minDOF: 0,
      maxDOF: 150,
      minWeight: 0,
      maxWeight: 800,
      maxCPD: 25,
      onlyActive: true,
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
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '10px',
                borderRadius: '12px',
                color: '#3b82f6',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h3>Filtros Confinamento</h3>
              <p>Otimize a terminação e DOF.</p>
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
              Fase do Ciclo <Target size={14} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {statusOptions.map((s) => (
                <button
                  key={s.id}
                  style={{
                    padding: '14px 16px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: filters.status === s.id ? 'white' : 'hsl(var(--text-muted))',
                    background: filters.status === s.id ? '#3b82f6' : 'hsl(var(--bg-card))',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#3b82f6' : 'hsl(var(--border))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => setFilters({ ...filters, status: s.id })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <s.icon size={14} />
                    <span>{s.label}</span>
                  </div>
                  {filters.status === s.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Dias de Cocho (DOF) <Clock size={14} />
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
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#3b82f6' }}>
                  {filters.minDOF} a {filters.maxDOF} d
                </span>
                <span
                  style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}
                >
                  Janela de Dias
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="5"
                value={filters.minDOF}
                onChange={(e) => setFilters({ ...filters, minDOF: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#3b82f6', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Custo / Cabeça / Dia (CPD) <DollarSign size={14} />
            </label>
            <div
              style={{
                padding: '16px',
                background: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                  Teto de Gasto Diario
                </span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#2563eb' }}>
                  R$ {filters.maxCPD.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={filters.maxCPD}
                onChange={(e) => setFilters({ ...filters, maxCPD: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#2563eb', height: '4px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="tauze-filter-section">
            <label className="tauze-filter-label">
              Peso Projetado (kg) <TrendingUp size={14} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="tauze-field">
                <input
                  type="number"
                  className="tauze-input"
                  placeholder="Min"
                  value={filters.minWeight}
                  onChange={(e) => setFilters({ ...filters, minWeight: parseInt(e.target.value) })}
                />
              </div>
              <div className="tauze-field">
                <input
                  type="number"
                  className="tauze-input"
                  placeholder="Max"
                  value={filters.maxWeight}
                  onChange={(e) => setFilters({ ...filters, maxWeight: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div
            className="tauze-filter-section"
            style={{
              background: 'rgba(16, 185, 129, 0.05)',
              padding: '16px',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#10b981' }}>
                  <Activity size={18} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                  Apenas Ciclos Ativos
                </span>
              </div>
              <input
                type="checkbox"
                checked={filters.onlyActive}
                onChange={(e) => setFilters({ ...filters, onlyActive: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
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
            style={{ flex: 1, background: '#3b82f6' }}
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
