import React from 'react';
import { X, Filter, Check, Scale, TrendingUp, Calendar, AlertCircle, Target, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface WeightFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const WeightFilterModal: React.FC<WeightFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  if (!isOpen) return null;

  const performanceLevels = [
    { id: 'high', label: 'Alto Ganho (> 1.0kg)', color: '#10b981' },
    { id: 'medium', label: 'Médio (0.5 - 1.0kg)', color: '#f59e0b' },
    { id: 'low', label: 'Baixo Ganho (< 0.5kg)', color: '#ef4444' }
  ];

  const handleClear = () => {
    setFilters({
      minWeight: 0,
      maxWeight: 1000,
      minGMD: 0,
      maxGMD: 2,
      dateStart: '',
      dateEnd: '',
      performanceLevel: 'all',
      daysSinceLastWeighing: 0
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
            <div className="icon-wrapper primary" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', color: '#3b82f6' }}>
              <Scale size={20} />
            </div>
            <div>
              <h3>Filtros de Pesagem</h3>
              <p>Monitore o GMD e performance individual.</p>
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
            <label className="elite-filter-label">Nível de Performance (GMD) <TrendingUp size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {performanceLevels.map(level => (
                <button 
                  key={level.id}
                  style={{ 
                    padding: '12px 16px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: filters.performanceLevel === level.id ? 'white' : '#64748b', 
                    background: filters.performanceLevel === level.id ? level.color : 'white', 
                    borderRadius: '12px', 
                    border: '1px solid',
                    borderColor: filters.performanceLevel === level.id ? level.color : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => setFilters({ ...filters, performanceLevel: level.id })}
                >
                  <span>{level.label}</span>
                  {filters.performanceLevel === level.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Faixa de Peso (@ ou kg) <Target size={14} /></label>
            <div className="integrity-slider-container" style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Peso Mínimo</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#3b82f6' }}>{filters.minWeight} kg</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="500" 
                  step="5"
                  value={filters.minWeight}
                  onChange={e => setFilters({ ...filters, minWeight: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#3b82f6', height: '6px', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Peso Máximo</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#3b82f6' }}>{filters.maxWeight} kg</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1000" 
                  step="10"
                  value={filters.maxWeight}
                  onChange={e => setFilters({ ...filters, maxWeight: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#3b82f6', height: '6px', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Período da Pesagem <Calendar size={14} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input 
                type="date" 
                className="elite-input" 
                value={filters.dateStart}
                onChange={e => setFilters({ ...filters, dateStart: e.target.value })}
              />
              <input 
                type="date" 
                className="elite-input" 
                value={filters.dateEnd}
                onChange={e => setFilters({ ...filters, dateEnd: e.target.value })}
              />
            </div>
          </div>

          <div className="elite-filter-section">
            <label className="elite-filter-label">Check-up de Manejo <History size={14} /></label>
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>Dias sem pesar</span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#ef4444' }}>{filters.daysSinceLastWeighing}+ dias</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="120" 
                step="15"
                value={filters.daysSinceLastWeighing}
                onChange={e => setFilters({ ...filters, daysSinceLastWeighing: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#ef4444', height: '4px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        <div className="elite-sidebar-footer">
          <button className="glass-btn secondary" style={{ flex: 1 }} onClick={handleClear}>LIMPAR</button>
          <button className="primary-btn" style={{ flex: 1, background: '#3b82f6' }} onClick={onClose}>APLICAR</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
