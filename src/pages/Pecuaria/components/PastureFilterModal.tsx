import React from 'react';
import { X, Filter, Check, Trees, Maximize, Activity, Calendar, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface PastureFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const PastureFilterModal: React.FC<PastureFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const statusOptions = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'occupied', label: 'Ocupado', icon: Activity },
    { id: 'resting', label: 'Descanso', icon: Trees },
    { id: 'free', label: 'Vazio', icon: Check }
  ];

  const capins = ['Brachiaria brizantha', 'Brachiaria decumbens', 'Mombaça', 'Zuri', 'Quênia', 'Tifton 85', 'Estrela'];

  const toggleCapim = (capim: string) => {
    const newCapins = filters.capins?.includes(capim)
      ? filters.capins.filter((c: string) => c !== capim)
      : [...(filters.capins || []), capim];
    setFilters({ ...filters, capins: newCapins });
  };

  const handleClear = () => {
    setFilters({
      status: 'all',
      capins: [],
      minArea: 0,
      maxArea: 500,
      minUA: 0,
      maxUA: 100,
      needsFertilization: false
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(22, 163, 74, 0.1)', padding: '10px', borderRadius: '12px', color: '#16a34a' }}>
              <Trees size={20} />
            </div>
            <div>
              <h3>Filtros de Pastagem</h3>
              <p>Otimize a oferta de forragem e rotação.</p>
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
            <label className="elite-filter-label">Status de Manejo <Activity size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {statusOptions.map(s => (
                <button 
                  key={s.id}
                  style={{ 
                    padding: '12px 8px', 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    color: filters.status === s.id ? '#16a34a' : '#64748b', 
                    background: filters.status === s.id ? '#f0fdf4' : 'transparent', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: filters.status === s.id ? '#16a34a' : '#e2e8f0',
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
            <label className="elite-filter-label">Variedades de Forrageiras <Zap size={14} /></label>
            <div className="elite-tag-cloud">
              {capins.map(c => (
                <button 
                  key={c}
                  className={`elite-tag-chip ${filters.capins?.includes(c) ? 'active' : ''}`}
                  onClick={() => toggleCapim(c)}
                  style={{ 
                    borderColor: filters.capins?.includes(c) ? '#16a34a' : '#e2e8f0', 
                    background: filters.capins?.includes(c) ? '#16a34a' : 'white',
                    color: filters.capins?.includes(c) ? 'white' : '#64748b'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Área da Divisão (ha) <Maximize size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a' }}>{filters.maxArea}ha</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Extensão Máxima</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="500" 
                step="5"
                value={filters.maxArea}
                onChange={e => setFilters({ ...filters, maxArea: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#16a34a', height: '6px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Capacidade de Suporte (UA/ha) <Target size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="filter-field">
                <label className="elite-label" style={{ fontSize: '10px', marginBottom: '8px' }}>Min UA</label>
                <input 
                  type="number" 
                  className="elite-input" 
                  value={filters.minUA}
                  onChange={e => setFilters({ ...filters, minUA: parseFloat(e.target.value) })}
                />
              </div>
              <div className="filter-field">
                <label className="elite-label" style={{ fontSize: '10px', marginBottom: '8px' }}>Max UA</label>
                <input 
                  type="number" 
                  className="elite-input" 
                  value={filters.maxUA}
                  onChange={e => setFilters({ ...filters, maxUA: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="elite-filter-section" style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: '#f59e0b' }}>
                  <Calendar size={18} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Necessita Adubação</span>
              </div>
              <input 
                type="checkbox" 
                checked={filters.needsFertilization}
                onChange={e => setFilters({ ...filters, needsFertilization: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#f59e0b' }}
              />
            </div>
          </div>
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#16a34a' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
